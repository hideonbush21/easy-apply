-- Migration 002: 创建登录日志表
CREATE TABLE IF NOT EXISTS user_login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON user_login_logs(login_at DESC);
