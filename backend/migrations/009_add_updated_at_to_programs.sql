-- Migration 009: add updated_at to programs table
ALTER TABLE programs ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
UPDATE programs SET updated_at = created_at WHERE updated_at IS NULL;
