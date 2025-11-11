# parentId 不可修改设计说明

## 设计决策

菜单的 `parentId` 字段在创建后**不允许修改**，以保持菜单树结构的稳定性。

## 实现方式

### 创建菜单
`parentId` 在创建时正常使用，可以设置菜单的父子关系。

```typescript
// POST /api/menus
{
  "routeName": "user-list",
  "routePath": "/system/users",
  "menuName": "用户列表",
  "menuType": 2,
  "parentId": "parent-menu-uuid"  // ✅ 创建时可以设置
}
```

### 更新菜单
更新菜单时，**即使传入了 `parentId`，也会被忽略**，不会报错，也不会更新。

```typescript
// PATCH /api/menus/:id
{
  "menuName": "用户管理",
  "parentId": "new-parent-uuid"  // ⚠️ 会被忽略，不会更新
}
```

## 实现代码

### menus.service.ts - update 方法

```typescript
async update(id: string, updateMenuDto: UpdateMenuDto) {
  const existingMenu = await this.prisma.menu.findUnique({
    where: { id },
  });

  const { routeName, parentId, menuType, ...rest } = updateMenuDto;

  // 注意：parentId 创建后不能修改，即使传入也会被忽略

  // 验证：目录类型（menuType=1）不能有父菜单
  const finalMenuType = menuType !== undefined ? menuType : existingMenu.menuType;
  const finalParentId = existingMenu.parentId; // 始终使用现有的 parentId，不允许修改

  if (finalMenuType === 1 && finalParentId) {
    throw new BadRequestException({
      message: '目录类型菜单不能设置父菜单',
      code: BusinessCode.VALIDATION_ERROR,
    });
  }

  // 更新菜单（parentId 不可修改）
  const menu = await this.prisma.menu.update({
    where: { id },
    data: {
      ...(routeName && { routeName }),
      // parentId 不可修改，即使传入也会被忽略
      ...(menuType !== undefined && { menuType }),
      ...rest,
    },
    select: this.menuSelect,
  });

  return menu;
}
```

### 关键点

1. **从 DTO 中解构 `parentId`**：虽然从 DTO 中提取了 `parentId`，但不会用于更新
2. **使用现有的 `parentId`**：验证逻辑使用 `existingMenu.parentId`
3. **更新时不包含 `parentId`**：`data` 对象中没有 `parentId` 字段
4. **移除了父菜单验证逻辑**：不再验证传入的 `parentId` 是否有效，因为不会使用

## 设计理由

### 为什么不允许修改 parentId？

1. **保持树结构稳定**
   - 修改父菜单会改变整个菜单树的结构
   - 可能影响权限分配和路由生成

2. **避免循环引用**
   - 防止菜单A设为菜单B的子菜单，同时菜单B又是菜单A的后代
   - 简化验证逻辑

3. **权限一致性**
   - 菜单的父子关系通常与权限设计紧密相关
   - 修改父子关系可能导致权限配置混乱

4. **简化业务逻辑**
   - 前端可以依赖父子关系不变的事实进行优化
   - 减少需要处理的边界情况

### 为什么不报错而是忽略？

1. **更好的用户体验**
   - 前端可能在更新其他字段时无意中携带了 `parentId`
   - 不需要前端特殊处理去移除 `parentId` 字段

2. **向后兼容**
   - 如果之前允许修改 `parentId`，这个改动不会破坏现有的前端代码
   - 只是让修改无效化，而不是返回错误

3. **API 更宽容**
   - RESTful API 设计中，PATCH 请求应该是幂等的
   - 忽略不可修改的字段比报错更符合这个原则

## 可更新的字段

更新菜单时，以下字段**可以修改**：

✅ `routeName` - 路由标识
✅ `routePath` - 路由路径
✅ `menuName` - 菜单名称
✅ `i18nKey` - 国际化 key
✅ `iconType` - 图标类型
✅ `icon` - Iconify 图标
✅ `localIcon` - 本地图标
✅ `iconFontSize` - 图标大小
✅ `order` - 排序
✅ `menuType` - 菜单类型（受限制，见下方）
✅ `component` - 页面组件路径
✅ `href` - 外链地址
✅ `hideInMenu` - 是否在菜单中隐藏
✅ `activeMenu` - 激活的菜单 key
✅ `multiTab` - 是否支持多标签页
✅ `fixedIndexInTab` - 固定在标签页的索引
✅ `status` - 菜单状态
✅ `keepAlive` - 是否缓存
✅ `constant` - 是否为常量路由
✅ `query` - 查询参数

