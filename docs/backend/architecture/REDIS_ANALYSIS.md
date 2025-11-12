# Redis 集成需求分析与实施方案

## 📋 文档概述

本文档分析了在 NestBase 项目中集成 Redis 的必要性、收益和实施方案，用于后期决策和实施参考。

---

## 🤔 Redis 需求分析

### 当前系统状态

当前实现的 Token 刷新和退出登录功能是**基于 JWT 无状态设计**：

#### 优点

- ✅ **简单易用**，无需额外依赖
- ✅ **性能好**，无需每次查询数据库
- ✅ **易于横向扩展**（无状态）
- ✅ **降低运维成本**，无需维护 Redis 服务

#### 局限性

- ❌ **Token 一旦签发，无法主动失效**（除非过期）
- ❌ **退出登录只能依赖客户端删除 Token**
- ❌ **无法实现强制下线功能**
- ❌ **无法限制设备数量**
- ❌ **密码修改后无法立即失效旧 Token**
- ❌ **限流功能仅支持单机**（进程内存）

---

## 🎯 Redis 可以解决的问题

### 1. Token 黑名单 🔥 高优先级

**问题**：JWT Token 一旦签发无法主动失效，即使用户退出登录或被强制下线，Token 在过期前仍然有效。

**Redis 方案**：

```typescript
// 用户退出登录时，将 token 加入黑名单
async logout(userId: string, token: string) {
  const decoded = this.jwtService.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000); // 剩余有效时间

  await this.redis.setex(
    `blacklist:${decoded.jti}`, // jti: JWT ID
    ttl,
    '1'
  );

  return { message: '退出登录成功' };
}

// 验证 token 时检查黑名单
async validateToken(token: string) {
  const decoded = this.jwtService.decode(token);

  const isBlacklisted = await this.redis.exists(`blacklist:${decoded.jti}`);
  if (isBlacklisted) {
    throw new UnauthorizedException('Token 已失效');
  }

  // 继续验证 token
}
```

**适用场景**：

- 用户退出登录后，立即失效所有 Token
- 管理员强制下线某个用户
- 密码修改后立即失效旧 Token
- 检测到账户异常时紧急失效

**收益**：

- ✅ 真正的服务端控制 Token 生命周期
- ✅ 提升系统安全性
- ✅ 满足合规要求（如 GDPR）

---

### 2. Refresh Token 白名单 🔥 高优先级

**问题**：Refresh Token 长期有效（7天），无法限制用户登录设备数量，也无法在密码修改后失效。

**Redis 方案**：

```typescript
// 登录时存储 refresh token（单设备模式）
async login(loginDto: LoginDto) {
  // ... 验证逻辑 ...

  const token = await this.generateToken(user);

  // 存储新的 refresh token（覆盖旧的）
  await this.redis.setex(
    `refresh:${user.id}`,
    7 * 24 * 60 * 60, // 7天
    token.refreshToken
  );

  return { user, token };
}

// 刷新时验证白名单
async refreshToken(refreshToken: string) {
  const decoded = this.jwtService.verify(refreshToken);

  // 检查白名单
  const storedToken = await this.redis.get(`refresh:${decoded.sub}`);
  if (storedToken !== refreshToken) {
    throw new UnauthorizedException('Refresh Token 无效或已过期');
  }

  // 生成新 token
  const newToken = await this.generateToken(user);

  // 更新白名单
  await this.redis.setex(
    `refresh:${user.id}`,
    7 * 24 * 60 * 60,
    newToken.refreshToken
  );

  return { user, token: newToken };
}

// 多设备模式
async loginMultiDevice(loginDto: LoginDto) {
  // ... 验证逻辑 ...

  const token = await this.generateToken(user);
  const sessionId = uuidv4();

  // 添加到用户的 refresh token 集合（支持多设备）
  await this.redis.sadd(`refresh:${user.id}`, token.refreshToken);
  await this.redis.setex(
    `session:${sessionId}`,
    7 * 24 * 60 * 60,
    JSON.stringify({ userId: user.id, refreshToken: token.refreshToken })
  );

  return { user, token, sessionId };
}
```

