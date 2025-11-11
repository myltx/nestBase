# Supabase 配置指南

本文档详细说明如何配置 Supabase 数据库连接，特别是针对 **IPv4 网络**的配置方法。

---

## 📋 配置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase 控制台](https://supabase.com/dashboard)
2. 点击 **New Project**
3. 填写项目信息：
   - Organization（组织）
   - Project Name（项目名称）
   - Database Password（数据库密码，请妥善保管）
   - Region（区域，建议选择离你最近的）

4. 点击 **Create new project**，等待项目初始化（约 2 分钟）

---

### 2. 获取数据库连接信息

#### 步骤 A：检查 IPv4 兼容性

1. 进入项目后，点击左侧菜单 **Settings**（设置图标）
2. 选择 **Database**
3. 滚动到 **Connection string** 部分
4. 查看是否有 **"Not IPv4 compatible"** 提示

#### 步骤 B：获取连接字符串

**如果显示 "Not IPv4 compatible"（大多数情况）：**

1. 勾选 ✅ **Use connection pooling**
2. 选择连接模式：
   - **Transaction mode**（推荐）- 用于应用运行时
   - **Session mode** - 用于数据库迁移

3. 选择 **URI** 标签页

4. 复制连接字符串，格式类似：
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-x-region.pooler.supabase.com:6543/postgres
   ```

**如果 IPv6 可用（少数情况）：**

可以直接使用 Direct connection：
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

---

### 3. 获取 API 密钥

1. 在 **Settings** 中选择 **API**
2. 复制以下信息：
   - **Project URL**（项目 URL）
   - **anon public**（匿名公钥）
   - **service_role**（服务角色密钥，点击眼睛图标显示）

---

### 4. 配置环境变量

编辑 `apps/backend/.env` 文件：

```env
# Supabase API 配置
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 数据库连接 - IPv4 网络使用 Session Pooler
# Transaction mode (端口 6543) - 应用运行时使用
DATABASE_URL="postgresql://postgres.xxxxx:YourPassword123@aws-x-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Session mode (端口 5432) - 数据库迁移使用
DIRECT_URL="postgresql://postgres.xxxxx:YourPassword123@aws-x-region.pooler.supabase.com:5432/postgres"

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

---

## ⚠️ 重要注意事项

### 密码 URL 编码

如果你的数据库密码包含特殊字符，**必须**进行 URL 编码：

| 原字符 | 编码后 | 示例 |
|--------|--------|------|
| `@` | `%40` | `my@pass` → `my%40pass` |
| `#` | `%23` | `pass#123` → `pass%23123` |
| `$` | `%24` | `$ecure` → `%24ecure` |
| `%` | `%25` | `50%` → `50%25` |
| `&` | `%26` | `me&you` → `me%26you` |
| `+` | `%2B` | `a+b` → `a%2Bb` |
| `/` | `%2F` | `a/b` → `a%2Fb` |
| `:` | `%3A` | `a:b` → `a%3Ab` |
| `=` | `%3D` | `a=b` → `a%3Db` |
| `?` | `%3F` | `a?b` → `a%3Fb` |
| ` `（空格） | `%20` | `my pass` → `my%20pass` |

**示例**：
```
原密码：ll940223..@@
编码后：ll940223..%40%40

原密码：MyP@ss#2024!
编码后：MyP%40ss%232024!
```

### DATABASE_URL vs DIRECT_URL

| 配置项 | 用途 | 端口 | 连接模式 |
|--------|------|------|----------|
| `DATABASE_URL` | 应用运行时查询 | 6543 | Transaction mode |
| `DIRECT_URL` | 数据库迁移 | 5432 | Session mode |

两者的区别：
- **Transaction mode**（6543）：适合短连接，事务级别池化
- **Session mode**（5432）：适合长连接，会话级别池化

### Prisma Schema 配置