❌ `parentId` - **父菜单 ID（不可修改）**

### menuType 修改限制

虽然 `menuType` 可以修改，但有限制：
- 如果修改为目录类型（menuType=1），且该菜单有父菜单，会报错
- 这是因为目录类型不允许有父菜单

## 前端处理建议

### 创建菜单
```typescript
const createMenu = async (menuData) => {
  return await api.post('/api/menus', menuData);
};

// 创建子菜单
createMenu({
  routeName: 'user-list',
  routePath: '/system/users',
  menuName: '用户列表',
  menuType: 2,
  parentId: parentMenuId  // ✅ 可以设置
});
```

### 更新菜单
```typescript
const updateMenu = async (id, menuData) => {
  // 方式1：不传 parentId（推荐）
  const { parentId, ...updateData } = menuData;
  return await api.patch(`/api/menus/${id}`, updateData);

  // 方式2：传了也会被忽略（不推荐但不会报错）
  return await api.patch(`/api/menus/${id}`, menuData);
};
```

### 移动菜单（如果需要）
如果业务需要移动菜单到其他父菜单下，建议的方案：

```typescript
// 方案1：删除后重建（会丢失配置）
const moveMenu = async (menuId, newParentId) => {
  const oldMenu = await api.get(`/api/menus/${menuId}`);
  await api.delete(`/api/menus/${menuId}`);
  return await api.post('/api/menus', {
    ...oldMenu,
    parentId: newParentId
  });
};

// 方案2：提供专门的移动 API（需要后端实现）
// POST /api/menus/:id/move
// { "newParentId": "uuid" }
```

## 测试用例

### ✅ 创建菜单
```bash
curl -X POST http://localhost:9423/api/menus \
  -H "Content-Type: application/json" \
  -d '{
    "routeName": "user-list",
    "routePath": "/system/users",
    "menuName": "用户列表",
    "menuType": 2,
    "parentId": "parent-uuid"
  }'
```
**结果**: ✅ 成功创建，parentId 被保存

### ✅ 更新菜单（不传 parentId）
```bash
curl -X PATCH http://localhost:9423/api/menus/:id \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "用户管理"
  }'
```
**结果**: ✅ 更新成功，parentId 保持不变

### ✅ 更新菜单（传入 parentId）
```bash
curl -X PATCH http://localhost:9423/api/menus/:id \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "用户管理",
    "parentId": "new-parent-uuid"
  }'
```
**结果**: ✅ 更新成功，但 parentId **被忽略**，保持原值

### ✅ 更新菜单（传入 parentId=0）
```bash
curl -X PATCH http://localhost:9423/api/menus/:id \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "用户管理",
    "parentId": 0
  }'
```
**结果**: ✅ 更新成功，parentId **被忽略**，保持原值

## 注意事项

1. **文档要明确说明**：API 文档中应明确标注 `parentId` 在更新时会被忽略
2. **前端缓存更新**：前端更新菜单后，应该重新获取菜单数据，而不是假设所有传入的字段都被更新
3. **日志记录**：可以考虑在日志中记录用户尝试修改 `parentId` 的行为，用于分析是否有这个需求

## 如果需要支持移动菜单

如果未来需要支持移动菜单（修改 parentId），建议添加专门的 API：

```typescript
// 新增专门的移动菜单 API
@Post(':id/move')
async moveMenu(
  @Param('id') id: string,
  @Body() moveDto: MoveMenuDto,
) {
  return this.menusService.moveMenu(id, moveDto.newParentId);
}

// menus.service.ts
async moveMenu(id: string, newParentId: string | null) {
  // 1. 验证目标父菜单存在
  // 2. 验证不会形成循环引用
  // 3. 验证 menuType 与新父菜单兼容
  // 4. 更新 parentId
  // 5. 可能需要更新相关权限和路由缓存
}
```

---

**修改日期**: 2025-10-27
**版本**: v1.4.2
**影响范围**: 菜单更新逻辑
