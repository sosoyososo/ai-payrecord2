# 路由重构设计方案

**日期**: 2026-04-24
**状态**: 已批准
**类型**: 架构重构

## 背景

当前路由实现存在以下问题：
1. **导航 Bug**: TabBar 点击后 URL 变化但页面不更新
2. **代码重复**: 每个受保护路由都重复包裹 `ProtectedRoute` + `AnimatedPage`
3. **可维护性差**: 路由配置分散，难以一眼看清所有路由

## 设计方案

### 方案选择：Layout Route 嵌套 (react-router-dom 原生特性)

## 目标

1. 修复 TabBar 导航问题
2. 减少样板代码 80%
3. 提升路由可维护性
4. 统一导航模式

## 架构设计

### 路由层级

```
App.tsx
└── Routes (根路由)
    ├── Public Routes (无需布局)
    │   ├── /login → LoginPage
    │   ├── /verify-email → EmailVerificationPage
    │   ├── /forgot-password → ForgotPasswordPage
    │   └── /reset-password → ResetPasswordPage
    │
    └── Protected Routes (AppLayout 包裹)
        └── AppLayout (Layout Route)
            ├── Desktop: 左侧导航 + Outlet
            ├── Mobile: 顶部 Header + Outlet + TabBar
            │
            ├── index (/) → HomePage
            ├── stats → StatsPage
            ├── budget → BudgetPage
            ├── settings → SettingsPage
            ├── ledgers → LedgerPage
            ├── categories → CategoryPage
            ├── tags → TagPage
            ├── export → ExportPage
            └── add, edit/:id → 独立页面（无 TabBar）
```

### 核心改动

#### 1. App.tsx 重构

**Before:**
```tsx
<Route
  path="/stats"
  element={
    <ProtectedRoute>
      <AnimatedPage>
        <StatsPage />
      </AnimatedPage>
    </ProtectedRoute>
  }
/>
```

**After:**
```tsx
<Route element={<AppLayout />}>
  <Route path="stats" element={<StatsPage />} />
</Route>
```

#### 2. AppLayout 职责

- 包含 `ProtectedRoute` 逻辑（检查用户登录状态）
- 根据屏幕宽度渲染 Desktop 或 Mobile 布局
- 渲染 `<Outlet />` 显示子路由内容
- TabBar 和 Desktop Nav 使用同一份 `navItems` 配置

#### 3. 导航配置集中化

```tsx
// src/config/navigation.ts
export const navItems = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/stats', labelKey: 'nav.stats', icon: BarChart3 },
  { path: '/budget', labelKey: 'nav.budget', icon: PiggyBank },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
]
```

#### 4. 页面过渡动画

`AnimatedPage` wrapper 移除，改为 CSS transition：
```css
.page-enter {
  animation: fadeSlideIn 0.2s ease-out;
}
```

## 受保护路由列表

| Path | Component |
|------|-----------|
| / | HomePage |
| /stats | StatsPage |
| /budget | BudgetPage |
| /settings | SettingsPage |
| /ledgers | LedgerPage |
| /categories | CategoryPage |
| /tags | TagPage |
| /export | ExportPage |
| /add | AddRecordPage |
| /edit/:id | EditRecordPage |

## 实施步骤

1. 创建 `src/config/navigation.ts` 集中管理导航配置
2. 重构 App.tsx 使用 Layout Route 模式
3. 重构 AppLayout 包含 ProtectedRoute 逻辑
4. 统一 TabBar 和 Desktop Nav 使用 navItems
5. 移除 console.log 调试代码
6. 验证导航功能

## 预期效果

- TabBar 点击正常导航到对应页面
- 路由配置从 ~100 行减少到 ~40 行
- 所有受保护路由统一通过 AppLayout 鉴权
- 导航行为一致（统一使用 navigate()）

## 风险与注意事项

- 确保 `/add` 和 `/edit/:id` 不显示 TabBar（通过嵌套布局实现）
- 确保动画效果不造成视觉卡顿
- 确保 Capacitor 环境下 URL 变化正确触发页面更新