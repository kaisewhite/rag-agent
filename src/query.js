import { OpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { 
    ChatPromptTemplate, 
    HumanMessagePromptTemplate, 
    SystemMessagePromptTemplate,
    PromptTemplate
} from "@langchain/core/prompts";
import { 
    RunnablePassthrough,
    RunnableSequence 
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { formatDocumentsAsString } from "langchain/util/document";
import supabase from './supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
}

const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.LLM_MODEL || 'gpt-4-turbo-preview',
    temperature: 0.3
});

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small'
});

// Initialize the vector store for similarity search
const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",  
    similarityK: 20,  
});

const SYSTEM_TEMPLATE = `You are a friendly and helpful legal documentation assistant for US state laws. Your purpose is to help everyday people understand state-specific legal documentation and regulations in simple terms.

Role and Behavior:
1. Be friendly and approachable in your responses
2. Explain legal concepts in plain, everyday language
3. Define any legal terms or jargon when you use them
4. Use simple examples when helpful
5. Break down complex legal concepts into smaller, understandable parts

Documentation Context:
{context}

Remember: 
- Explain everything as if you're talking to a teenager
- Break down complex legal language into simple terms
- Keep your explanation accurate but easy to understand
- It's okay to simplify, but don't leave out important details
- Use examples from everyday life when it helps explain the law`;

const messages = [
    SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
    HumanMessagePromptTemplate.fromTemplate("{question}")
];

const prompt = ChatPromptTemplate.fromMessages(messages);

// Helper function to generate alternative questions
function generateAlternativeQuestion(question) {
    // Extract key terms from the question
    const keyTerms = question.toLowerCase().match(/\b(police|cop|officer|id|identification|rights|law|legal|arrest|stop|detain)\b/g) || [];
    
    // Common legal question patterns
    const patterns = {
        'police|cop|officer': {
            prefix: 'What are',
            suffix: 'in my state?',
            subject: 'the rules for police officers',
            actions: {
                'id|identification': 'regarding identification requests',
                'rights': 'about citizen interactions',
                'arrest|stop|detain': 'about detaining individuals'
            }
        }
    };
    
    // Find matching pattern
    for (const [term, pattern] of Object.entries(patterns)) {
        if (keyTerms.some(t => t.match(new RegExp(term)))) {
            for (const [actionTerm, action] of Object.entries(pattern.actions)) {
                if (keyTerms.some(t => t.match(new RegExp(actionTerm)))) {
                    return `${pattern.prefix} ${pattern.subject} ${action} ${pattern.suffix}`;
                }
            }
        }
    }
    
    // Default suggestion if no pattern matches
    return 'Could you rephrase your question to be more specific about what you want to know?';
}

// Helper function to generate situational suggestions
function generateSituationalSuggestion(question) {
    // Common situations based on question context
    const situations = {
        'id|identification': 'traffic stop, routine patrol, or at a public event',
        'rights|legal': 'specific circumstance or location',
        'arrest|stop|detain': 'traffic violation, suspicious activity, or emergency situation'
    };
    
    for (const [terms, situation] of Object.entries(situations)) {
        if (question.toLowerCase().match(new RegExp(`\\b(${terms})\\b`))) {
            return `Specify if you're asking about a particular situation, like during a ${situation}.`;
        }
    }
    
    return "Specify the particular situation you're asking about.";
}

// Helper function to generate topic suggestions
function generateTopicSuggestion(question) {
    // Common legal topics based on question context
    const topics = {
        'id|identification': 'Consider asking about specific police procedures or citizen rights during identification checks.',
        'rights|legal': 'Try asking about your specific rights in this situation.',
        'arrest|stop|detain': 'You might want to ask about the legal requirements for police stops or detentions.'
    };
    
    for (const [terms, suggestion] of Object.entries(topics)) {
        if (question.toLowerCase().match(new RegExp(`\\b(${terms})\\b`))) {
            return suggestion;
        }
    }
    
    return "Try focusing your question on specific legal rights or procedures.";
}

