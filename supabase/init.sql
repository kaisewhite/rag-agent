-- Enable the pgvector extension to work with embedding vectors
-- create extension vector;

-- Create a table for storing document chunks
create table documents (
    id bigint primary key generated always as identity,
    content text,
    metadata jsonb,
    embedding vector(1536)
);

-- Create a function to search for similar documents
create or replace function match_documents (
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    metadata jsonb default '{}'::jsonb
)
returns table (
    id bigint,
    content text,
    metadata jsonb,
    similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  -- Set statement timeout to 29 seconds (slightly less than API timeout)
  set local statement_timeout = '29s';
  
  return query
  select
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where 
    -- Apply state filter if provided
    (metadata->>'state' = metadata->>'state' or metadata->>'state' is null)
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create function for matching documents with state filter
create or replace function match_documents_state(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  state_filter text
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  -- Set statement timeout to 29 seconds (slightly less than API timeout)
  set local statement_timeout = '29s';
  
  return query
  select
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where 
    metadata->>'state' = state_filter
    -- Use a lower initial threshold for more candidates
    and 1 - (embedding <=> query_embedding) > match_threshold * 0.5
  order by embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create indexes for better performance
create index if not exists documents_embedding_idx 
  on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists documents_state_idx 
  on documents ((metadata->>'state'));

-- Create index on content for text search
create index if not exists documents_content_idx 
  on documents using gin (to_tsvector('english', content));

-- Create index on metadata for faster JSON access
create index if not exists documents_metadata_idx 
  on documents using gin (metadata);

-- Analyze tables for better query planning
analyze documents;

-- Disable RLS for now to allow crawler to work
alter table documents disable row level security;

-- Drop existing policies if any
drop policy if exists "Enable read access to all users" on documents;
drop policy if exists "Enable insert access to all users" on documents;
drop policy if exists "Enable update access to all users" on documents;

-- Create policies for authenticated users
create policy "Enable read access for all users"
    on documents for select
    using (true);

create policy "Enable insert access for all users"
    on documents for insert
    with check (true);

create policy "Enable update access for all users"
    on documents for update
    using (true);

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all privileges on table documents to anon, authenticated;
grant all privileges on sequence documents_id_seq to anon, authenticated;

-- Create IVFFlat index for vector similarity search if it doesn't exist
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

-- Create GIN index for metadata search if it doesn't exist
CREATE INDEX IF NOT EXISTS documents_metadata_idx ON documents USING GIN (metadata);
