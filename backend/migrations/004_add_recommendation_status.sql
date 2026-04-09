-- 新增选校推荐任务状态字段
-- 值: NULL(未触发) | 'pending'(生成中) | 'done'(完成) | 'failed'(失败)
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS recommendation_status VARCHAR(20) DEFAULT NULL;
