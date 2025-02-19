-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing table if it exists
DROP TABLE IF EXISTS documents;

-- Create the documents table
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    content TEXT,
    metadata JSONB,
    embedding vector(1536)  -- dimension size for text-embedding-3-small
);

-- Create GiST index for vector similarity search
CREATE INDEX ON documents USING gist (embedding vector_cosine_ops);

-- Create GIN index for metadata search
CREATE INDEX ON documents USING GIN (metadata);
