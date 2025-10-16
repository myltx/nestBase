#!/bin/bash

# NestBase 快速启动脚本
# 用法：./start.sh

set -e  # 遇到错误立即退出

echo "🚀 NestBase 启动脚本"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm 未安装${NC}"
    echo "请运行: npm install -g pnpm"
    exit 1
fi

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 版本过低 (需要 >= 18.x)${NC}"
    echo "当前版本: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✅ 环境检查通过${NC}"
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 安装依赖...${NC}"
    pnpm install
    echo ""
fi

# 检查后端 .env 文件
if [ ! -f "apps/backend/.env" ]; then
    echo -e "${YELLOW}⚠️  未找到 .env 文件${NC}"
    echo "正在从 .env.example 创建..."

    if [ -f "apps/backend/.env.example" ]; then
        cp apps/backend/.env.example apps/backend/.env
        echo -e "${GREEN}✅ .env 文件已创建${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  请编辑 apps/backend/.env 文件，填写以下配置：${NC}"
        echo "  1. DATABASE_URL (Supabase 连接字符串)"
        echo "  2. DIRECT_URL (用于数据库迁移)"
        echo "  3. JWT_SECRET (建议使用强随机密钥)"
        echo ""
        echo "配置指南："
        echo "  - Supabase 配置：查看 SUPABASE_SETUP.md"
        echo "  - 快速开始：查看 QUICKSTART.md"
        echo ""
        read -p "按 Enter 键打开 .env 文件编辑... "

        # 尝试打开编辑器
        if command -v code &> /dev/null; then
            code apps/backend/.env
        elif command -v vim &> /dev/null; then
            vim apps/backend/.env
        elif command -v nano &> /dev/null; then
            nano apps/backend/.env
        else
            echo "请手动编辑 apps/backend/.env 文件"
        fi

        echo ""
        read -p "配置完成后，按 Enter 键继续... "
    else
        echo -e "${RED}❌ 未找到 .env.example 文件${NC}"
        exit 1
    fi
fi

# 检查是否需要生成 Prisma Client
echo -e "${BLUE}🔧 检查 Prisma Client...${NC}"
cd apps/backend

if [ ! -d "node_modules/@prisma/client" ] || [ ! -d "node_modules/.prisma" ]; then
    echo "生成 Prisma Client..."
    npx prisma generate
    echo ""
fi

# 检查数据库连接
echo -e "${BLUE}🗄️  检查数据库连接...${NC}"
if npx prisma db pull --force --skip-generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库连接成功${NC}"
    echo ""

    # 询问是否推送 schema
    read -p "是否推送数据库 schema? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "推送 schema 到数据库..."
        npx prisma db push
        echo ""

        # 询问是否填充测试数据
        read -p "是否填充测试数据? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd ../..
            pnpm prisma:seed
            cd apps/backend
            echo ""
        fi
    fi
else
    echo -e "${YELLOW}⚠️  无法连接到数据库${NC}"
    echo "请检查 .env 文件中的数据库配置"
    echo ""
    echo "常见问题："
    echo "  1. IPv4 网络需要使用 Session Pooler"
    echo "  2. 密码中的 @ 需要编码为 %40"
    echo "  3. 检查 Supabase 项目是否正常运行"
    echo ""
    read -p "是否继续启动应用? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

cd ../..

# 查找可用端口
echo -e "${BLUE}🔍 查找可用端口...${NC}"
PORT=3000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    echo "端口 $PORT 已被占用，尝试 $((PORT+1))..."
    PORT=$((PORT+1))
done

echo -e "${GREEN}✅ 使用端口: $PORT${NC}"
echo ""

# 更新 .env 中的端口（如果需要）
if [ "$PORT" != "3000" ]; then
    if grep -q "^PORT=" apps/backend/.env; then
        sed -i.bak "s/^PORT=.*/PORT=$PORT/" apps/backend/.env
        rm apps/backend/.env.bak
    else
        echo "PORT=$PORT" >> apps/backend/.env
    fi
fi

# 启动应用
echo -e "${GREEN}🚀 启动 NestBase...${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PORT=$PORT pnpm dev

# 如果启动失败
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ 启动失败${NC}"
    echo ""
    echo "常见解决方案："
    echo "  1. 检查数据库连接配置"
    echo "  2. 确保所有依赖已安装: pnpm install"
    echo "  3. 重新生成 Prisma Client: cd apps/backend && npx prisma generate"
    echo "  4. 查看详细错误日志"
    echo ""
    echo "获取帮助："
    echo "  - 快速启动: cat QUICKSTART.md"
    echo "  - Supabase 配置: cat SUPABASE_SETUP.md"
    echo "  - 主文档: cat README.md"
    exit 1
fi
