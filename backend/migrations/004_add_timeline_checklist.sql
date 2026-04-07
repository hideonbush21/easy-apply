-- Migration 004: add timeline_checklist column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timeline_checklist JSONB;