**适用场景**：

- 限制单设备登录
- 支持多设备登录管理
- 密码修改后清空所有 refresh token
- 查看用户所有登录设备

**收益**：

- ✅ 精确控制用户会话
- ✅ 支持"踢人"功能
- ✅ 提升账户安全性

---

### 3. 分布式 API 限流 🟡 中优先级

**问题**：当前限流基于进程内存，多服务器集群环境下无法共享限流状态。

**当前实现**（进程内存）：

```typescript
// src/common/guards/rate-limit.guard.ts
private readonly store = new Map<string, Counter>(); // 仅限当前进程
```

**Redis 方案**：

```typescript
async canActivate(context: ExecutionContext): boolean {
  const { userId, endpoint, limit, ttl } = this.extractMetadata(context);

  const key = `ratelimit:${userId}:${endpoint}`;

  // 使用 Redis 原子操作
  const count = await this.redis.incr(key);

  if (count === 1) {
    await this.redis.expire(key, ttl);
  }

  if (count > limit) {
    const ttlRemaining = await this.redis.ttl(key);
    throw new HttpException(
      `请求过于频繁，请在 ${ttlRemaining}s 后重试`,
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  return true;
}
```

**适用场景**：

- 多服务器集群部署
- Kubernetes 水平扩展
- 负载均衡环境

**收益**：

- ✅ 真正的分布式限流
- ✅ 支持集群扩展
- ✅ 更精确的限流控制

---

### 4. 会话管理 🟡 中优先级

**问题**：无法查看用户当前登录的设备，也无法远程下线某个设备。

**Redis 方案**：

```typescript
// 登录时记录会话
async login(loginDto: LoginDto, userAgent: string, ipAddress: string) {
  // ... 验证逻辑 ...

  const sessionId = uuidv4();
  const sessionData = {
    sessionId,
    userId: user.id,
    userAgent,
    ipAddress,
    loginAt: new Date(),
    lastActiveAt: new Date(),
  };

  // 存储会话详情
  await this.redis.setex(
    `session:${sessionId}`,
    7 * 24 * 60 * 60,
    JSON.stringify(sessionData)
  );

  // 添加到用户的会话集合
  await this.redis.sadd(`sessions:${user.id}`, sessionId);

  return { user, token, sessionId };
}

// 查看用户所有设备
async getUserSessions(userId: string) {
  const sessionIds = await this.redis.smembers(`sessions:${userId}`);

  const sessions = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const data = await this.redis.get(`session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    })
  );

  return sessions.filter(s => s !== null);
}

// 强制下线某个设备
async forceLogout(userId: string, sessionId: string) {
  const sessionData = await this.redis.get(`session:${sessionId}`);
  if (!sessionData) {
    throw new NotFoundException('会话不存在');
  }

  const session = JSON.parse(sessionData);

  // 将该会话的 token 加入黑名单
  await this.addToBlacklist(session.accessToken);
  await this.redis.del(`session:${sessionId}`);
  await this.redis.srem(`sessions:${userId}`, sessionId);

  return { message: '设备已下线' };
}

// 下线用户所有设备
async forceLogoutAll(userId: string) {
  const sessionIds = await this.redis.smembers(`sessions:${userId}`);

  for (const sessionId of sessionIds) {
    await this.forceLogout(userId, sessionId);
  }

  return { message: '所有设备已下线' };
}
```

**适用场景**：

- 用户中心 - 查看登录设备列表
- 管理后台 - 查看用户在线设备
- 安全功能 - 远程下线可疑设备
- 密码修改 - 自动下线所有设备

**收益**：

- ✅ 提升用户体验（设备管理）
- ✅ 增强安全性（远程下线）
- ✅ 满足合规要求

---

### 5. 数据缓存优化 🟢 低优先级

**问题**：频繁查询数据库，特别是用户权限、菜单等几乎不变的数据。

**Redis 方案**：

```typescript
// 缓存用户权限
async getUserPermissions(userId: string): Promise<string[]> {
  const cacheKey = `permissions:${userId}`;

  // 先从缓存读取
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 缓存未命中，查询数据库
  const permissions = await this.fetchPermissionsFromDB(userId);

  // 写入缓存（1小时）
  await this.redis.setex(
    cacheKey,
    3600,
    JSON.stringify(permissions)
  );

  return permissions;
}

