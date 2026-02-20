-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- documents table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
    filename          TEXT        NOT NULL,
    original_filename TEXT        NOT NULL,
    storage_path      TEXT        NOT NULL,
    file_size         BIGINT      NOT NULL,
    mime_type         TEXT        NOT NULL DEFAULT 'application/pdf',
    status            TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'processing', 'done', 'error')),
    category          TEXT,
    subcategory       TEXT,
    summary           TEXT,
    tags              TEXT[]      NOT NULL DEFAULT '{}',
    extracted_text    TEXT,
    error_message     TEXT,
    uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at      TIMESTAMPTZ
);

-- Indexes for the most common query patterns
CREATE INDEX IF NOT EXISTS idx_documents_user_id     ON documents (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status      ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_category    ON documents (category);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents (uploaded_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security — users only touch their own rows
-- ---------------------------------------------------------------------------
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "insert_own_documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "delete_own_documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage policies for the 'documents' bucket
-- Create the bucket first via the Supabase dashboard or:
--   INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
--
-- Files are stored at: {user_id}/{doc_id}/{original_filename}
-- The first path segment is always the user_id — policies enforce this.
-- ---------------------------------------------------------------------------

CREATE POLICY "storage_upload_own_folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "storage_read_own_files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "storage_delete_own_files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
