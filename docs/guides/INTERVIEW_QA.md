# NestBase 技术栈面试题库

本文档整理了基于 **NestBase** 项目架构与技术栈的常见面试题及参考答案，帮助开发者在求职面试中更好地展示项目经验与技术深度。

## 🏗️ 架构设计 (Architecture)

### Q1: 为什么要使用 Monorepo 架构？有哪些优缺点？

**参考答案**：
本项目采用 **pnpm workspace** 实现 Monorepo 架构，主要基于以下考虑：

1.  **代码共享 (Code Sharing)**：前后端（Backend/Frontend）共享 TypeScript 类型定义 (`.d.ts`) 和工具库 (`packages/utils`)，避免了 API 数据结构定义不一致的问题，修改一处类型，前后端同时报错提醒，极大提升了协作效率。
2.  **统一依赖管理 (Dependency Management)**：所有项目依赖统一管理，确保 `vue`、`typescript` 等核心库版本一致，避免版本冲突。pnpm 的软链接机制也大大节省了磁盘空间和安装时间。
3.  **统一工程化配置 (Unified Configuration)**：ESLint、Prettier、Git Hooks 等配置在根目录统一管理，确保整个团队的代码风格一致。

**缺点与挑战**：

- **权限控制**：难以对仓库内的不同项目做细粒度写权限控制（通常全员拥有仓库写权限）。
- **构建复杂度**：Pipeline 需要能够识别变更的模块并进行增量构建（我们通过 pnpm filter 机制解决）。

### Q2: 作为一个全栈项目，你的前后端交互标准是如何设计的？

**参考答案**：
为了降低沟通成本，我们制定了严格的 **API 治理标准**：

1.  **RESTful 风格**：严格遵循资源导向设计，如 `GET /users` (列表), `POST /users` (创建), `PATCH /users/:id` (更新)。
2.  **统一响应结构**：所有接口均返回统一格式 `{ code: 0, data: T, message: string }`，通过 NestJS 的 **Global Interceptor** 自动包装，无需在 Controller 中重复编写。
3.  **全局异常处理**：实现了 Global Exception Filter，将各类 HTTP 异常和业务异常统一转换为标准错误响应，前端只需监听非 0 的 code 即可。
4.  **数据验证**：后端通过 `class-validator` + `ValidationPipe` 在入口处拦截非法数据，前端表单验证规则部分也可复用这些定义。

---

## 🔙 后端技术 (NestJS & Prisma)

### Q3: 你的 RBAC 权限系统是如何设计的？如何实现细粒度控制？

**参考答案**：
本项目实施了 **RBAC (Role-Based Access Control)** 模型，并扩展了细粒度权限控制：

1.  **模型设计**：
    - **用户 (User)**：可以拥有多个角色。
    - **角色 (Role)**：权限的集合，用于菜单可见性控制。
    - **权限 (Permission)**：具体的操作点（如 `user.create`, `user.delete`）。
    - **菜单 (Menu)**：与角色关联，决定左侧导航栏的渲染。
2.  **鉴权机制 (Guard)**：
    - **认证**：`JwtAuthGuard` 验证 Token 解析出 User。
    - **角色检查**：`RolesGuard` 配合 `@Roles('ADMIN')` 装饰器，控制粗粒度访问。
    - **权限检查**：实现了**AOP 切面**的 `PermissionsGuard`，配合自定义装饰器 `@RequirePermissions('user.create')`，在 Controller 方法执行前即拦截无权请求。

### Q4: 为什么选择 Prisma 而不是 TypeORM？

**参考答案**：

1.  **类型安全 (Type Safety)**：Prisma 会根据 schema 自动生成强类型的 Client，查询结果自带类型推导，这与我们全栈 TypeScript 的理念完美契合。TypeORM 虽然也支持 TS，但在复杂关联查询的类型推导上不如 Prisma 智能。
2.  **开发体验**：Prisma Schema (`schema.prisma`) 定义直观清晰，`prisma migrate` 数据库迁移工作流比 TypeORM 的同步机制更可靠可控。
3.  **查询直观**：Prisma 的查询 API 更贴近对象操作 (Object-based)，而非 SQL 拼接，代码可读性更高。

