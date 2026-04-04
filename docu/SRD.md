# 留学申请网站 - 技术架构文档

## 1. 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 组件库**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **路由**: React Router v6
- **PDF 导出**: html2canvas + jsPDF

### 后端
- **框架**: Flask + Flask-CORS
- **数据库**: PostgreSQL (Supabase)
- **ORM**: SQLAlchemy
- **认证**: PyJWT
- **API 风格**: RESTful

### AI 服务
- **模型**: Kimi API (Moonshot AI)
- **功能**: 个性化推荐信生成

### 部署
- **前端**: Vercel
- **后端**: Vercel (Serverless Functions) 或 Railway/Render
- **数据库**: Supabase

---

## 2. 数据库 Schema

### 2.1 用户表 (users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 用户档案表 (user_profiles)
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 基础信息
    name VARCHAR(100),
    home_institution VARCHAR(200),
    institution_tier VARCHAR(20), -- c9/985/211/double_non/overseas/other
    current_major VARCHAR(100),
    
    -- 成绩信息
    gpa DECIMAL(3,2),
    gpa_scale DECIMAL(2,1), -- 4.0/5.0/100
    language_scores JSONB, -- {"toefl": 108, "ielts": 7.5}
    
    -- 目标信息
    target_countries JSONB, -- ["美国", "英国"]
    target_majors JSONB, -- ["计算机科学", "数据科学"]
    degree_type VARCHAR(20), -- master/phd/bachelor
    
    -- 元数据
    completion_rate DECIMAL(3,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 经历表 (experiences)
```sql
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 实习/科研/竞赛/论文/项目/志愿者/社团/其他
    title VARCHAR(200) NOT NULL,
    organization VARCHAR(200),
    role VARCHAR(100),
    start_date VARCHAR(7), -- YYYY-MM
    end_date VARCHAR(7), -- YYYY-MM 或 "present"
    description TEXT,
    achievements JSONB, -- ["获得一等奖", "发表SCI论文"]
    skills JSONB, -- ["Python", "机器学习"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.4 学校表 (schools)
```sql
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    country VARCHAR(50) NOT NULL, -- 美国/英国/澳大利亚
    ranking INTEGER,
    majors JSONB, -- ["计算机科学", "电子工程", ...]
    gpa_requirement JSONB, -- {"min": 3.0, "preferred": 3.5}
    language_requirement JSONB, -- {"toefl": 100, "ielts": 7.0}
    application_deadline DATE, -- 申请截止日期
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.5 申请记录表 (applications)
```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    major VARCHAR(100),
    status VARCHAR(50) DEFAULT '待申请', -- 待申请/材料准备中/已提交/面试邀请/面试完成/等待结果/已录取/已拒绝/候补名单
    priority VARCHAR(20), -- 冲刺/匹配/保底
    application_deadline DATE,
    applied_at TIMESTAMP,
    result_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.6 推荐信表 (recommendation_letters)
```sql
CREATE TABLE recommendation_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.7 管理员表 (admins)
```sql
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. API 设计

### 3.1 认证相关
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/refresh | 刷新 Token |

### 3.2 用户档案
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/profile | 获取当前用户档案 |
| PUT | /api/profile | 更新用户档案 |
| GET | /api/profile/completion | 获取档案完整度 |

### 3.3 经历管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/experiences | 获取用户所有经历 |
| POST | /api/experiences | 添加经历 |
| PUT | /api/experiences/:id | 更新经历 |
| DELETE | /api/experiences/:id | 删除经历 |

### 3.4 学校推荐
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/schools/recommendations | 获取推荐学校列表 |
| GET | /api/schools/:id | 获取学校详情 |
| GET | /api/schools | 获取所有学校（分页） |

### 3.5 申请管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/applications | 获取用户所有申请 |
| POST | /api/applications | 创建申请 |
| PUT | /api/applications/:id | 更新申请状态 |
| DELETE | /api/applications/:id | 删除申请 |
| GET | /api/applications/deadlines | 获取即将截止的申请 |

### 3.6 推荐信
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/recommendations/generate | 生成推荐信 |
| GET | /api/recommendations/:application_id | 获取推荐信 |
| GET | /api/recommendations/:id/export | 导出推荐信为 PDF |

### 3.7 管理员
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/login | 管理员登录 |
| GET | /api/admin/users | 获取所有用户 |
| GET | /api/admin/users/:id | 获取用户详情 |
| PUT | /api/admin/users/:id | 修改用户资料 |
| DELETE | /api/admin/users/:id | 删除用户 |
| POST | /api/admin/users/:id/reset-password | 重置用户密码 |
| GET | /api/admin/stats | 获取统计数据 |

---

## 4. 核心功能逻辑

### 4.1 学校推荐算法
```python
def recommend_schools(user_profile):
    """
    基于以下因素推荐学校：
    1. GPA 匹配度：用户 GPA vs 学校 GPA 要求
    2. 专业匹配度：用户目标专业 vs 学校开设专业
    3. 国家匹配度：用户目标国家 vs 学校所在国家
    4. 学校层次匹配度：用户学校层次 vs 学校录取偏好
    
    返回按匹配度排序的学校列表
    """
    pass
```

### 4.2 推荐信生成 Prompt
```
你是一位资深留学申请顾问，请根据以下学生背景信息，为申请 {school_name} 的 {major} 专业撰写一封个性化推荐信。

学生背景：
- 姓名：{name}
- 本科学校：{home_institution} ({institution_tier})
- 专业：{current_major}
- GPA：{gpa}/{gpa_scale}
- 语言成绩：{language_scores}
- 经历：{experiences}

推荐信要求：
1. 采用正式学术推荐信格式
2. 突出学生的学术能力和专业潜力
3. 结合具体经历事例
4. 说明为什么适合该学校和专业
5. 字数控制在 500-800 字
```

---

## 5. 项目结构

```
study-abroad-app/
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── components/          # 通用组件
│   │   ├── pages/               # 页面组件
│   │   │   ├── Auth/            # 登录/注册
│   │   │   ├── Profile/         # 用户档案
│   │   │   ├── Schools/         # 学校推荐
│   │   │   ├── Applications/    # 申请管理
│   │   │   ├── Recommendations/ # 推荐信
│   │   │   └── Admin/           # 管理员后台
│   │   ├── store/               # Zustand 状态管理
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── utils/               # 工具函数
│   │   └── api/                 # API 请求
│   ├── public/
│   └── package.json
│
├── backend/                     # Flask 后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models/              # 数据库模型
│   │   ├── routes/              # API 路由
│   │   ├── services/            # 业务逻辑
│   │   ├── utils/               # 工具函数
│   │   └── config.py
│   ├── migrations/              # 数据库迁移
│   ├── seed_data/               # Mock 数据
│   ├── requirements.txt
│   └── run.py
│
└── docs/                        # 文档
    ├── 技术架构.md
    └── API文档.md
```

---

## 6. 开发计划

### Phase 1: 基础架构 (Day 1-2)
- [ ] 初始化前端项目 (React + Vite + TypeScript + Tailwind)
- [ ] 初始化后端项目 (Flask + SQLAlchemy)
- [ ] 配置 Supabase 数据库
- [ ] 设计并实现数据库 Schema
- [ ] 创建数据库迁移脚本

### Phase 2: 认证系统 (Day 3)
- [ ] 用户注册/登录 API
- [ ] JWT 认证中间件
- [ ] 前端登录/注册页面
- [ ] 路由守卫

### Phase 3: 用户档案 (Day 4-5)
- [ ] 用户档案 API
- [ ] 档案表单页面
- [ ] 经历管理功能
- [ ] 档案完整度计算

### Phase 4: 学校数据 (Day 6)
- [ ] 生成 100 所 Mock 学校数据
- [ ] 学校列表 API
- [ ] 学校推荐算法
- [ ] 学校展示页面

### Phase 5: 申请管理 (Day 7)
- [ ] 申请记录 CRUD API
- [ ] 申请管理页面
- [ ] 截止日期提醒功能

### Phase 6: 推荐信 (Day 8)
- [ ] Kimi API 集成
- [ ] 推荐信生成 API
- [ ] 推荐信展示页面
- [ ] PDF 导出功能

### Phase 7: 管理员后台 (Day 9)
- [ ] 管理员认证
- [ ] 用户管理功能
- [ ] 统计数据 API
- [ ] 管理员后台页面

### Phase 8: 部署 (Day 10)
- [ ] 前端部署到 Vercel
- [ ] 后端部署到 Vercel/Railway
- [ ] 环境变量配置
- [ ] 测试与优化

---

## 7. 环境变量

### 前端 (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 后端 (.env)
```
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET_KEY=your-secret-key
KIMI_API_KEY=your-kimi-api-key
KIMI_API_BASE_URL=https://api.moonshot.cn/v1
```

---

## 8. Mock 数据规划

### 8.1 专业列表 (50 个)
```python
MAJORS = [
    # 计算机与工程 (10)
    "计算机科学", "软件工程", "人工智能", "数据科学", "网络安全",
    "电子工程", "机械工程", "土木工程", "生物工程", "化学工程",
    
    # 商科 (10)
    "工商管理", "金融学", "会计学", "市场营销", "国际商务",
    "经济学", "统计学", "供应链管理", "人力资源管理", "创业管理",
    
    # 自然科学 (8)
    "数学", "物理学", "化学", "生物学", "环境科学",
    "地质学", "天文学", "海洋科学",
    
    # 社会科学 (8)
    "心理学", "社会学", "政治学", "国际关系", "传媒学",
    "新闻学", "教育学", "社会工作",
    
    # 人文艺术 (7)
    "英语文学", "历史学", "哲学", "艺术史", "音乐",
    "电影研究", "语言学",
    
    # 医学健康 (7)
    "临床医学", "公共卫生", "护理学", "药学", "生物医学",
    "营养学", "运动科学"
]
```

### 8.2 学校分布
- **英国**: 50 所
  - G5: 牛津、剑桥、帝国理工、LSE、UCL
  - 罗素集团其他成员
  - 其他知名大学
  
- **美国**: 30 所
  - Top 30 综合性大学
  
- **澳大利亚**: 20 所
  - Group of Eight
  - 其他知名大学

---

## 9. 安全考虑

1. **密码安全**: 使用 bcrypt 加密存储
2. **JWT 安全**: 设置合理过期时间，支持刷新
3. **SQL 注入**: 使用 SQLAlchemy ORM 防止
4. **XSS 防护**: 前端转义用户输入
5. **CORS 配置**: 限制允许的域名
6. **Rate Limiting**: API 请求频率限制

---

## 10. 后续优化方向

1. 邮件提醒功能（申请截止、录取结果）
2. 学校数据从 Mock 切换到真实数据（接入第三方 API）
3. 推荐信模板自定义
4. 多语言支持
5. 移动端 App
