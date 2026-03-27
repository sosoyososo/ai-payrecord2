# SPA 未知路由处理设计

## 问题描述

注销登录后，页面跳转到 `/login`，但如果用户直接访问未知路径（如 `domainname/unknown-page`）或出现路由匹配失败的情况，页面显示空白。

**根因分析：**
- `App.tsx` 中的 `Routes` 没有 catch-all 路由（`path="*"`）
- 未知路径无法被任何路由匹配，React Router 返回空白页面

## 解决方案

在 `App.tsx` 的 `Routes` 末尾添加通配符路由，统一处理所有未匹配的路径。

## 变更内容

### 文件：`frontend/src/App.tsx`

新增 `UnknownRoute` 组件：

```tsx
function UnknownRoute() {
  const { user } = useAuth()
  return <Navigate to={user ? '/' : '/login'} replace />
}
```

在 `Routes` 末尾添加：

```tsx
<Route path="*" element={<UnknownRoute />} />
```

### 逻辑说明

| 用户状态 | 访问未知路径 | 跳转目标 |
|---------|-------------|---------|
| 已登录 (`user != null`) | 任意未知路径 | `/` (首页) |
| 未登录 (`user == null`) | 任意未知路径 | `/login` (登录页) |

## 验证测试用例

| TC-ID | 场景 | 预期结果 |
|-------|------|---------|
| TC-UI-ROUTE-001 | 已登录用户访问 `/unknown-page` | 跳转至首页 `/` |
| TC-UI-ROUTE-002 | 未登录用户访问 `/unknown-page` | 跳转至登录页 `/login` |
| TC-UI-ROUTE-003 | 注销后导航到未知页面 | 正常显示登录页，不再空白 |
| TC-UI-ROUTE-004 | 直接访问根路径 `/` | 正常显示首页（不受影响） |
| TC-UI-ROUTE-005 | 访问 `/add`、`/stats` 等已知路由 | 正常显示对应页面（不受影响） |

## 影响范围

- 仅新增代码，不修改现有路由逻辑
- 所有现有路由不受影响
- 用户体验：任何未知路径都能正确导航，不再出现空白页
