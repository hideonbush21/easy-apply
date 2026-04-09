-- applications 表升级为 Program 级别
-- program_id 关联 programs 表；原有 school_id/major 字段保留作兼容
ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- 防止同一用户重复申请同一 program
CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_user_program
    ON applications(user_id, program_id)
    WHERE program_id IS NOT NULL;
