# Redis Wrappers （Supabase）接入指南

> 参考官方文档：<https://supabase.com/docs/guides/database/extensions/wrappers/redis>
>
> 作用：允许在 Supabase Postgres 中通过 FDW 查询/调试 Redis 数据（例如本项目的权限缓存、菜单缓存），便于排查和观测。

## 1. 启用扩展与 Redis Wrapper

在 Supabase SQL 编辑器执行：

```sql
-- 1) 启用 wrappers 扩展
create extension if not exists wrappers with schema extensions;

-- 2) 启用 redis_wrapper FDW
create foreign data wrapper redis_wrapper
  handler redis_fdw_handler
  validator redis_fdw_validator;
```

## 2. 在 Vault 保存 Redis 连接串

```sql
-- 将 Redis 连接 URL 存入 Vault，返回的 key_id 供后续使用
select vault.create_secret(
  'redis://username:password@127.0.0.1:6379/0', -- 或 rediss://... SaaS Redis
  'redis',
  'Redis connection URL for Wrappers'
);
```

记下返回的 `key_id`。

## 3. 创建 Redis Server

```sql
create server redis_server
  foreign data wrapper redis_wrapper
  options (
    conn_url_id '<key_id>' -- 上一步返回的 key_id
  );
```

## 4. 创建 schema 与常用外部表

```sql
create schema if not exists redis;

-- 以下示例直接取自官方文档，可按需增删
create foreign table redis.list_example (element text)
server redis_server options (src_type 'list', src_key 'my_list');

create foreign table redis.set_example (element text)
server redis_server options (src_type 'set', src_key 'set');

create foreign table redis.hash_example (
  key   text,
  value text
)
server redis_server options (src_type 'hash', src_key 'hash');

create foreign table redis.zset_example (element text)
server redis_server options (src_type 'zset', src_key 'zset');

create foreign table redis.stream_example (
  id    text,
  event jsonb
)
server redis_server options (src_type 'stream', src_key 'mystream');

create foreign table redis.multi_hashes (
  key   text,
  items jsonb
)
server redis_server options (src_type 'multi_hash', src_key 'hash:*');
```

## 5. 查询示例

```sql
-- 查看列表/集合
select * from redis.list_example limit 10;
select * from redis.set_example limit 10;

-- 批量查看 hash（例如 permissions:*）
select * from redis.multi_hashes limit 10;
```

## 6. 应用侧配置

- `.env` 已新增 `REDIS_URL`/`REDIS_TLS_*`，可直接填入 SaaS Redis（如 Upstash/Supabase 托管 Redis）连接串，或继续使用 `REDIS_HOST/PORT/PASSWORD`。
- `REDIS_ENABLED=false` 时仍会自动回退到进程内内存 Map（仅开发/容灾），不影响 FDW 查询。
- 若希望在 FDW 中直接观察项目的权限/菜单缓存，可在业务端改用 hash 结构（例如 key：`permissions:<userId>`），然后在 SQL 中新建对应外部表。

## 7. 常见问题

- **TLS 证书报错**：将 `.env` 中 `REDIS_TLS_REJECT_UNAUTHORIZED` 设为 `false` 或配置 `REDIS_TLS_CA_FILE`。
- **权限不足**：确保当前 Supabase 角色对子命名空间 `extensions`、`vault` 以及新建 schema 有执行权限。
- **只想观测而不影响业务**：FDW 查询默认只读，不会修改 Redis 内容；如需写操作，请在业务侧或 Redis CLI 完成。
