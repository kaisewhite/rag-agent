import crawler from './crawler.js';
import { saveJob, updateJob } from './jobStore.js';

// Get job info from process arguments
const [,, jobId, url] = process.argv;

async function runCrawler() {
    try {
        console.log(`Worker starting crawler job ${jobId} for URL: ${url}`);
        
        // Save initial status
        await saveJob(jobId, {
            status: 'running',
            url,
            startTime: new Date().toISOString(),
            error: null
        });

        // Run the crawler
        const result = await crawler.run([url]);
        
        // Update job with success
        await updateJob(jobId, {
            status: 'completed',
            completedTime: new Date().toISOString(),
            result
        });

        process.exit(0);
    } catch (error) {
        console.error(`Worker error for job ${jobId}:`, error);
        
        // Update job with error
        await updateJob(jobId, {
            status: 'failed',
            completedTime: new Date().toISOString(),
            error: error.message
        });

        process.exit(1);
    }
}

runCrawler();
