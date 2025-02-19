-- Create IVFFlat index for vector similarity search if it doesn't exist
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

-- Create GIN index for metadata search if it doesn't exist
CREATE INDEX IF NOT EXISTS documents_metadata_idx ON documents USING GIN (metadata);
