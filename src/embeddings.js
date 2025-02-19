import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
}

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.LLM_MODEL || 'text-embedding-3-small'
});

// Function to generate embeddings for text
export async function embedText(text) {
    try {
        // Clean text before embedding
        const cleanedText = text
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s.,?!-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Generate embedding
        const embedding = await embeddings.embedQuery(cleanedText);
        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error(`Failed to generate embedding: ${error.message}`);
    }
}

// Function to generate embeddings for multiple texts
export async function embedBatch(texts, batchSize = 20) {
    try {
        const batches = [];
        for (let i = 0; i < texts.length; i += batchSize) {
            batches.push(texts.slice(i, i + batchSize));
        }

        const results = [];
        for (const batch of batches) {
            const batchEmbeddings = await Promise.all(
                batch.map(text => embedText(text))
            );
            results.push(...batchEmbeddings);

            // Rate limiting delay between batches
            if (batch !== batches[batches.length - 1]) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    } catch (error) {
        console.error('Error generating batch embeddings:', error);
        throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
}
