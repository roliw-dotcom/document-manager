-- Add a generated column that flattens the tags array to a space-separated
-- string so it can be searched with ILIKE via PostgREST.
--
-- GENERATED ALWAYS AS ... STORED means Postgres maintains it automatically
-- on every INSERT / UPDATE — no application changes required.

-- array_to_string is STABLE, but generated columns require IMMUTABLE.
-- Wrapping it in an IMMUTABLE function is safe here because the output
-- is fully determined by the input array and separator.
CREATE OR REPLACE FUNCTION _tags_to_text(arr text[])
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT array_to_string(arr, ' ')
$$;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS tags_text TEXT
  GENERATED ALWAYS AS (_tags_to_text(tags)) STORED;

-- A trigram index lets ILIKE with leading wildcards (%term%) use the index.
-- Requires the pg_trgm extension, which is pre-installed on Supabase.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_documents_tags_text_trgm
  ON documents USING gin (tags_text gin_trgm_ops);
