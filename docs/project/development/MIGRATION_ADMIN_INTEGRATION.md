# 迁移指南：集成 nestBase-admin 到 Monorepo

## 1. 目标

将独立的 `nestBase-admin` (Soybean Admin) 项目整合到 NestBase Monorepo 结构中，作为标准的前端应用 (`apps/frontend`)，并将其依赖的本地包提升到根工作区。

## 2. 迁移步骤记录

### 2.1 准备工作

- 创建新分支 `feature/infrastructure/frontend-integration` 以确保安全。

### 2.2 包迁移 (Package Migration)

- **源路径**: `apps/nestBase-admin/packages/*`
- **目标路径**: `packages/*`
- **操作**: 将 Admin 项目下的 `packages` 目录内容移动到根目录的 `packages` 目录。这使得这些工具库（如 `@sa/axios`, `@sa/utils`）成为整个 Monorepo 的共享资源。

### 2.3 应用迁移 (App Migration)

- **操作**:
  1. 删除原有的空目录 `apps/frontend`。
  2. 将 `apps/nestBase-admin` 移动并重命名为 `apps/frontend`。
- **配置调整**:
  - 修改 `apps/frontend/package.json` 中的 `name` 为 `@nestbase/frontend` (可选，或保持 `soybean-admin`)。
  - 确保其依赖指向 workspace 协议（如 `"@sa/utils": "workspace:*"`）。
  - **注意**: 如果原 Admin 项目对 `node` 或 `pnpm` 版本要求过高（如 Node 20+），建议将其 `engines` 字段调整为 `">=18.0.0"` 以匹配 Monorepo 环境，或者升级开发环境。

### 2.4 工作区配置 (Workspace Config)

- 更新根目录 `pnpm-workspace.yaml`，确保包含：
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```

### 2.5 依赖安装与验证

- 运行 `pnpm install` 重新链接依赖。
- 运行 `pnpm dev:frontend` 验证前端启动。

## 3. 注意事项

- 本次迁移涉及大量文件移动，建议在移动前确保 git工作区干净。
- `pnpm-lock.yaml` 可能会发生较大变化，这是正常的。
