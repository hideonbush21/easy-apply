# Easy Apply — 留学申请管理平台

一站式留学申请辅助工具，帮助学生管理院校选择、申请进度和推荐信生成。

## 功能概览

- **用户档案**：录入 GPA、语言成绩、经历背景，计算档案完整度
- **学校推荐**：基于个人背景智能匹配冲刺/匹配/保底院校
- **申请管理**：跟踪每所学校的申请状态与截止日期
- **推荐信生成**：调用 Kimi (Moonshot AI) API，一键生成个性化推荐信并导出 PDF
- **管理员后台**：用户管理与平台统计

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| 状态管理 | Zustand |
| 路由 | React Router v7 |
| 后端 | Flask 3 + Flask-SQLAlchemy + Flask-CORS |
| 数据库 | PostgreSQL（Supabase 托管） |
| 认证 | PyJWT + bcrypt |
| AI | Kimi API（Moonshot AI） |
| 部署 | 前端 Vercel / 后端 Railway or Render |

## 快速开始

### 前置条件

- Node.js 18+
- Python 3.9+
- PostgreSQL（或 Supabase 项目）

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env          # 填写环境变量
python run.py
```

后端默认运行在 `http://localhost:5000`。

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`。

## 环境变量

### 后端 `backend/.env`

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET_KEY=your-secret-key
KIMI_API_KEY=your-kimi-api-key
KIMI_API_BASE_URL=https://api.moonshot.cn/v1
```

### 前端 `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 项目结构

```
easy-apply/
├── frontend/
│   └── src/
│       ├── api/           # Axios 请求封装
│       ├── components/    # 通用组件 (Layout, ProtectedRoute)
│       ├── pages/         # 页面 (Auth / Profile / Schools / Applications / Recommendations / Admin)
│       ├── store/         # Zustand 状态
│       └── types/         # TypeScript 类型定义
├── backend/
│   └── app/
│       ├── models/        # SQLAlchemy 数据模型
│       ├── routes/        # RESTful API 路由
│       ├── services/      # 业务逻辑 (学校推荐算法、AI 推荐信)
│       └── utils/         # 工具函数 (JWT 装饰器等)
├── docu/                  # 技术架构文档 & 数据库 Schema
└── main.py
```

## API 概览

| 模块 | 路径前缀 |
|------|----------|
| 认证 | `POST /api/auth/register` `POST /api/auth/login` |
| 档案 | `GET/PUT /api/profile` |
| 经历 | `CRUD /api/experiences` |
| 学校 | `GET /api/schools` `GET /api/schools/recommendations` |
| 申请 | `CRUD /api/applications` |
| 推荐信 | `POST /api/recommendations/generate` |
| 管理员 | `GET /api/admin/users` `GET /api/admin/stats` |

完整 API 文档见 [docu/SRD.md](docu/SRD.md)。

## 数据库初始化

运行种子脚本导入学校数据：

```bash
cd backend
python -m seed_data.seed_schools
```

## License

MIT