// 缓存角色菜单
async getRoleMenus(roleId: string) {
  const cacheKey = `menus:role:${roleId}`;

  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const menus = await this.fetchMenusFromDB(roleId);

  await this.redis.setex(
    cacheKey,
    3600,
    JSON.stringify(menus)
  );

  return menus;
}

// 权限变更时清除缓存
async updateUserPermissions(userId: string, permissions: string[]) {
  await this.prisma.rolePermission.updateMany(/* ... */);

  // 清除缓存
  await this.redis.del(`permissions:${userId}`);
}
```

**适用场景**：

- 高并发查询
- 频繁访问的数据
- 读多写少的场景

**收益**：

- ✅ 降低数据库压力
- ✅ 提升响应速度（10-100倍）
- ✅ 支持更高并发

---

## 📊 需求决策表

| 场景 | 不使用 Redis | 使用 Redis | 优先级 | 实施难度 |
|------|------------|-----------|--------|---------|
| **基础认证** | ✅ 当前方案足够 | 🟡 可选 | 低 | - |
| **退出登录（服务端失效）** | ❌ 只能客户端删除 | ✅ 真正失效 | **高** | ⭐⭐ |
| **强制下线** | ❌ 无法实现 | ✅ 可实现 | **高** | ⭐⭐⭐ |
| **多设备管理** | ❌ 无法实现 | ✅ 可实现 | **中** | ⭐⭐⭐ |
| **密码修改后失效旧 Token** | ❌ 无法实现 | ✅ 可实现 | **高** | ⭐⭐ |
| **分布式限流** | ⚠️ 只支持单机 | ✅ 支持集群 | **中** | ⭐⭐ |
| **性能优化（缓存）** | 🟡 数据库查询 | ✅ 极快响应 | 中 | ⭐ |
| **集群部署** | ⚠️ 会话不共享 | ✅ 完美支持 | **高** | ⭐⭐⭐ |

**实施难度说明**：
- ⭐ 简单（1-2小时）
- ⭐⭐ 中等（半天）
- ⭐⭐⭐ 复杂（1-2天）

---

## 💡 实施建议

### 方案 A：暂时不启用 Redis（当前方案）

#### 适合场景

- ✅ 项目处于早期阶段
- ✅ 用户量不大（< 1,000 活跃用户）
- ✅ 单服务器部署
- ✅ 预算有限
- ✅ 团队对 Redis 不熟悉

#### 优势

- ✅ 功能基本够用
- ✅ 架构简单，维护成本低
- ✅ 无需额外依赖和成本
- ✅ 快速上线

#### 需要接受的限制

- ⚠️ Token 无法主动失效
- ⚠️ 无法强制下线
- ⚠️ 限流只支持单机
- ⚠️ 无法管理多设备登录

---

### 方案 B：启用 Redis（推荐生产环境）🔥

#### 适合场景

- ✅ 准备上线生产环境
- ✅ 需要更高的安全性
- ✅ 多服务器集群部署
- ✅ 用户量较大（> 1,000 活跃用户）
- ✅ 有运维团队支持

#### 实施优先级

**第一阶段（必须）**：

1. ✅ **Refresh Token 白名单**（2-3小时）
   - 登录时存储 refresh token
   - 刷新时验证白名单
   - 密码修改时清空白名单

2. ✅ **Token 黑名单**（2-3小时）
   - 退出登录时加入黑名单
   - JwtAuthGuard 检查黑名单
   - 强制下线功能

**第二阶段（推荐）**：

3. 🟡 **分布式限流**（3-4小时）
   - 改造 RateLimitGuard
   - 支持集群环境

4. 🟡 **会话管理**（1天）
   - 多设备登录管理
   - 查看登录设备列表
   - 远程下线功能

**第三阶段（可选）**：

5. 🟢 **数据缓存**（1-2天）
   - 权限缓存
   - 菜单缓存
   - 用户信息缓存

---

## 🛠️ 技术实施方案

### 1. 依赖安装

```bash
# 安装 Redis 相关依赖
pnpm add @nestjs/cache-manager cache-manager
pnpm add cache-manager-redis-store
pnpm add -D @types/cache-manager

