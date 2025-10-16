# OpenAPI 文档导出实现说明

## ✅ 已实现功能

### 1. **OpenAPI JSON 接口**

**接口**: `GET /api/swagger/json`

**功能**: 返回完整的 OpenAPI 3.0 规范 JSON 文档，用于 Apifox、Postman 等工具导入

**特性**:
- ✅ 直接返回标准 OpenAPI JSON 格式
- ✅ **不包装在统一响应格式中**（使用 `@SkipTransform()` 装饰器）
- ✅ 公开访问，无需认证（`@Public()` 装饰器）
- ✅ 不在 Swagger UI 中显示（`@ApiExcludeEndpoint()` 避免递归）

### 2. **API 统计接口**

**接口**: `GET /api/swagger/stats`

**功能**: 返回 API 统计信息（总接口数、分组、服务器等）

**特性**:
- ✅ 包装在统一响应格式中（正常使用 TransformInterceptor）
- ✅ 公开访问
- ✅ 在 Swagger UI 中显示

---

## 🔧 技术实现

### 核心组件

#### 1. **SkipTransform 装饰器**

文件: `src/common/decorators/skip-transform.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipTransform';
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
```

**作用**: 标记接口跳过全局的 TransformInterceptor

#### 2. **TransformInterceptor 更新**

文件: `src/common/interceptors/transform.interceptor.ts`

**新增逻辑**:
```typescript
import { Reflector } from '@nestjs/core';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    // 检查是否跳过转换
    const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTransform) {
      // 直接返回原始数据，不做转换
      return next.handle();
    }

    // 正常转换（包装响应）
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data,
        message: 'success',
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

**功能**:
- 使用 Reflector 检查 `@SkipTransform()` 元数据
- 如果标记跳过，直接返回原始数据
- 否则包装成统一格式

#### 3. **SwaggerController**

文件: `src/modules/swagger/swagger.controller.ts`

```typescript
@Controller('swagger')
export class SwaggerController {
  @Get('json')
  @Public()                  // 公开访问
  @SkipTransform()           // 跳过响应包装
  @ApiExcludeEndpoint()      // 不在 Swagger UI 显示
  getOpenApiJson() {
    return this.swaggerService.getDocument();
  }

  @Get('stats')
  @Public()                  // 公开访问
  // 不使用 @SkipTransform()，会正常包装
  getStats() {
    return this.swaggerService.getStats();
  }
}
```

#### 4. **SwaggerService**

文件: `src/modules/swagger/swagger.service.ts`

```typescript
@Injectable()
export class SwaggerService {
  private document: OpenAPIObject;

  setDocument(document: OpenAPIObject) {
    this.document = document;
  }

  getDocument(): OpenAPIObject {
    return this.document;
  }

  getStats() {
    // 返回统计信息
    return {
      title: this.document.info?.title,
      version: this.document.info?.version,
      totalEndpoints: ...,
      totalPaths: ...,
      tags: ...,
    };
  }
}
```

#### 5. **main.ts 集成**

文件: `src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置 Swagger 并获取 document
  const document = setupSwagger(app);

  // 将 document 注入到 SwaggerService
  const swaggerService = app.get(SwaggerService);
  swaggerService.setDocument(document);

  await app.listen(port);
}
```

---

## 📋 响应格式对比

### `/api/swagger/json` - 原始 OpenAPI JSON

```json
{
  "openapi": "3.0.0",
  "info": { ... },
  "paths": { ... },
  "components": { ... }
}
```

**✅ 正确**: 直接返回标准 OpenAPI 格式，Apifox 可以正确解析

### `/api/swagger/stats` - 统一包装格式

```json
{
  "success": true,
  "data": {
    "title": "NestBase API Documentation",
    "version": "1.0",
    "totalEndpoints": 18,
    ...
  },
  "message": "success",
  "timestamp": "2025-10-16T06:30:00.000Z"
}
```

**✅ 正确**: 包装在统一响应格式中，与其他 API 保持一致

---

## 🎯 使用场景

### 场景 1: Apifox 自动导入

```
URL: http://localhost:3001/api/swagger/json
```

Apifox 会：
1. 发送 GET 请求到该 URL
2. 接收到标准 OpenAPI JSON
3. 解析并导入所有接口定义
4. 自动创建接口分组和数据模型

### 场景 2: 查看 API 统计

```bash
curl http://localhost:3001/api/swagger/stats

# 响应（包装格式）
{
  "success": true,
  "data": {
    "totalEndpoints": 18,
    "totalPaths": 14,
    "tags": [...]
  }
}
```

---

## 🛠️ 扩展用法

### 其他需要跳过包装的场景

如果有其他接口需要返回原始数据，只需添加 `@SkipTransform()` 装饰器：

```typescript
@Controller('files')
export class FilesController {
  @Get('download')
  @SkipTransform()  // 直接返回文件流
  downloadFile() {
    return streamFile();
  }
}
```

### 适用场景

- ✅ 文件下载（返回 Buffer/Stream）
- ✅ 第三方格式规范（OpenAPI、RSS、Sitemap 等）
- ✅ Webhook 回调（需要特定响应格式）
- ✅ 健康检查端点（返回简单状态）

---

## 📊 技术优势

1. **标准兼容**: 符合 OpenAPI 3.0 规范，所有工具都能识别
2. **灵活控制**: 通过装饰器精确控制哪些接口需要包装
3. **统一管理**: 所有响应处理逻辑集中在 TransformInterceptor
4. **易于扩展**: 新增跳过包装的场景只需添加装饰器
5. **类型安全**: 使用 TypeScript 保证类型正确性

---

## ✅ 验证测试

### 测试 OpenAPI JSON

```bash
# 应该直接返回 OpenAPI JSON（不包装）
curl http://localhost:3001/api/swagger/json | jq '.openapi'
# 输出: "3.0.0"

# 不应该有 success 字段
curl http://localhost:3001/api/swagger/json | jq '.success'
# 输出: null
```

### 测试 API 统计

```bash
# 应该返回包装格式
curl http://localhost:3001/api/swagger/stats | jq '.success'
# 输出: true

# data 字段包含统计信息
curl http://localhost:3001/api/swagger/stats | jq '.data.totalEndpoints'
# 输出: 18
```

---

## 📚 相关文件

- `src/common/decorators/skip-transform.decorator.ts` - 跳过转换装饰器
- `src/common/interceptors/transform.interceptor.ts` - 响应转换拦截器（已更新）
- `src/modules/swagger/swagger.controller.ts` - Swagger 控制器
- `src/modules/swagger/swagger.service.ts` - Swagger 服务
- `src/modules/swagger/swagger.module.ts` - Swagger 模块
- `src/config/swagger.config.ts` - Swagger 配置
- `src/main.ts` - 应用入口（注入 document）

---

**最后更新**: 2025-10-16
**版本**: 1.0.0
**状态**: ✅ 已实现并测试通过
