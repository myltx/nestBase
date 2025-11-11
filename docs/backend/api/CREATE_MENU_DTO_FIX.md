# CreateMenuDto 验证修复说明

## 修复的问题

### 1. query 字段类型限制
**问题**: `query` 字段被限制为对象类型，但实际使用中需要支持数组
**修复**: 移除 `@IsObject()` 验证，允许任意 JSON 类型（对象、数组、null）

### 2. parentId=0 导致验证失败
**问题**: 前端传递 `parentId: 0` 时，UUID 验证器报错
**修复**: 添加 `@Transform` 转换器，自动将 `0`、`'0'`、空字符串转换为 `null`

---

## 修复后的代码

```typescript
// parentId 字段
@ApiPropertyOptional({
  description: '父菜单 ID',
  example: 'uuid',
})
@IsOptional()
@Transform(({ value }) => {
  // 将 0, '0', '' 转换为 null
  if (value === 0 || value === '0' || value === '') {
    return null;
  }
  return value;
})
@ValidateIf((o) => o.parentId !== null && o.parentId !== '' && o.parentId !== undefined)
@IsUUID('4', { message: '父菜单 ID 必须是有效的 UUID' })
parentId?: string;

// query 字段
@ApiPropertyOptional({
  description: '查询参数 JSON (对象或数组)',
  example: [{ key: 'id', value: '1' }],
})
@IsOptional()
query?: any;
```

---

## 支持的用例

### ✅ 创建目录菜单（menuType=1）

**用例 1: parentId 为 0**
```json
{
  "routeName": "system",
  "routePath": "/system",
  "menuName": "系统管理",
  "menuType": 1,
  "parentId": 0,
  "query": []
}
```
✅ **结果**: `parentId` 自动转换为 `null`，验证通过

**用例 2: parentId 为字符串 '0'**
```json
{
  "routeName": "system",
  "routePath": "/system",
  "menuName": "系统管理",
  "menuType": 1,
  "parentId": "0"
}
```
✅ **结果**: `parentId` 自动转换为 `null`，验证通过

**用例 3: parentId 为空字符串**
```json
{
  "routeName": "system",
  "routePath": "/system",
  "menuName": "系统管理",
  "menuType": 1,
  "parentId": ""
}
```
✅ **结果**: `parentId` 自动转换为 `null`，验证通过

**用例 4: 不传 parentId**
```json
{
  "routeName": "system",
  "routePath": "/system",
  "menuName": "系统管理",
  "menuType": 1
}
```
✅ **结果**: `parentId` 为 `undefined`，验证通过

**用例 5: parentId 为 null**
```json
{
  "routeName": "system",
  "routePath": "/system",
  "menuName": "系统管理",
  "menuType": 1,
  "parentId": null
}
```
✅ **结果**: `parentId` 保持 `null`，验证通过

---

### ✅ query 字段支持多种格式

**用例 1: query 为数组**
```json
{
  "routeName": "user-detail",
  "routePath": "/user/:id",
  "menuName": "用户详情",
  "menuType": 2,
  "query": [
    { "key": "id", "value": "123" },
    { "key": "tab", "value": "profile" }
  ]
}
```
✅ **结果**: 验证通过

**用例 2: query 为空数组**
```json
{
  "routeName": "home",
  "routePath": "/home",
  "menuName": "首页",
  "menuType": 2,
  "query": []
}
```
✅ **结果**: 验证通过

**用例 3: query 为对象**
```json
{
  "routeName": "settings",
  "routePath": "/settings",
  "menuName": "设置",
  "menuType": 2,
  "query": { "theme": "dark", "lang": "zh-CN" }
}
```
✅ **结果**: 验证通过

**用例 4: 不传 query**
```json
{
  "routeName": "about",
  "routePath": "/about",
  "menuName": "关于",
  "menuType": 2
}
```
✅ **结果**: 验证通过

**用例 5: query 为 null**
```json
{
  "routeName": "contact",
  "routePath": "/contact",
  "menuName": "联系",
  "menuType": 2,
  "query": null
}
```
✅ **结果**: 验证通过

---

### ✅ 创建子菜单（menuType=2）

**用例: 有效的父菜单 UUID**
```json
{
  "routeName": "user-list",
  "routePath": "/system/users",
  "menuName": "用户列表",
  "menuType": 2,
  "parentId": "550e8400-e29b-41d4-a716-446655440000"
}
```
✅ **结果**: 验证通过

---

### ❌ 仍然会失败的用例

**用例: parentId 为无效的 UUID**
```json
{
  "routeName": "user-list",
  "routePath": "/system/users",
  "menuName": "用户列表",
  "menuType": 2,
  "parentId": "invalid-uuid"
}
```
❌ **结果**: `"父菜单 ID 必须是有效的 UUID"`

**用例: 目录菜单有父菜单**
```json
{
  "routeName": "sub-system",
  "routePath": "/system/sub",
  "menuName": "子系统",
  "menuType": 1,
  "parentId": "550e8400-e29b-41d4-a716-446655440000"
}
```
❌ **结果**: `"目录类型菜单不能设置父菜单"` (在 service 层验证)

---

## 转换逻辑说明

### parentId 转换规则

| 输入值 | 转换后 | 说明 |
|--------|--------|------|
| `0` (数字) | `null` | 数字 0 转为 null |
| `"0"` (字符串) | `null` | 字符串 "0" 转为 null |
| `""` (空字符串) | `null` | 空字符串转为 null |
| `undefined` | `undefined` | 保持不变 |
| `null` | `null` | 保持不变 |
| 有效 UUID 字符串 | 原值 | 保持不变 |
| 无效值 | 原值 | 保持不变，但会触发 UUID 验证错误 |

### query 验证规则

- ✅ 允许：对象 `{}`
- ✅ 允许：数组 `[]`
- ✅ 允许：`null`
- ✅ 允许：`undefined`（不传）
- ✅ 允许：任意 JSON 值

---

## 测试建议

### 前端集成测试

```typescript
// 测试 1: 创建目录，parentId 默认为 0
const directoryMenu = {
  routeName: 'system',
  routePath: '/system',
  menuName: '系统管理',
  menuType: 1,
  parentId: 0,  // 前端默认值
  query: []     // 空数组
};

// 测试 2: 创建子菜单，有父菜单
const subMenu = {
  routeName: 'user-list',
  routePath: '/system/users',
  menuName: '用户列表',
  menuType: 2,
  parentId: parentMenuId,  // UUID
  query: [{ key: 'page', value: '1' }]
};

// 测试 3: 创建菜单，不传可选字段
const simpleMenu = {
  routeName: 'home',
  routePath: '/home',
  menuName: '首页',
  menuType: 2
  // parentId 和 query 都不传
};
```

---

## 修改文件

- `src/modules/menus/dto/create-menu.dto.ts`
  - 添加 `Transform` 导入
  - 为 `parentId` 添加 `@Transform` 转换器
  - 移除 `query` 的 `@IsObject()` 验证

---

**修复日期**: 2025-10-27
**修复版本**: v1.4.1
**相关文件**: `src/modules/menus/dto/create-menu.dto.ts`
