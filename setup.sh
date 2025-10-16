#!/bin/bash

# NestBase 项目初始化脚本
# 使用方法: chmod +x setup.sh && ./setup.sh

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   🚀 NestBase 项目初始化脚本                                   ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js >= 18.x"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查包管理器
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    echo "✅ 使用包管理器: pnpm"
elif command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
    echo "✅ 使用包管理器: yarn"
else
    PKG_MANAGER="npm"
    echo "✅ 使用包管理器: npm"
fi

echo ""
echo "📦 步骤 1/5: 安装依赖..."
$PKG_MANAGER install

echo ""
echo "📝 步骤 2/5: 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请填写您的配置"
    echo "⚠️  重要: 请编辑 .env 文件并填写必要的配置（数据库连接、JWT 密钥等）"
    echo ""
    read -p "按 Enter 继续（请确保已配置 .env）..."
else
    echo "✅ .env 文件已存在"
fi

echo ""
echo "🗄️  步骤 3/5: 生成 Prisma Client..."
$PKG_MANAGER prisma:generate

echo ""
echo "🔄 步骤 4/5: 运行数据库迁移..."
read -p "是否运行数据库迁移? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    $PKG_MANAGER prisma:migrate
    echo "✅ 数据库迁移完成"
else
    echo "⏭️  跳过数据库迁移"
fi

echo ""
echo "🌱 步骤 5/5: 填充测试数据..."
read -p "是否填充测试数据? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    $PKG_MANAGER prisma:seed
    echo "✅ 测试数据填充完成"
else
    echo "⏭️  跳过测试数据填充"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   ✅ 项目初始化完成！                                          ║"
echo "║                                                               ║"
echo "║   启动开发服务器:                                              ║"
echo "║   $ $PKG_MANAGER start:dev                                          ║"
echo "║                                                               ║"
echo "║   访问 Swagger 文档:                                           ║"
echo "║   http://localhost:3000/api-docs                              ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
