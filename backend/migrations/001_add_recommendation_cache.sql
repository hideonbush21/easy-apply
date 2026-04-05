-- 为 user_profiles 表添加推荐缓存字段
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS recommendation_cache JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS recommendation_hash VARCHAR(64);
