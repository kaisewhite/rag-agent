import { CheerioCrawler, downloadListOfUrls, RequestQueue, Configuration } from 'crawlee';
import TurndownService from 'turndown';
import robotsParser from 'robots-parser';
import fetch from 'node-fetch';
import { storeRawContent } from './utils/storage.js';
import dotenv from 'dotenv';
import PDFParser from 'pdf2json';
import { MemoryStorage } from '@crawlee/memory-storage';

dotenv.config();

// Helper function to parse PDF using pdf2json
const parsePDF = async (buffer) => {
    if (!buffer || buffer.length === 0) {
        throw new Error('Empty PDF buffer received');
    }

    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            if (!pdfData || !pdfData.Pages || pdfData.Pages.length === 0) {
                reject(new Error('No pages found in PDF'));
                return;
            }

            resolve({
                text: decodeURIComponent(pdfData.Pages.reduce((text, page) => {
                    return text + page.Texts.map(t => t.R.map(r => r.T).join(' ')).join(' ') + '\n';
                }, '')),
                info: {
                    pages: pdfData.Pages.length,
                    metadata: pdfData.Metadata || {},
                    version: pdfData.Meta?.PDFFormatVersion,
                }
            });
        });
        
        pdfParser.on('pdfParser_dataError', (error) => {
            reject(new Error(`PDF parsing failed: ${error}`));
        });

        try {
            pdfParser.parseBuffer(buffer);
        } catch (error) {
            reject(new Error(`PDF buffer parsing failed: ${error.message}`));
        }
    });
};

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    hr: '---',
    bulletListMarker: '-'
});

// Supported content types and their handlers
const SUPPORTED_CONTENT_TYPES = {
    'text/html': async (response) => {
        const $ = response.$;
        return cleanContent($);
    },
    'application/pdf': async (response) => {
        try {
            console.log('PDF Response type:', {
                bodyType: typeof response.body,
                isBuffer: Buffer.isBuffer(response.body),
                isUint8Array: response.body instanceof Uint8Array,
                hasBody: !!response.body,
                responseKeys: Object.keys(response)
            });

            let pdfBuffer;
            
            // Handle different types of response.body
            if (Buffer.isBuffer(response.body)) {
                pdfBuffer = response.body;
            } else if (response.body instanceof Uint8Array) {
                pdfBuffer = Buffer.from(response.body);
            } else if (typeof response.body === 'string') {
                pdfBuffer = Buffer.from(response.body, 'binary');
            } else if (response.$ && response.$.html()) {
                // If we got HTML instead of PDF, try to find the PDF link
                const pdfLink = response.$('a[href$=".pdf"]').first().attr('href');
                if (pdfLink) {
                    // Download the PDF directly
                    const pdfResponse = await fetch(pdfLink);
                    if (!pdfResponse.ok) {
                        throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
                    }
                    const arrayBuffer = await pdfResponse.arrayBuffer();
                    pdfBuffer = Buffer.from(arrayBuffer);
                } else {
                    throw new Error('PDF link not found in HTML response');
                }
            } else if (response.body && response.body.toString) {
                // Last resort: try to convert body to string
                pdfBuffer = Buffer.from(response.body.toString(), 'binary');
            } else {
                throw new Error(`Unsupported PDF response body type: ${typeof response.body}`);
            }

            // Verify we have a valid PDF buffer
            if (pdfBuffer.length === 0) {
                throw new Error('Empty PDF buffer received');
            }

            // Check for PDF magic number (%PDF-)
            if (!pdfBuffer.toString('ascii', 0, 5).startsWith('%PDF-')) {
                throw new Error('Invalid PDF format: Missing PDF header');
            }

            const data = await parsePDF(pdfBuffer);

            if (!data || !data.text || data.text.trim().length === 0) {
                throw new Error('No text content extracted from PDF');
            }

            return {
                title: data.info.metadata.title || 'PDF Document',
                content: data.text.trim(),
                metadata: {
                    pages: data.info.pages,
                    pdfVersion: data.info.version,
                    ...data.info.metadata
                }
            };
        } catch (error) {
            console.error('PDF processing error:', error.message);
            throw new Error(`PDF processing failed: ${error.message}`);
        }
    },
    'text/calendar': async (response) => {
        // Handle calendar files as plain text
        const content = response.body.toString();
        return {
            title: 'Calendar Events',
            content,
            metadata: {
                type: 'calendar'
            }
        };
    }
};

// Progress tracker utility
class ProgressTracker {
    constructor() {
        this.lastUpdate = 0;
        this.processed = 0;
        this.stored = 0;
        this.skipped = 0;
    }

    update(type) {
        this.processed++;
        if (type === 'stored') this.stored++;
        if (type === 'skipped') this.skipped++;

        const now = Date.now();
        if (now - this.lastUpdate >= 30000) {
            console.log(`Progress: Processed ${this.processed} pages (${this.stored} stored, ${this.skipped} skipped)`);
            this.lastUpdate = now;
        }
    }
}

// Function to check robots.txt
async function canCrawl(url) {
    try {
        const robotsUrl = new URL('/robots.txt', url).toString();
        const response = await fetch(robotsUrl);
        const robotsTxt = await response.text();
        const robots = robotsParser(robotsUrl, robotsTxt);
        return robots.isAllowed(url, 'CrawleeBot');
    } catch (error) {
        console.warn(`Could not fetch robots.txt: ${error.message}`);
        return true;
    }
}

