#!/bin/bash
# SingularityWalk 一键更新脚本
# 用法: cd /var/www && ./deploy.sh

set -e

echo "==== SingularityWalk Deploy ===="

# 1. 拉取最新代码
echo "[1/5] Pulling latest code..."
git pull origin main

# 2. 构建前端
echo "[2/5] Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 3. 构建后端
echo "[3/5] Building backend..."
cd backend
mvn clean package -DskipTests
cd ..

# 4. 重启后端服务
echo "[4/5] Restarting backend..."
sudo systemctl restart singularitywalk

# 5. 检查状态
echo "[5/5] Checking status..."
sleep 5
if sudo systemctl is-active --quiet singularitywalk; then
    echo "==== Deploy Success! ===="
    echo "Backend: active (running)"
    echo "Frontend: served by Nginx from frontend/dist/"
else
    echo "==== Backend failed to start! ===="
    echo "Check logs: sudo journalctl -u singularitywalk -n 50"
    exit 1
fi