# 或使用 ioredis（推荐，功能更强大）
pnpm add ioredis
pnpm add -D @types/ioredis
```

### 2. 环境配置

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600
```

### 3. Redis 模块配置

```typescript
// src/modules/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 0),
        ttl: configService.get('REDIS_TTL', 3600),
      }),
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

### 4. Redis 服务封装

```typescript
// src/modules/redis/redis.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  // Token 黑名单专用方法
  async addToBlacklist(tokenId: string, ttl: number): Promise<void> {
    await this.set(`blacklist:${tokenId}`, '1', ttl);
  }

  async isBlacklisted(tokenId: string): Promise<boolean> {
    return await this.exists(`blacklist:${tokenId}`);
  }

  // Refresh Token 白名单专用方法
  async setRefreshToken(userId: string, token: string, ttl: number): Promise<void> {
    await this.set(`refresh:${userId}`, token, ttl);
  }

  async getRefreshToken(userId: string): Promise<string | undefined> {
    return await this.get<string>(`refresh:${userId}`);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.del(`refresh:${userId}`);
  }
}
```

### 5. 更新 AuthService

```typescript
// src/modules/auth/auth.service.ts
import { RedisService } from '@modules/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService, // 注入 RedisService
  ) {}

  // 登录时存储 refresh token
  async login(loginDto: LoginDto) {
    // ... 现有逻辑 ...

    const token = await this.generateToken({ ...user, roles });

    // 存储 refresh token 到 Redis
    const refreshTTL = 7 * 24 * 60 * 60; // 7天
    await this.redisService.setRefreshToken(
      user.id,
      token.refreshToken,
      refreshTTL
    );

    return { user, token };
  }

  // 刷新 token 时验证白名单
  async refreshToken(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken);

    // 检查白名单
    const storedToken = await this.redisService.getRefreshToken(payload.sub);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Refresh Token 无效');
    }

    // ... 生成新 token ...

    // 更新白名单
    const refreshTTL = 7 * 24 * 60 * 60;
    await this.redisService.setRefreshToken(
      user.id,
      newToken.refreshToken,
      refreshTTL
    );

    return { user, token: newToken };
  }

  // 退出登录时清除 refresh token 和加入黑名单
  async logout(userId: string, accessToken: string) {
    // 清除 refresh token
    await this.redisService.deleteRefreshToken(userId);

    // 将 access token 加入黑名单
    const decoded = this.jwtService.decode(accessToken) as any;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redisService.addToBlacklist(decoded.jti || decoded.sub, ttl);
    }

    return { message: '退出登录成功' };
  }
}
```

### 6. 更新 JwtAuthGuard

```typescript
// src/common/guards/jwt-auth.guard.ts
import { RedisService } from '@modules/redis/redis.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService, // 注入 RedisService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ... 现有 @Public() 检查逻辑 ...

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      const decoded = this.jwtService.decode(token) as any;
      const tokenId = decoded.jti || decoded.sub;

      // 检查黑名单
      const isBlacklisted = await this.redisService.isBlacklisted(tokenId);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token 已失效');
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

---

## 📈 性能影响评估

### Redis 读写性能

| 操作 | 平均响应时间 | QPS（单实例） |
|------|------------|-------------|
| GET | < 1ms | 100,000+ |
| SET | < 1ms | 100,000+ |
| EXISTS | < 1ms | 100,000+ |
| INCR | < 1ms | 100,000+ |

### 对比数据库查询

| 场景 | 数据库查询 | Redis 缓存 | 性能提升 |
|------|-----------|-----------|---------|
| 用户权限查询 | 10-50ms | < 1ms | **10-50倍** |
| 菜单树查询 | 20-100ms | < 1ms | **20-100倍** |
| Token 黑名单检查 | N/A | < 1ms | 新功能 |