// Function to clean and structure the content
function cleanContent($) {
    // Remove script and style elements
    $('script, style').remove();
    
    // Remove common noisy elements but keep headers and footers
    $('.advertisement, .comments, .social-share, .ad-container').remove();
    
    // Find main content area
    const mainContent = $('main, article, .main-content, .content').first();
    
    if (mainContent.length) {
        return {
            title: $('title').text().trim(),
            content: mainContent.html(),
            metadata: {
                author: $('meta[name="author"]').attr('content'),
                created: $('meta[property="article:published_time"]').attr('content'),
                modified: $('meta[property="article:modified_time"]').attr('content')
            }
        };
    }
    
    // Fallback to body content
    return {
        title: $('title').text().trim(),
        content: $('body').html(),
        metadata: {
            author: $('meta[name="author"]').attr('content'),
            created: $('meta[property="article:published_time"]').attr('content'),
            modified: $('meta[property="article:modified_time"]').attr('content')
        }
    };
}

class DocumentationCrawler {
    constructor() {
        this.progress = new ProgressTracker();
        // Initialize memory storage and configuration
        this.storage = new MemoryStorage();
        Configuration.getGlobalConfig().set('storage', this.storage);
    }

    async run(startUrls, options = {}) {
        if (!Array.isArray(startUrls)) {
            throw new Error('startUrls must be an array');
        }

        if (!options.state) {
            throw new Error('state is required in options');
        }

        const state = options.state;  
        console.log(`Starting crawl for ${state} from ${startUrls.length} URLs`);

        // Create a new request queue
        const requestQueue = await RequestQueue.open('default');
        
        const crawler = new CheerioCrawler({
            maxRequestsPerCrawl: 10000,
            maxConcurrency: 2,
            additionalMimeTypes: ['application/pdf', 'text/calendar'],
            requestHandlerTimeoutSecs: 180,
            maxRequestRetries: 5,
            useSessionPool: false,
            requestQueue,
            navigationTimeoutSecs: 120,
            downloadTimeout: 180000, // 3 minutes for downloads
            suggestResponseEncoding: 'binary',
            forceResponseEncoding: true,
            requestHandler: async ({ request, response, $, enqueueLinks, crawler }) => {
                const url = request.url;
                const basePath = request.userData.basePath;

                // Add delay between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (!await canCrawl(url)) {
                    this.progress.update('skipped');
                    return;
                }

                try {
                    let contentType = response.headers['content-type']?.split(';')[0].toLowerCase();
                    
                    // Special handling for PDFs
                    if (url.toLowerCase().endsWith('.pdf')) {
                        contentType = 'application/pdf';
                        // For PDFs, ensure we have binary data
                        if (typeof response.body === 'string') {
                            response.body = Buffer.from(response.body, 'binary');
                        }
                    } else if (contentType === 'application/octet-stream' && url.toLowerCase().endsWith('.pdf')) {
                        contentType = 'application/pdf';
                    }
                    
                    const handler = SUPPORTED_CONTENT_TYPES[contentType];

                    if (!handler) {
                        console.log(`Skipping unsupported content type: ${contentType} for ${url}`);
                        this.progress.update('skipped');
                        return;
                    }

                    const { title, content, metadata } = await handler({ $, body: response.body, response });
                    
                    // Convert HTML to markdown if it's HTML content
                    const finalContent = contentType === 'text/html' ? 
                        turndownService.turndown(content) : 
                        content;
                    
                    if (!finalContent || finalContent.trim().length < 50) {
                        this.progress.update('skipped');
                        return;
                    }

                    await storeRawContent({
                        url,
                        title,
                        content: finalContent,
                        metadata: {
                            ...metadata,
                            contentType,
                            state,
                            crawledAt: new Date().toISOString()
                        }
                    });

                    this.progress.update('stored');

                    if (contentType === 'text/html') {
                        await enqueueLinks({
                            globs: [`${basePath}/**`],
                            userData: { state, basePath },
                            transformRequestFunction: (req) => {
                                req.retryCount = 0;
                                req.useExtendedUniqueKey = true;
                                req.noRetry = false;
                                req.timeoutSecs = 120;
                                // Set binary encoding for PDF requests
                                if (req.url.toLowerCase().endsWith('.pdf')) {
                                    req.encoding = 'binary';
                                }
                                return req;
                            }
                        });
                    }

                } catch (error) {
                    this.progress.update('skipped');
                    console.error(`Error processing ${url}:`, error.message);
                    
                    if (error.message.includes('timeout')) {
                        console.warn(`Timeout occurred for ${url} after ${request.retryCount} retries`);
                    }
                }
            }
        });

        crawler.router.addDefaultHandler(async ({ request, page, enqueueLinks, crawler: crawlerInstance }) => {
            if (request.retryCount > 0) {
                const delay = Math.min(Math.pow(2, request.retryCount) * 1000, 30000); 
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return crawlerInstance.defaultRequestHandler({ request, page, enqueueLinks });
        });

        for (const url of startUrls) {
            const basePath = new URL(url).origin;
            await crawler.run([{
                url,
                userData: { state, basePath }
            }]);
        }
        
        console.log(`Crawl completed for ${state}. Final stats:
Processed: ${this.progress.processed}
Stored: ${this.progress.stored}
Skipped: ${this.progress.skipped}`);
    }
}

export default new DocumentationCrawler();
