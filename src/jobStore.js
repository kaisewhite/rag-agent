import fs from 'fs/promises';
import path from 'path';

const JOBS_DIR = './.crawlee/jobs';

// Ensure jobs directory exists
async function ensureJobsDir() {
    try {
        await fs.mkdir(JOBS_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating jobs directory:', error);
    }
}

// Initialize jobs directory
ensureJobsDir();

export async function saveJob(jobId, jobData) {
    try {
        const jobPath = path.join(JOBS_DIR, `${jobId}.json`);
        await fs.writeFile(jobPath, JSON.stringify(jobData, null, 2));
    } catch (error) {
        console.error(`Error saving job ${jobId}:`, error);
    }
}

export async function getJob(jobId) {
    try {
        const jobPath = path.join(JOBS_DIR, `${jobId}.json`);
        const jobData = await fs.readFile(jobPath, 'utf8');
        return JSON.parse(jobData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        console.error(`Error reading job ${jobId}:`, error);
        throw error;
    }
}

export async function updateJob(jobId, updates) {
    try {
        const job = await getJob(jobId);
        if (!job) {
            return false;
        }
        
        const updatedJob = { ...job, ...updates };
        await saveJob(jobId, updatedJob);
        return true;
    } catch (error) {
        console.error(`Error updating job ${jobId}:`, error);
        return false;
    }
}
