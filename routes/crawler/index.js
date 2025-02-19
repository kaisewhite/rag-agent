import express from 'express';
import crawler from '../../src/crawler.js';

const router = express.Router();

// Map of state names to their standardized format
export const STATE_MAPPING = {
    'alabama': 'Alabama',
    'alaska': 'Alaska',
    'arizona': 'Arizona',
    'arkansas': 'Arkansas',
    'california': 'California',
    'colorado': 'Colorado',
    'connecticut': 'Connecticut',
    'delaware': 'Delaware',
    'florida': 'Florida',
    'georgia': 'Georgia',
    'hawaii': 'Hawaii',
    'idaho': 'Idaho',
    'illinois': 'Illinois',
    'indiana': 'Indiana',
    'iowa': 'Iowa',
    'kansas': 'Kansas',
    'kentucky': 'Kentucky',
    'louisiana': 'Louisiana',
    'maine': 'Maine',
    'maryland': 'Maryland',
    'massachusetts': 'Massachusetts',
    'michigan': 'Michigan',
    'minnesota': 'Minnesota',
    'mississippi': 'Mississippi',
    'missouri': 'Missouri',
    'montana': 'Montana',
    'nebraska': 'Nebraska',
    'nevada': 'Nevada',
    'new hampshire': 'New Hampshire',
    'new jersey': 'New Jersey',
    'new mexico': 'New Mexico',
    'new york': 'New York',
    'north carolina': 'North Carolina',
    'north dakota': 'North Dakota',
    'ohio': 'Ohio',
    'oklahoma': 'Oklahoma',
    'oregon': 'Oregon',
    'pennsylvania': 'Pennsylvania',
    'rhode island': 'Rhode Island',
    'south carolina': 'South Carolina',
    'south dakota': 'South Dakota',
    'tennessee': 'Tennessee',
    'texas': 'Texas',
    'utah': 'Utah',
    'vermont': 'Vermont',
    'virginia': 'Virginia',
    'washington': 'Washington',
    'west virginia': 'West Virginia',
    'wisconsin': 'Wisconsin',
    'wyoming': 'Wyoming'
};

/**
 * @swagger
 * /v1/crawler/states:
 *   get:
 *     summary: Get list of available states
 *     description: Returns a list of all US states that can be used for crawling and querying
 *     tags: [Crawler]
 *     responses:
 *       200:
 *         description: List of states retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 states:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Alabama", "Alaska", "Arizona", ...]
 */
router.get('/states', (req, res) => {
    const states = Object.values(STATE_MAPPING).sort();
    res.json({ states });
});

/**
 * @swagger
 * /v1/crawler/crawl:
 *   post:
 *     summary: Crawl legal documentation URLs
 *     description: Crawls one or more URLs for legal documentation and stores the content
 *     tags: [Crawler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - urls
 *               - state
 *             properties:
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of URLs to crawl
 *               state:
 *                 type: string
 *                 description: The state name (e.g., 'New York', 'California')
 *           example:
 *             urls: ["https://www.nysenate.gov/legislation/laws/ABC"]
 *             state: "New York"
 *     responses:
 *       200:
 *         description: Crawling started successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/crawl', async (req, res) => {
    try {
        const { urls, state } = req.body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'urls must be a non-empty array of strings' });
        }

        if (!state) {
            return res.status(400).json({ error: 'State name is required' });
        }

        // Normalize state name
        const normalizedState = STATE_MAPPING[state.toLowerCase()] || state;

        // Return immediately as crawling runs in background
        res.json({ 
            message: 'Crawling started', 
            urls,
            state: normalizedState
        });

        // Start crawling asynchronously after response is sent
        try {
            await crawler.run(urls, { state: normalizedState });
            console.log(`Crawling completed for URLs:`, urls);
        } catch (error) {
            console.error(`Crawling failed:`, error);
        }
    } catch (error) {
        console.error('Error starting crawler:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to start crawler' });
        }
    }
});


export default router;