export async function queryDocumentation(question, state) {
    try {
        // Extract section number if present
        const sectionMatch = question.match(/§?\s*(\d+)/);
        const sectionNumber = sectionMatch ? sectionMatch[1] : null;
        
        // Construct a more specific search query
        const searchQuery = `${state} ${question} restaurant permits business licenses regulations`;
        
        // Get initial results
        const results = await vectorStore.similaritySearchWithScore(
            searchQuery,
            20,  
            { state }
        );
        
        // Score boosting function
        const getAdjustedScore = (doc, baseScore) => {
            let score = baseScore;
            const url = doc.metadata?.url || '';
            const content = (doc.pageContent || doc.content || '').toLowerCase();
            const question_lower = question.toLowerCase();
            
            // Boost exact section matches
            if (sectionNumber && url.includes(`/${sectionNumber}`)) {
                score += 0.3;
            }
            
            // Boost content matches
            if (sectionNumber && content.includes(`section ${sectionNumber}`)) {
                score += 0.2;
            }

            // Boost restaurant/permit related content
            if (content.includes('restaurant') || 
                content.includes('permit') || 
                content.includes('license') || 
                content.includes('business registration')) {
                score += 0.2;
            }
            
            // Cap score at 1.0
            return Math.min(score, 1.0);
        };

        // Apply scoring adjustments
        const processedDocs = results
            .map(([doc, score]) => ({
                ...doc,
                similarity: getAdjustedScore(doc, score)
            }))
            .sort((a, b) => b.similarity - a.similarity);

        // Format the documents into a string for context
        const context = processedDocs
            .filter(doc => doc.similarity >= 0.6) // Only use higher quality matches
            .slice(0, 5) // Limit to top 5 most relevant documents
            .map(doc => {
                const source = doc.metadata?.url ? `\nSource: ${doc.metadata.url}` : '';
                return `Relevant Information:${source}\n${doc.pageContent}\n---\n`;
            })
            .join('\n');

        // Update system template with state-specific context
        const stateTemplate = SYSTEM_TEMPLATE + `\n\nState: ${state}\nFocus: Restaurant permits and business licenses\n`;

        // Create the chain with all documents for context
        const chain = RunnableSequence.from([
            PromptTemplate.fromTemplate(stateTemplate),
            llm,
            new StringOutputParser()
        ]);

        // Get the answer using all available context
        const answer = await chain.invoke({ 
            question,
            context: context || 'No specific documentation found for this query.'
        });

        // Filter sources to only include high-quality matches
        const highQualitySources = processedDocs
            .filter(doc => doc.similarity >= 0.5)
            .slice(0, 4)
            .map(doc => ({
                url: doc.metadata?.url || '',
                title: doc.metadata?.title || 'Untitled Document',
                score: doc.similarity
            }));

        return { 
            answer, 
            sources: highQualitySources,
            suggestions: highQualitySources.length === 0 ? [
                generateAlternativeQuestion(question),
                generateSituationalSuggestion(question),
                generateTopicSuggestion(question)
            ] : []
        };
    } catch (error) {
        console.error('Error in queryDocumentation:', error);
        throw error;
    }
}

// Example usage if run directly
if (process.argv[2] && process.argv[3]) {
    const question = process.argv.slice(2, -1).join(' ');
    const state = process.argv[process.argv.length - 1];
    console.log(`Question: ${question}`);
    console.log(`State: ${state}`);
    console.log('\nSearching documentation...\n');
    
    queryDocumentation(question, state)
        .then(result => {
            console.log('Answer:', result.answer);
            if (result.sources && result.sources.length > 0) {
                console.log('\nSources:');
                result.sources.forEach(source => {
                    console.log(`- ${source.title}: ${source.url} (Score: ${source.score})`);
                });
            }
            if (result.suggestions && result.suggestions.length > 0) {
                console.log('\nSuggestions:');
                result.suggestions.forEach(suggestion => {
                    console.log(`- ${suggestion}`);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error.message);
        });
}
