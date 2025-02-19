import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.LLM_MODEL || 'text-embedding-3-small'
});

// Function to split content into chunks with smart overlap
async function splitIntoChunks(text) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 200,
        separators: [
            "\n## ", // Headers
            "\n\n", // Paragraphs
            "\n", // Lines
            ". ", // Sentences
            " ", // Words
            "" // Characters
        ]
    });

    return await splitter.createDocuments([text]);
}

// Clean text for better embedding quality
function cleanTextForEmbedding(text) {
    return text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s.,?!-]/g, ' ') // Keep only basic punctuation
        .replace(/\s+/g, ' ') // Normalize whitespace again
        .trim();
}

// Process content for vector database storage
export async function processForVectorDB(markdown, title, url) {
    try {
        // Split the content into chunks
        const chunks = await splitIntoChunks(markdown);
        
        // Process each chunk with improved metadata
        const processedChunks = await Promise.all(chunks.map(async (chunk, index) => {
            // Clean text for embedding
            const cleanedText = cleanTextForEmbedding(chunk.pageContent);
            
            // Generate embedding
            const embedding = await embeddings.embedQuery(cleanedText);
            
            // Calculate chunk metrics
            const wordCount = chunk.pageContent.split(/\s+/).length;
            const charCount = chunk.pageContent.length;
            
            return {
                content: chunk.pageContent,
                embedding,
                metadata: {
                    title,
                    url,
                    chunk_index: index,
                    chunk_total: chunks.length,
                    word_count: wordCount,
                    char_count: charCount,
                    timestamp: new Date().toISOString(),
                    has_code: /\`\`\`|\`[^\`]+\`/.test(chunk.pageContent),
                    has_list: /^[-*]\s/m.test(chunk.pageContent),
                    has_table: /\|.*\|/.test(chunk.pageContent)
                }
            };
        }));

        console.log(`Processed ${processedChunks.length} chunks for document: ${title}`);
        return processedChunks;
    } catch (error) {
        console.error('Error processing content for vector DB:', error);
        throw new Error(`Failed to process content: ${error.message}`);
    }
}