确保你的 `apps/backend/prisma/schema.prisma` 包含：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // 运行时使用
  directUrl = env("DIRECT_URL")        // 迁移时使用
}
```

---

## 🔧 测试连接

### 方法 1：使用 Prisma Studio

```bash
cd apps/backend
npx prisma studio
```

如果能打开浏览器并看到数据库表，说明连接成功。

### 方法 2：测试数据库推送

```bash
cd apps/backend
npx prisma db push
```

成功输出：
```
✔ Your database is now in sync with your Prisma schema
```

### 方法 3：启动应用

```bash
pnpm dev
```

成功输出应包含：
```
✅ 数据库连接成功
```

---

## 🐛 常见问题排查

### 问题 1：连接超时

**错误信息**：
```
Can't reach database server at `pooler.supabase.com:6543`
```

**可能原因**：
- 网络问题，无法访问 Supabase
- 防火墙阻止了端口 6543 或 5432
- 连接字符串配置错误

**解决方案**：
1. 检查网络连接
2. 尝试在浏览器访问 Supabase 控制台确认网络畅通
3. 检查公司/学校网络是否有防火墙限制
4. 确认连接字符串是否从 Supabase 正确复制

---

### 问题 2：认证失败

**错误信息**：
```
Authentication failed against database server
```

**可能原因**：
- 密码错误
- 密码包含特殊字符但未编码
- 项目引用（ref）错误

**解决方案**：
1. 在 Supabase 控制台 **Settings → Database** 重新查看密码
2. 如果忘记密码，可以点击 **Reset Database Password** 重置
3. 确保特殊字符已正确 URL 编码
4. 确认项目引用（.xxxxx 部分）是否正确

---

### 问题 3：Prisma Client 生成失败

**错误信息**：
```
P1000: Authentication failed
```

**解决方案**：
```bash
# 1. 清除 Prisma 缓存
rm -rf node_modules/.prisma

# 2. 重新生成 Prisma Client
cd apps/backend
npx prisma generate

# 3. 测试连接
npx prisma db push
```

---

### 问题 4：IPv6 错误

**错误信息**：
```
getaddrinfo ENOTFOUND db.xxxxx.supabase.co
```

**原因**：尝试使用直连地址但网络不支持 IPv6

**解决方案**：
必须使用 Session Pooler：
```env
DATABASE_URL="postgresql://...@aws-x-region.pooler.supabase.com:6543/..."
DIRECT_URL="postgresql://...@aws-x-region.pooler.supabase.com:5432/..."
```

---

## 📊 连接池配置说明

### Transaction Mode (推荐)

**端口**：6543
**特点**：
- 每个事务使用一个连接
- 适合短查询
- 连接数限制较少
- **推荐用于 Prisma**

**连接字符串示例**：
```
postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### Session Mode

**端口**：5432
**特点**：
- 每个会话使用一个连接
- 适合长查询和迁移
- 支持所有 PostgreSQL 特性
- **用于 Prisma Migrate**

**连接字符串示例**：
```
postgresql://...@pooler.supabase.com:5432/postgres
```

---

## 🔒 安全建议

1. **永远不要将 `.env` 文件提交到 Git**
   - `.env` 已在 `.gitignore` 中
   - 使用 `.env.example` 作为模板

2. **使用强密码**
   - 至少 16 个字符
   - 包含大小写字母、数字和特殊字符
   - 不要使用常见单词

3. **定期轮换密钥**
   - JWT_SECRET 定期更换
   - 数据库密码定期更新

4. **生产环境**
   - 使用环境变量或密钥管理服务
   - 不要在代码中硬编码密钥
   - 启用 Supabase 的 IP 白名单（如果可用）

---

## 📚 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Prisma 官方文档](https://www.prisma.io/docs)
- [PostgreSQL 连接池](https://www.pgbouncer.org/)

---

## 💡 最佳实践

### 开发环境
```env
# 使用 Transaction mode
DATABASE_URL="postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@pooler.supabase.com:5432/postgres"
```

### 生产环境
```env
# 1. 使用环境变量
# 2. 启用 SSL
DATABASE_URL="postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# 3. 增加连接限制（可选）
DATABASE_URL="postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
```

---

## ✅ 配置检查清单

在启动应用前，请确认：

- [ ] Supabase 项目已创建
- [ ] 数据库密码已保存
- [ ] 获取了正确的连接字符串（带 pooler.supabase.com）
- [ ] 密码中的特殊字符已 URL 编码
- [ ] `.env` 文件已正确配置
- [ ] `DATABASE_URL` 和 `DIRECT_URL` 都已设置
- [ ] Prisma schema 中包含 `directUrl`
- [ ] 已运行 `npx prisma generate`
- [ ] 已运行 `npx prisma db push` 成功

---

如有问题，请参考 [README.md](README.md) 或提交 [GitHub Issue](https://github.com/your-repo/issues)。
