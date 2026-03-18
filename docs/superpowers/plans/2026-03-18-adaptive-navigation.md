# 自适应导航实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现自适应导航，根据屏幕尺寸显示不同导航模式

**Architecture:** 使用 React Router Outlet 布局组件，根据窗口宽度切换导航模式

**Tech Stack:** React, Tailwind CSS, react-router-dom

---

## Task 1: 创建 AppLayout 组件

**Files:**
- Create: `frontend/src/components/AppLayout.tsx`

- [ ] **Step 1: 创建 AppLayout 组件**

包含：
- 底部 Tab Bar（手机/平板）
- 左侧导航栏（PC）
- Outlet 渲染子路由

- [ ] **Step 2: 定义导航配置**

```tsx
const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/stats', icon: BarChart3, label: '统计' },
  { path: '/budget', icon: PiggyBank, label: '预算' },
  { path: '/settings', icon: Settings, label: '设置' },
]
```

---

## Task 2: 修改 App.tsx 使用 Layout

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 3: 导入并使用 AppLayout**

```tsx
import AppLayout from './components/AppLayout'

// 使用 Outlet 包裹所有页面
<Route element={<AppLayout />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/stats" element={<StatsPage />} />
  ...
</Route>
```

---

## Task 3: 移除页面重复 header

**Files:**
- Modify: 各页面组件

- [ ] **Step 4: 移除各页面的 header**

移除 HomePage, StatsPage, BudgetPage, SettingsPage 等页面的 `<header className="bg-white...">`

---

## Task 4: 构建验证

- [ ] **Step 5: 构建**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add frontend/src/components/AppLayout.tsx frontend/src/App.tsx frontend/src/pages/*.tsx
git commit -m "feat: 添加自适应导航布局"
```

---

## 验收标准

1. 手机 (<768px): 显示底部 Tab Bar
2. 平板 (768-1024px): 显示底部 Tab Bar（更宽）
3. PC (>1024px): 显示左侧导航栏
4. 构建通过