### 额外开销

- ✅ **内存开销**：每个 Token 约 100-200 bytes
- ✅ **网络开销**：< 1ms（本地部署）
- ✅ **维护成本**：Redis 稳定性极高，运维成本低

---

## 💰 成本评估

### 开发成本

| 功能 | 开发时间 | 测试时间 | 总计 |
|------|---------|---------|------|
| Redis 基础配置 | 1小时 | 0.5小时 | 1.5小时 |
| Token 黑名单 | 2小时 | 1小时 | 3小时 |
| Refresh Token 白名单 | 2小时 | 1小时 | 3小时 |
| 分布式限流 | 3小时 | 1小时 | 4小时 |
| 会话管理 | 6小时 | 2小时 | 8小时 |
| **总计** | **14小时** | **5.5小时** | **19.5小时** |

### 运维成本

**本地开发**：
- Redis Docker: 免费
- 内存占用: ~50MB

**生产环境**：
- 云 Redis 服务（如 AWS ElastiCache、阿里云 Redis）:
  - 1GB 实例：约 ¥150-300/月
  - 2GB 实例：约 ¥300-600/月
- 自建 Redis:
  - 服务器成本
  - 人工维护成本

---

## 🎯 最终建议

### 立即启用 Redis（推荐）✅

**如果满足以下任一条件**：

1. ✅ 准备上线生产环境
2. ✅ 需要真正的 Token 失效控制
3. ✅ 计划多服务器部署
4. ✅ 用户量预计 > 1,000
5. ✅ 对安全性有较高要求

**最小化实施方案**：
- 第一阶段只实现 Token 黑名单 + Refresh Token 白名单（约 6 小时）
- 其他功能按需逐步添加

---

### 暂缓启用 Redis

**如果满足以下所有条件**：

1. ✅ 项目仍处于 MVP 阶段
2. ✅ 用户量 < 100
3. ✅ 单服务器部署
4. ✅ 短期内无集群计划

**但需要准备**：
- 预留 Redis 集成的技术方案
- 代码架构支持后期平滑迁移

---

## 📚 相关资源

### 官方文档

- NestJS Cache Manager: https://docs.nestjs.com/techniques/caching
- Redis 官方文档: https://redis.io/docs/
- ioredis 文档: https://github.com/luin/ioredis

### 最佳实践

- JWT + Redis 黑名单: https://redis.io/docs/manual/patterns/distributed-locks/
- 分布式限流: https://redis.io/commands/incr/
- 会话管理: https://redis.io/docs/manual/data-types/sets/

### 学习资源

- Redis 入门教程: https://redis.io/docs/getting-started/
- NestJS + Redis 实战: https://docs.nestjs.com/techniques/caching
- Redis 性能优化: https://redis.io/docs/management/optimization/

---

---

## ✅ 实际实施情况（v2.0）

### 已实现的功能

#### 1. Redis 模块基础架构 ✅

**实现时间**: 2025-11-12

**核心特性**:
- ✅ 使用 `ioredis` 作为 Redis 客户端
- ✅ 全局模块设计，可在所有模块中直接使用
- ✅ 完善的错误处理和连接管理
- ✅ **优雅降级机制**：Redis 连接失败时自动回退到进程内存缓存

**文件位置**:
- `src/modules/redis/redis.module.ts` - Redis 模块配置
- `src/modules/redis/redis.service.ts` - Redis 服务封装
- `src/modules/redis/redis.constants.ts` - Redis 常量定义

**实现亮点**:

1. **智能降级策略**
```typescript
constructor(@Inject(REDIS_CLIENT) private readonly client: Redis | null) {
  this.useFallback = !client;
  if (this.useFallback) {
    this.logger.warn('Redis 未启用或连接失败，回退到进程内缓存');
  }
}
```

