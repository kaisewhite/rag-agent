# Documentation RAG Agent

An intelligent documentation crawler and RAG (Retrieval-Augmented Generation) agent built using LangChain, Supabase, and OpenAI. The agent can crawl documentation websites, store content in a vector database, and provide intelligent answers to user questions by retrieving and analyzing relevant documentation chunks.

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

## Prerequisites

- Node.js 16+
- Supabase account
- OpenAI API key

## Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone [repository-url]
   cd audit-the-audit-api
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file with the following:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   LLM_MODEL=gpt-4-turbo-preview  # or your preferred model

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_key
   DATABASE_URL=your_database_url
   ```

3. **Set Up Supabase Database**
   Run the SQL commands in `supabase/init.sql` in your Supabase SQL editor:
   - Creates required tables
   - Enables pgvector extension
   - Sets up similarity search function

## Usage

### Crawling Documentation
```bash
# Crawl a documentation website
npm start crawl https://docs.example.com
```

The crawler will:
- Check robots.txt compliance
- Extract main content
- Convert to clean Markdown
- Generate embeddings
- Store in Supabase

### Querying Documentation
```bash
# Ask a question about the documentation
npm start query "Tell me about Python-centric Design"
```

The system will:
- Generate embeddings for your question
- Find relevant documentation chunks
- Generate a contextual answer
- Provide source references

## Project Structure

```
.
├── src/
│   ├── crawler.js      # Documentation crawler
│   ├── query.js        # RAG query interface
│   └── utils/
│       ├── processor.js # Content processing
│       └── storage.js   # Supabase integration
├── supabase/
│   └── init.sql        # Database setup
├── .env                # Configuration
└── index.js           # CLI interface
```

## Advanced Configuration

### Crawler Settings
Adjust in `src/crawler.js`:
```javascript
const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 50,  // Max pages to crawl
    maxConcurrency: 2,        // Concurrent requests
    // ... other options
});
```

### Content Processing
Modify in `src/utils/processor.js`:
```javascript
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,          // Characters per chunk
    chunkOverlap: 200,        // Overlap between chunks
    // ... other options
});
```

### Vector Search
Configure in `src/utils/storage.js`:
```javascript
const { data } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.7,     // Similarity threshold
    match_count: 5            // Number of matches
});
```

## Error Handling

The system includes comprehensive error handling:
- Crawler failures
- Database connection issues
- API rate limits
- Invalid queries
- Missing content

Error messages are user-friendly and include debugging information when needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Acknowledgments

Built with:
- [Crawlee](https://crawlee.dev/) - Web crawling framework
- [LangChain](https://js.langchain.com/) - LLM framework
- [Supabase](https://supabase.com/) - Vector database
- [OpenAI](https://openai.com/) - Embeddings and LLM


