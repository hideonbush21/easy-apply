-- Migration 003: create sop_letters table
CREATE TABLE IF NOT EXISTS sop_letters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sop_letters_user_id ON sop_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_sop_letters_application_id ON sop_letters(application_id);