2. **统一的缓存接口**
```typescript
// 无论使用 Redis 还是 Fallback，API 完全一致
await redisService.set(key, value, ttl);
await redisService.get(key);
await redisService.del(key);
await redisService.setJson(key, object, ttl);
await redisService.getJson<T>(key);
```

3. **TTL 过期支持**
```typescript
// 支持 TTL 的 Fallback 实现
private readonly fallbackStore = new Map<string, {
  value: string;
  expireAt?: number; // 过期时间戳
}>();
```

#### 2. 权限缓存优化 ✅

**实现时间**: 2025-11-12

**使用场景**:
- `PermissionsGuard` 中缓存用户权限列表
- 减少数据库查询，提升权限验证性能

**实现代码** (`src/common/guards/permissions.guard.ts`):
```typescript
// 缓存用户权限
const cacheKey = `permissions:${user.id}`;
let userPermissionCodes = await this.redisService.getJson<string[]>(cacheKey);

if (!userPermissionCodes) {
  // 缓存未命中，查询数据库
  userPermissionCodes = await this.fetchPermissionsFromDB(userId);

  // 写入缓存（默认 300 秒）
  await this.redisService.setJson(
    cacheKey,
    userPermissionCodes,
    this.permissionCacheTtl
  );
}
```

**配置项**:
- `PERMISSIONS_CACHE_TTL`: 权限缓存时间（默认 300 秒）

**性能提升**:
- 数据库查询: ~20-50ms
- Redis 缓存命中: <1ms
- **性能提升**: 20-50倍

#### 3. 环境变量配置 ✅

**配置文件** (`.env.example`):
```env
# Redis 配置
REDIS_ENABLED=true          # 是否启用 Redis
REDIS_HOST=127.0.0.1       # Redis 主机
REDIS_PORT=6379            # Redis 端口
REDIS_PASSWORD=            # Redis 密码（可选）
REDIS_DB=0                 # Redis 数据库编号
REDIS_KEY_PREFIX=nestbase: # Key 前缀

# 权限缓存配置
PERMISSIONS_CACHE_TTL=300  # 权限缓存时间（秒）
```

**灵活控制**:
- `REDIS_ENABLED=false`: 完全禁用 Redis，使用内存缓存
- `REDIS_ENABLED=true`: 尝试连接 Redis，失败时自动降级

#### 4. 连接管理和错误处理 ✅

**懒连接模式**:
```typescript
const options: RedisOptions = {
  // ... 其他配置
  lazyConnect: true, // 延迟连接
};

const client = new Redis(options);

try {
  await client.connect(); // 显式连接
  return client;
} catch (error) {
  logger.error(`Redis 连接失败，退回内存缓存: ${error.message}`);
  client.disconnect();
  return null; // 返回 null 触发降级
}
```

**事件监听**:
```typescript
client.on('connect', () => logger.log('Redis 已连接'));
client.on('error', (error) => logger.error('Redis 连接异常', error));
client.on('reconnecting', () => logger.warn('Redis 正在重连...'));
```

**优雅关闭**:
```typescript
async onModuleDestroy() {
  if (this.client) {
    await this.client.quit(); // 优雅关闭连接
  }
}
```

---

### 未实现的功能（待后续迭代）

#### 1. Token 黑名单 ⏳

**优先级**: 高
**预计工时**: 2-3 小时

**需要的改动**:
1. 修改 `JwtAuthGuard` 添加黑名单检查
2. 修改 `AuthService.logout()` 添加 Token 到黑名单
3. 生成 Token 时添加 `jti` (JWT ID) 字段

**阻塞原因**: 需要先确定是否需要强制 Token 失效功能

#### 2. Refresh Token 白名单 ⏳

**优先级**: 高
**预计工时**: 2-3 小时

**需要的改动**:
1. 登录时存储 Refresh Token 到 Redis
2. 刷新时验证 Refresh Token 是否在白名单
3. 密码修改时清除白名单

**阻塞原因**: 需要先确定单设备/多设备登录策略

#### 3. 分布式限流 ⏳

**优先级**: 中
**预计工时**: 3-4 小时

**需要的改动**:
1. 创建 `RateLimitGuard`
2. 使用 Redis INCR 命令实现原子计数
3. 替换当前的进程内存限流

