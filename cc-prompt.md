This solution is an intelligent documentation crawler and RAG (Retrieval-Augmented Generation) agent built using Crawlee, LangChainJS, OpenAI, and Supabase. The agent can crawl documentation websites, store content in a vector database, and provide intelligent answers to user questions by retrieving and analyzing relevant documentation chunks. Since CheerioCrawler uses raw HTTP requests to download web pages, it is very fast and efficient on data bandwidth. We are going to crawl each webpage and convert the HTML into Markdown.

## Features

### 🤖 Smart Documentation Crawling
- Ethical web crawling with robots.txt compliance
- Intelligent HTML to Markdown conversion
- Automatic content cleaning and noise removal
- Smart content chunking for optimal retrieval

### 🧮 Vector Database Integration
- Supabase pgvector storage
- OpenAI embeddings for semantic search
- Efficient similarity matching
- Structured metadata storage

### 🔍 Intelligent RAG System
- LangChain-powered question answering
- Context-aware responses
- Source attribution for answers
- Semantic search capabilities

### 🛠 Technical Features
- Async/concurrent crawling
- Error handling and recovery
- Rate limiting and polite crawling
- Modular and extensible architecture

## AI Agent for Legal Document Crawling and Querying

### Overview
This solution extends the documentation crawler to support legal document crawling and querying. The agent will:
- Crawl legal websites, extracting relevant URLs within the same domain.
- Clean raw HTML, removing unnecessary elements like headers and footers.
- Convert cleaned HTML into Markdown format.
- Store the Markdown content in a Supabase vector database.

### API Routes
1. **Crawl Website**
   - **POST `/api/crawl`**
   - Accepts `website_url` and `state` as parameters.
   - Triggers the Crawlee crawler to scrape, process, and store the data in Supabase.

2. **Query Legal Information**
   - **POST `/api/query`**
   - Accepts `query` and `state` parameters.
   - Uses OpenAI embeddings to process the query and retrieve the most relevant information from the vector database.

### Workflow
1. **Crawling with Crawlee:** Crawl the website to gather all URLs following the given domain structure.
2. **Data Processing:** Extract raw HTML, clean unnecessary elements, convert to Markdown.
3. **Storage:** Store Markdown content in Supabase with vector embeddings for semantic search.
4. **Query System:** Use LangChain and OpenAI for querying stored legal documents.

This file is an instruction and must not be edited.

You are an experienced JavaScript developer with a flair for backend development. You must review the `README.md` and `CHECKPOINT.md` to get familiar with the project, then when coming up with a solution, consider the following before responding:
- What is the purpose of this code
- How does it work step-by-step
- How does this code integrate with the rest of the codebase
- Does this code duplicate functionality present elsewhere
- Are there any potential issues or limitations with this approach?

When making changes to the codebase, review `REGRESSIONS.md` to ensure that the change does not break any existing functionality.

Accuracy and completeness are of utmost importance. When clarification is required, ask for it.

Other Notes:
Once you are done, respond with the current date and time in the following format: `YYYY-MM-DD HH:MM:SS`

