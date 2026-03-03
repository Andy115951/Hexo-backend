#!/bin/bash

echo "=================================="
echo "  Hugo 博客一键部署脚本"
echo "=================================="

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 构建静态文件
echo "📦 正在构建 Hugo..."
cd "$SCRIPT_DIR/hugo" && hugo --minify

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"

    # 复制构建产物到临时目录
    cd "$SCRIPT_DIR"
    rm -rf /tmp/hugo-deploy
    git clone --depth 1 https://github.com/Andy115951/Andy115951.github.io.git /tmp/hugo-deploy
    cd /tmp/hugo-deploy
    git checkout main 2>/dev/null || git checkout -b main
    rm -rf *

    # 复制 Hugo 构建的文件
    cp -r "$SCRIPT_DIR/hugo/public/"* .

    # 推送到 GitHub Pages
    echo "📤 正在部署到 GitHub Pages..."
    git add .
    git commit -m "Deploy Hugo site $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main --force

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 部署成功！"
        echo ""
        echo "🌐 访问你的博客："
        echo "   https://andy115951.github.io/"
        echo ""
    else
        echo "❌ 推送失败，请检查网络连接"
    fi
else
    echo "❌ 构建失败，请检查 Hugo 配置"
fi

echo "=================================="
