import express from 'express';
import { queryDocumentation } from '../../src/query.js';
import { STATE_MAPPING } from '../crawler/index.js';

const router = express.Router();

/**
 * @swagger
 * /v1/query/ask:
 *   post:
 *     summary: Ask a question about the documentation
 *     description: Ask a question about the documentation using RAG (Retrieval-Augmented Generation)
 *     tags: [Query]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - state
 *             properties:
 *               question:
 *                 type: string
 *                 description: The question to ask about the documentation
 *               state:
 *                 type: string
 *                 description: The state name (e.g., 'New York', 'California')
 *     responses:
 *       200:
 *         description: Question answered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: The answer to the question
 *                 suggestions:
 *                   type: array
 *                   description: Helpful suggestions when no results are found
 *                   items:
 *                     type: string
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         description: URL of the source documentation
 *                       title:
 *                         type: string
 *                         description: Title of the source document
 *                       score:
 *                         type: number
 *                         description: Similarity score of the source to the question
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: No relevant documentation found
 *       500:
 *         description: Internal server error
 */
router.post('/ask', async (req, res) => {
    try {
        const { question, state } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        if (!state) {
            return res.status(400).json({ error: 'State name is required' });
        }

        // Normalize state name
        const normalizedState = STATE_MAPPING[state.toLowerCase()] || state;

        const result = await queryDocumentation(question, normalizedState);
        
        // Return 404 if no relevant documentation is found
        if (!result.sources || result.sources.length === 0) {
            return res.status(404).json({
                answer: result.answer,
                suggestions: result.suggestions,
                sources: []
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in /ask:', error);
        res.status(500).json({ error: 'Failed to process query' });
    }
});

export default router;
