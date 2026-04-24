# 路由重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 Layout Route 重构路由，修复 TabBar 导航 bug，统一导航模式

**Architecture:** 采用 react-router-dom v7 的 Layout Route 模式，将 ProtectedRoute 逻辑移入 AppLayout，移除每个路由重复的 wrapper

**Tech Stack:** react-router-dom v7, React, TypeScript

---

## 文件结构

```
frontend/src/
├── App.tsx                      # 重构：使用 Layout Route
├── components/
│   ├── AppLayout.tsx            # 重构：包含 ProtectedRoute + 移除 console.log
│   └── AppHeader.tsx            # 可能需要调整
├── config/
│   └── navigation.ts            # 新建：集中管理 navItems
├── contexts/
│   └── HeaderContext.tsx        # 可能需要调整
├── index.css                    # 确保 .page-enter 动画存在
└── pages/                       # 无需修改
```

---

## 任务列表

### Task 1: 创建导航配置文件

**Files:**
- Create: `frontend/src/config/navigation.ts`

```typescript
import { Home, BarChart3, PiggyBank, Settings } from 'lucide-react'

export interface NavItem {
  path: string
  labelKey: string
  icon: typeof Home
}

export const navItems: NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/stats', labelKey: 'nav.stats', icon: BarChart3 },
  { path: '/budget', labelKey: 'nav.budget', icon: PiggyBank },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
]
```

---

### Task 2: 重构 App.tsx 使用 Layout Route

**Files:**
- Modify: `frontend/src/App.tsx`

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
  <Route index element={<HomePage />} />
  <Route path="stats" element={<StatsPage />} />
  {/* ... 其他受保护路由 */}
</Route>
```

关键改动：
1. 所有受保护路由包裹在 `<Route element={<AppLayout />}>` 中
2. 不再每个路由单独包 ProtectedRoute 和 AnimatedPage
3. `ProtectedRoute` 逻辑移入 AppLayout 内部
4. 保留 Loading 组件和 UnknownRoute
5. Public routes 保持不变

**完整代码：**
```tsx
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AppLayout from '@/components/AppLayout'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const AddRecordPage = lazy(() => import('@/pages/AddRecordPage'))
const EditRecordPage = lazy(() => import('@/pages/EditRecordPage'))
const StatsPage = lazy(() => import('@/pages/StatsPage'))
const LedgerPage = lazy(() => import('@/pages/LedgerPage'))
const CategoryPage = lazy(() => import('@/pages/CategoryPage'))
const TagPage = lazy(() => import('@/pages/TagPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const ExportPage = lazy(() => import('@/pages/ExportPage'))
const BudgetPage = lazy(() => import('@/pages/BudgetPage'))
const EmailVerificationPage = lazy(() => import('@/pages/EmailVerificationPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

function UnknownRoute() {
  const { user } = useAuth()
  return <Navigate to={user ? '/' : '/login'} replace />
}

function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public routes - no layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes - wrapped in AppLayout */}
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="add" element={<AddRecordPage />} />
            <Route path="edit/:id" element={<EditRecordPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="ledgers" element={<LedgerPage />} />
            <Route path="categories" element={<CategoryPage />} />
            <Route path="tags" element={<TagPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="budget" element={<BudgetPage />} />
          </Route>

          <Route path="*" element={<UnknownRoute />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}

export default App
```

---

### Task 3: 重构 AppLayout 整合 ProtectedRoute

**Files:**
- Modify: `frontend/src/components/AppLayout.tsx`

关键改动：
1. 导入 navItems 从 `@/config/navigation`
2. 移除外层 user 检查（ProtectedRoute 逻辑整合进来）
3. 移除所有 console.log 调试代码
4. 确保 Outlet 正确响应路由变化

**完整代码：**
```tsx
import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { navItems } from '@/config/navigation'
import AppHeader from './AppHeader'
import { HeaderProvider } from '@/contexts/HeaderContext'
import { Navigate } from 'react-router-dom'

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [isDesktop, setIsDesktop] = useState(false)

  // Loading state
  if (loading) {
    return <Loading />
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check screen size
  useEffect(() => {
    const checkScreen = () => {
      setIsDesktop(window.innerWidth > 1024)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  // Desktop layout
  if (isDesktop) {
    return (
      <div className="flex min-h-screen dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100">
        {/* Left sidebar */}
        <nav className="fixed left-0 top-0 h-full w-56 bg-white dark:bg-slate-900 border-r dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">{t('nav.appName')}</span>
            </div>
          </div>
          <div className="flex-1 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{t(item.labelKey)}</span>
                </button>
              )
            })}
          </div>
        </nav>
        {/* Main content */}
        <div className="flex-1 ml-56">
          <div className="max-w-3xl mx-auto p-6">
            <Outlet />
          </div>
        </div>
      </div>
    )
  }

  // Mobile/tablet layout
  return (
    <HeaderProvider>
      <div className="h-screen dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 flex flex-col">
        <div className="pt-[env(safe-area-inset-top)] bg-white dark:bg-slate-900 shadow-sm">
          <AppHeader />
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
        <div className="pb-[env(safe-area-inset-bottom)] bg-white dark:bg-slate-900 border-t dark:border-slate-700">
          <div className="flex justify-around items-center h-14">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{t(item.labelKey)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </HeaderProvider>
  )
}
```

---

### Task 4: 验证 index.css 中 page-enter 动画

**Files:**
- Modify: `frontend/src/index.css`

确保存在以下 CSS（如果没有则添加）：
```css
.page-enter {
  animation: fadeSlideIn 0.2s ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

如果已存在且正确，无需修改。

---

### Task 5: 验证并测试导航

测试步骤：
1. 启动开发服务器 `cd frontend && npm run dev`
2. 在移动视口下（模拟手机）访问应用
3. 点击 TabBar 的各个 tab，验证页面是否正确切换
4. 检查 URL 是否正确变化
5. 验证 `/add` 和 `/edit/:id` 页面是否正常（应该没有 TabBar）

预期结果：
- TabBar 点击 → URL 变化 → 页面内容切换
- 导航不再卡在首页

---

## 风险与注意事项

1. **console.log 移除**: 确保 AppLayout 中没有遗留的 console.log
2. **Loading 状态**: AppLayout 内部需要处理 loading 状态，避免闪烁
3. **Capacitor 环境**: URL 格式为 `capacitor://localhost/xxx`，但 router 应该能正确处理

## 验证标准

- [ ] TabBar 点击可以正常切换页面
- [ ] URL 变化后页面内容正确
- [ ] 代码中没有 console.log 调试语句
- [ ] 路由配置简洁，样板代码减少