**阻塞原因**: 当前单服务器部署，暂不需要分布式限流

#### 4. 会话管理 ⏳

**优先级**: 低
**预计工时**: 1 天

**功能规划**:
- 查看用户所有登录设备
- 远程下线指定设备
- 限制同时登录设备数量

**阻塞原因**: 需求优先级较低

---

### 实施经验总结

#### ✅ 成功经验

1. **优雅降级是关键**
   - Redis 连接失败不应该阻塞应用启动
   - Fallback 机制让开发环境更友好
   - 生产环境和开发环境可以使用相同代码

2. **统一的接口设计**
   - RedisService 提供了统一的 API
   - 业务代码无需关心是 Redis 还是 Fallback
   - 便于后续切换或升级

3. **环境变量控制**
   - `REDIS_ENABLED` 开关非常实用
   - 可以快速切换 Redis/内存缓存
   - 方便测试和调试

#### ⚠️ 需要注意的问题

1. **Fallback 的局限性**
   - 进程内存缓存不支持分布式
   - 应用重启后缓存丢失
   - 多实例部署时缓存不同步

2. **连接错误日志过多**
   - Redis 未启动时会不断重连
   - 建议禁用自动重连或设置 `REDIS_ENABLED=false`

3. **缓存失效策略**
   - 当前只实现了 TTL 自动过期
   - 需要手动清除缓存（如权限变更时）
   - 建议添加 `invalidatePermissionCache(userId)` 方法

#### 💡 改进建议

1. **添加缓存失效方法**
```typescript
// src/modules/redis/redis.service.ts
async invalidatePattern(pattern: string) {
  if (this.useFallback) {
    // 删除所有匹配的 key
    for (const key of this.fallbackStore.keys()) {
      if (key.match(pattern)) {
        this.fallbackStore.delete(key);
      }
    }
    return;
  }

  const keys = await this.client!.keys(pattern);
  if (keys.length > 0) {
    await this.client!.del(...keys);
  }
}
```

2. **禁用自动重连**
```typescript
const options: RedisOptions = {
  // ... 其他配置
  retryStrategy: () => null, // 禁用重连
  maxRetriesPerRequest: 1,   // 最多重试1次
};
```

3. **添加权限缓存失效**
```typescript
// src/modules/user-roles/user-roles.service.ts
async setUserRoles(userId: string, roleIds: string[]) {
  await this.prisma.$transaction(/* ... */);

  // 清除用户权限缓存
  await this.redisService.del(`permissions:${userId}`);
}
```

---

### 性能监控建议

#### 推荐监控指标

1. **缓存命中率**
```typescript
private cacheHits = 0;
private cacheMisses = 0;

async getJson<T>(key: string): Promise<T | null> {
  const value = await this.get(key);
  if (value) {
    this.cacheHits++;
  } else {
    this.cacheMisses++;
  }
  return value ? JSON.parse(value) : null;
}

getCacheStats() {
  const total = this.cacheHits + this.cacheMisses;
  const hitRate = total > 0 ? (this.cacheHits / total * 100).toFixed(2) : '0.00';
  return { hits: this.cacheHits, misses: this.cacheMisses, hitRate: `${hitRate}%` };
}
```

2. **Redis 连接状态**
```typescript
getRedisStatus() {
  return {
    enabled: !this.useFallback,
    connected: this.client?.status === 'ready',
    mode: this.useFallback ? 'fallback' : 'redis',
  };
}
```

3. **Fallback 存储大小**
```typescript
getFallbackStats() {
  if (!this.useFallback) return null;
  return {
    keys: this.fallbackStore.size,
    memory: this.estimateMemoryUsage(),
  };
}
```

---

## 🔄 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2025-11-05 | 初始版本，完整需求分析 |
| v2.0 | 2025-11-12 | 添加实际实施情况、经验总结和改进建议 |

---

**创建时间**: 2025-11-05
**最后更新**: 2025-11-12
**文档维护**: Backend Team
**联系方式**: 项目 Issue Tracker
