-- 010_create_events.sql
-- Event 事件系统 - Phase 1: 基础表结构

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 基础信息
    title VARCHAR(200) NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',

    -- 分类 (deadline/exam/interview/milestone/reminder/submission/decision/task/custom)
    category VARCHAR(50) NOT NULL DEFAULT 'custom',

    -- 关联 Application（可选）
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,

    -- 来源 (manual/email_import/chat_command)
    origin VARCHAR(50) DEFAULT 'manual',
    email_fingerprint VARCHAR(100),
    extracted_raw_content TEXT,

    -- 状态机联动记录
    status_change_from VARCHAR(50),
    status_change_to VARCHAR(50),
    status_change_confidence FLOAT,
    status_change_auto_executed BOOLEAN DEFAULT false,
    status_change_confirmed_at TIMESTAMP WITH TIME ZONE,

    -- UI 展示
    color VARCHAR(20),

    -- 用户权限控制
    editable_by_user BOOLEAN DEFAULT true,
    deletable_by_user BOOLEAN DEFAULT true,

    -- 用户交互
    manual_completed BOOLEAN DEFAULT false,
    manual_completed_at TIMESTAMP WITH TIME ZONE,
    user_notes TEXT DEFAULT '',

    -- 生命周期
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_application_id ON events(application_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_email_fingerprint
    ON events(email_fingerprint)
    WHERE email_fingerprint IS NOT NULL;
