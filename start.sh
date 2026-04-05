#!/bin/bash
# Easy Apply - 一键启动脚本
# 同时启动 Backend (Flask:5001) + Frontend (Vite:5173)
# 使用: ./start.sh        启动全部
#       ./start.sh backend  仅启动后端
#       ./start.sh frontend 仅启动前端

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
  echo ""
  echo -e "${YELLOW}正在关闭服务...${NC}"
  kill $(jobs -p) 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}已关闭${NC}"
}
trap cleanup EXIT INT TERM

start_backend() {
  echo -e "${GREEN}[Backend]${NC} 启动 Flask 服务 (port 5001)..."
  cd "$BACKEND_DIR"

  if [ ! -d "venv" ]; then
    echo -e "${YELLOW}[Backend]${NC} 创建虚拟环境..."
    python3 -m venv venv
  fi

  # 始终用 venv 绝对路径，避免 conda/系统 python 污染
  VENV_PY="$BACKEND_DIR/venv/bin/python"
  VENV_PIP="$BACKEND_DIR/venv/bin/pip"

  # 检查 flask 是否已安装，没有则安装
  if ! "$VENV_PY" -c "import flask" 2>/dev/null; then
    echo -e "${YELLOW}[Backend]${NC} 安装依赖..."
    "$VENV_PIP" install -r requirements.txt -q
  fi

  if [ ! -f ".env" ]; then
    echo -e "${RED}[Backend]${NC} 缺少 .env 文件，请参考 .env.example 配置"
    exit 1
  fi

  echo -e "${YELLOW}[Backend]${NC} 执行数据库迁移..."
  "$VENV_PY" migrate.py

  "$VENV_PY" run.py &
  echo -e "${GREEN}[Backend]${NC} Flask 已启动 -> http://localhost:5001"
}

start_frontend() {
  echo -e "${GREEN}[Frontend]${NC} 启动 Vite 开发服务 (port 5173)..."
  cd "$FRONTEND_DIR"

  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[Frontend]${NC} 首次运行，安装依赖..."
    npm install
  fi

  npx vite --host &
  echo -e "${GREEN}[Frontend]${NC} Vite 已启动 -> http://localhost:5173"
}

echo "========================================="
echo "       Easy Apply 开发环境启动"
echo "========================================="

case "${1:-all}" in
  backend)  start_backend ;;
  frontend) start_frontend ;;
  all)
    start_backend
    start_frontend
    ;;
  *)
    echo "用法: $0 [backend|frontend|all]"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}全部就绪! 按 Ctrl+C 停止所有服务${NC}"
wait
