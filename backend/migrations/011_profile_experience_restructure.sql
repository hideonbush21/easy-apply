-- 011: Profile + Experience 结构扩展
-- UserProfile 新增字段
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS birth_date VARCHAR(10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS career_plans JSONB;

-- Experience 新增字段
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS importance VARCHAR(20);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS degree_level VARCHAR(50);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS degree_name VARCHAR(100);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS major VARCHAR(100);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS gpa_info VARCHAR(100);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS other_info TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS related_degree VARCHAR(50);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS subjective_description TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS work_type VARCHAR(50);
