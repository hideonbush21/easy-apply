-- Migration 008: allow empty password_hash for email-only accounts
ALTER TABLE users ALTER COLUMN password_hash SET DEFAULT '';
