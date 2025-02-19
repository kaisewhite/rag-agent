import crawler from './src/crawler.js';
import { queryDocumentation } from './src/query.js';
import dotenv from 'dotenv';

dotenv.config();

const [,, command, ...args] = process.argv;

if (!command) {
    console.log(`
Usage:
  npm start crawl <url>     - Crawl a documentation website
  npm start query "<text>"  - Query the documentation
    
Example:
  npm start crawl https://docs.example.com
  npm start query "How do I authenticate users?"
`);
    process.exit(1);
}

async function main() {
    try {
        switch (command.toLowerCase()) {
            case 'crawl':
                if (args.length === 0) {
                    console.error('Please provide a URL to crawl');
                    process.exit(1);
                }
                console.log(`Starting crawler for ${args[0]}`);
                await crawler.run([args[0]]);
                break;

            case 'query':
                if (args.length === 0) {
                    console.error('Please provide a question to ask');
                    process.exit(1);
                }
                
                // Remove any "query" prefix if it exists
                const question = args
                    .join(' ')
                    .replace(/^query\s+/i, '');
                    
                console.log(`Question: ${question}\n`);
                console.log('Searching documentation...\n');
                
                // Get response
                const result = await queryDocumentation(question);
                
                // Display the answer
                if (result.answer) {
                    console.log('Answer:', result.answer);
                }
                
                // Display sources if available
                if (result.sources && result.sources.length > 0) {
                    console.log('\nSources:');
                    result.sources.forEach(source => {
                        if (source.similarity) {
                            console.log(`- ${source.title} (similarity: ${source.similarity.toFixed(2)}): ${source.url}`);
                        } else {
                            console.log(`- ${source.title}: ${source.url}`);
                        }
                    });
                }
                
                // Display error details if present
                if (result.error) {
                    console.error('\nError details:', result.error);
                }
                break;

            default:
                console.error('Unknown command. Use "crawl" or "query"');
                process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