### Q5: 在 NestJS 中如何处理循环依赖？

**参考答案**：
(结合项目实际) 在 Auth 模块和 User 模块相互引用时遇到了这个问题。

- **解决方案**：使用 `forwardRef()`。在 Module 导入时使用 `imports: [forwardRef(() => UsersModule)]`，并在 Service 注入时使用 `@Inject(forwardRef(() => UsersService))`。这延迟了模块的解析，允许 NestJS 解决循环引用。

---

## 🎨 前端技术 (Vue 3)

### Q6: 前端动态路由（菜单权限）是如何实现的？

**参考答案**：
这是一个典型的 **后端驱动 (Backend-Driven)** 动态路由方案：

1.  **路由定义**：前端代码中只保留基础路由（如登录页、404），所有业务路由组件在前端注册，但路径关系由后端管理。
2.  **初始化流程**：
    - 用户登录后，调用 `/auth/user-routes` 接口。
    - 后端根据用户角色计算出其可访问的菜单树。
    - 前端拿到菜单树后，递归遍历，将 Server 端的组件 key 映射为前端真实的 import 组件。
    - 使用 `router.addRoute()` 动态挂载路由。
3.  **优势**：权限变更无需重新发布前端，管理员在后台配置菜单即可实时生效。

### Q7: 你的项目中用到了哪些 Vue 3 的新特性？

**参考答案**：

1.  **Composition API (Script Setup)**：全面使用 `<script setup>` 语法糖，逻辑复用更方便（如封装了 `useTable`, `useForm` 等 Hooks）。
2.  **Custom Hooks**：
    - **`useTable`**：封装了分页、搜索、Loading 状态、数据获取的通用逻辑，使得每个管理页面的代码量减少了 50% 以上。
    - **`useBoolean`**：优雅处理 Modal/Drawer 的开关状态。
3.  **Teleport**：用于封装全局的 Modal 弹窗组件，避免层级嵌套导致的 z-index 问题。

---

## 🛠️ 工程化与运维

### Q8: 项目是如何部署的？

**参考答案**：

1.  **Docker 化**：编写了 `Dockerfile`，采用多阶段构建 (Multi-stage Build) 减小镜像体积，只保留 `dist` 和生产依赖。
2.  **GitHub Actions (CI/CD)**：
    - 配置了自动化工作流，当代码推送到 `main` 分支时，自动运行 Lint 检查和 Build。
    - 文档站点 (VitePress) 自动打包并发布到 GitHub Pages。
3.  **环境变量管理**：严格区分 `.env.development` 和 `.env.production`，敏感信息（如数据库密码、JWT Secret）通过 CI/CD 的 Secrets 注入，不提交到代码仓库。

### Q9: 遇到了什么难点？如何解决的？

**参考答案 (可根据您的实际体会调整)**：

- **难点**：在做 RBAC 时，如何处理"父子菜单权限级联"与"按钮级权限"的关系。
- **解决**：将"菜单"和"权限点"解耦。菜单控制页面进入权限，权限点控制页面内的按钮（增删改）。在数据库设计上，角色与菜单表关联，同时角色与权限表关联，两者独立又互补，实现了最大的灵活性。

---

## 🌟 简历加分项话术

- **全栈视野**：能独立完成从数据库设计(Schema)到后端 API(NestJS)再到前端交互(Vue3)的完整闭环开发。
- **规范意识**：推崇代码规范，项目中严格配置了 ESLint, Prettier 和 Git Commit 规范。
- **文档能力**：编写了详细的 API 文档和开发指南，认为良好的文档是工程质量的重要组成部分。
