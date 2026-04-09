-- 新增 onboarding 采集字段
-- onboarding_goals: 用户感兴趣的功能 ["智能选校推荐", "申请时间线"]
-- onboarding_stage: 当前申请阶段 "大三" | "大四" | "已毕业" | "不到大三"
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS onboarding_goals JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS onboarding_stage VARCHAR(20) DEFAULT NULL;
