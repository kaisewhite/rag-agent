import supabase from '../supabaseClient.js';
import dotenv from 'dotenv';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing required Supabase environment variables');
}

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
}

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small'
});

// Constants for chunking
const CHUNK_SIZE = 4000;  // Conservative size to ensure we stay well under 8192 tokens
const CHUNK_OVERLAP = 200;  // Overlap to maintain context between chunks

// Function to chunk content
async function chunkContent(content) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: CHUNK_SIZE,
        chunkOverlap: CHUNK_OVERLAP,
        separators: ["\n\n", "\n", " ", ""] // Try to split on paragraphs first
    });
    
    return await splitter.createDocuments([content]);
}

// Helper to clean search terms
function cleanSearchTerms(query) {
    // Remove special characters but keep important identifiers
    return query.replace(/[^\w\s-.,]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Helper to identify legal terms
function identifyLegalTerms(query) {
    const terms = [];
    
    // Document structure identifiers (make more flexible)
    const structureMatch = query.match(/(?:CHAPTER|ARTICLE|SECTION|§)\s*[\w-]+/gi) || [];
    terms.push(...structureMatch);
    
    // Common legal document terms
    const legalTerms = [
        'deed', 'deeds', 'conveyance', 'property', 'cemetery',
        'religious', 'corporation', 'presumption', 'purposes',
        'permit', 'license', 'certificate', 'registration',
        'application', 'authorization', 'approval'
    ];
    
    // Build regex patterns for exact and partial matches
    const patterns = [
        ...legalTerms.map(term => new RegExp(`\\b${term}s?\\b`, 'gi'))
    ];
    
    // Find matches
    patterns.forEach(pattern => {
        const matches = query.match(pattern) || [];
        terms.push(...matches);
    });
    
    return [...new Set(terms)]; // Remove duplicates
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let retries = 0;
    while (true) {
        try {
            return await fn();
        } catch (error) {
            retries++;
            if (retries > maxRetries) {
                throw error;
            }
            // Exponential backoff with jitter
            const delay = Math.min(initialDelay * Math.pow(2, retries - 1) + Math.random() * 1000, 10000);
            console.log(`Retry ${retries}/${maxRetries} after ${delay}ms delay`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Store content in Supabase
export async function storeRawContent({ url, title, content, metadata }) {
    if (!content) {
        throw new Error('No content provided for storage');
    }

    try {
        // Split content into chunks
        const chunks = await chunkContent(content);
        
        // Store each chunk with its own embedding
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkMetadata = {
                ...metadata,
                url,
                title,
                chunk: {
                    index: i,
                    total: chunks.length
                }
            };

            try {
                // Generate embedding for the chunk with retry logic
                const embedding = await retryWithBackoff(async () => {
                    return await embeddings.embedQuery(chunk.pageContent);
                }, 5, 2000); // 5 retries, starting with 2 second delay

                // Convert embedding array to Postgres vector format
                const vectorData = `[${embedding.join(',')}]`;

                // Insert directly into the documents table with properly formatted vector
                const { error } = await supabase
                    .from('documents')
                    .insert({
                        content: chunk.pageContent,
                        metadata: chunkMetadata,
                        embedding: vectorData
                    });

                if (error) {
                    throw new Error(`Failed to store chunk ${i}: ${error.message}`);
                }
            } catch (error) {
                console.error(`Error processing chunk ${i} for ${url}:`, error);
                // Skip this chunk but continue with others
                continue;
            }
        }
    } catch (error) {
        console.error('Error storing content:', error);
        throw error;
    }
}

// Semantic search with hybrid approach
export async function semanticSearch(query, embedding, state, limit = 5) {
    if (!state) {
        throw new Error('State parameter is required for documentation search');
    }

    try {
        // Get matching documents
        const { data: documents, error } = await supabase
            .rpc('match_documents', {
                query_embedding: embedding,
                match_threshold: 0.5,
                match_count: limit * 2, // Get more results to account for chunks
                filter: { state }
            });

        if (error) {
            throw error;
        }

        // Group chunks by URL and merge content
        const mergedDocs = documents.reduce((acc, doc) => {
            const url = doc.metadata.url;
            if (!acc[url]) {
                acc[url] = {
                    content: doc.content,
                    metadata: doc.metadata,
                    similarity: doc.similarity,
                    chunks: [doc]
                };
            } else {
                // Append content and keep highest similarity score
                acc[url].chunks.push(doc);
                acc[url].similarity = Math.max(acc[url].similarity, doc.similarity);
                // Sort chunks by index and combine content
                acc[url].chunks.sort((a, b) => 
                    a.metadata.chunk.index - b.metadata.chunk.index
                );
                acc[url].content = acc[url].chunks
                    .map(chunk => chunk.content)
                    .join('\n\n');
            }
            return acc;
        }, {});

        // Convert back to array and sort by similarity
        return Object.values(mergedDocs)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    } catch (error) {
        console.error('Error in semantic search:', error);
        throw error;
    }
}
