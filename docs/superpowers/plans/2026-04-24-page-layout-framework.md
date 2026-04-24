# 页面布局框架实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立统一的页面布局框架，解决 iOS/Android 原生壳中双重滚动、Header 异常、TabBar 被遮挡的问题

**Architecture:**
- 新增 `PageContainer` 组件作为所有受保护页面的统一容器
- 新增 `SwipeBack` 组件处理右滑返回手势
- 改造 `AppLayout` 成为唯一的滚动容器
- 页面迁移到 PageContainer，移除冗余的 SafeAreaView 和自定义 Header

**Tech Stack:** React, TypeScript, Tailwind CSS, react-router-dom, @capacitor/haptics (可选)

---

## 文件结构

```
frontend/src/
├── components/
│   ├── PageContainer.tsx    # 新增：统一页面容器
│   ├── SwipeBack.tsx        # 新增：右滑返回手势
│   └── AppLayout.tsx        # 修改：改造为唯一滚动容器
└── pages/
    ├── HomePage.tsx         # 修改：迁移到 PageContainer
    ├── AddRecordPage.tsx    # 修改：迁移到 PageContainer
    ├── EditRecordPage.tsx    # 修改：迁移到 PageContainer
    ├── StatsPage.tsx         # 修改：迁移到 PageContainer
    ├── LedgerPage.tsx        # 修改：迁移到 PageContainer
    ├── CategoryPage.tsx      # 修改：迁移到 PageContainer
    ├── TagPage.tsx           # 修改：迁移到 PageContainer
    ├── SettingsPage.tsx      # 修改：迁移到 PageContainer
    ├── ExportPage.tsx        # 修改：迁移到 PageContainer
    └── BudgetPage.tsx        # 修改：迁移到 PageContainer
```

---

## Task 1: 创建 SwipeBack 组件

**Files:**
- Create: `frontend/src/components/SwipeBack.tsx`

- [ ] **Step 1: 创建 SwipeBack 组件**

```tsx
// frontend/src/components/SwipeBack.tsx
import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface SwipeBackProps {
  enabled?: boolean
  children: React.ReactNode
}

export default function SwipeBack({ enabled = true, children }: SwipeBackProps) {
  const navigate = useNavigate()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // 只在左侧边缘触发
    if (e.touches[0].clientX > 50) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return
    if (e.touches[0].clientX > 50) return

    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = e.touches[0].clientY - touchStartY.current

    // 必须是左滑（deltaX > 0）
    if (deltaX < 0) return

    // 判断是否是左滑而非上下滑（水平距离 > 垂直距离）
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      // 可以添加视觉反馈，这里暂时不做
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return

    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current

    // 左滑超过 50px 且水平距离大于垂直距离
    if (deltaX > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      navigate(-1)
    }

    touchStartX.current = null
    touchStartY.current = null
  }, [navigate])

  useEffect(() => {
    if (!enabled) return

    const content = contentRef.current
    if (!content) return

    content.addEventListener('touchstart', handleTouchStart, { passive: true })
    content.addEventListener('touchmove', handleTouchMove, { passive: true })
    content.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      content.removeEventListener('touchstart', handleTouchStart)
      content.removeEventListener('touchmove', handleTouchMove)
      content.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={contentRef} className="flex-1 flex flex-col">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/components/SwipeBack.tsx
git commit -m "feat: add SwipeBack component for iOS swipe-back gesture"
```

---

## Task 2: 创建 PageContainer 组件

**Files:**
- Create: `frontend/src/components/PageContainer.tsx`

- [ ] **Step 1: 创建 PageContainer 组件**

```tsx
// frontend/src/components/PageContainer.tsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useHeader } from '@/contexts/HeaderContext'
import SwipeBack from './SwipeBack'
import { Plus } from 'lucide-react'

interface PageContainerProps {
  title?: string
  showBackButton?: boolean
  enableSwipeBack?: boolean
  fab?: { to: string }
  children: React.ReactNode
}

export default function PageContainer({
  title,
  showBackButton = false,
  enableSwipeBack = true,
  fab,
  children,
}: PageContainerProps) {
  const { setConfig } = useHeader()

  useEffect(() => {
    setConfig({
      title,
      showBackButton,
    })
    return () => setConfig({})
  }, [title, showBackButton, setConfig])

  // 底部 padding：TabBar 高度 3.5rem + 安全区
  const bottomPadding = 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]'

  // FAB 位置
  const fabBottom = 'bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)]'

  return (
    <SwipeBack enabled={enableSwipeBack}>
      <div className={`flex-1 ${bottomPadding}`}>
        {children}
      </div>
      {fab && (
        <Link
          to={fab.to}
          className={`fixed right-6 ${fabBottom} w-14 h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center btn-press fab-pulse`}
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </SwipeBack>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/components/PageContainer.tsx
git commit -m "feat: add PageContainer component as unified page wrapper"
```

---

## Task 3: 改造 AppLayout

**Files:**
- Modify: `frontend/src/components/AppLayout.tsx`

- [ ] **Step 1: 读取当前 AppLayout 并改造移动端布局**

修改移动端 `<Outlet>` 包装，使其成为唯一滚动容器：

```tsx
// 修改 AppLayout.tsx 中移动端部分

// 手机/平板: 底部导航 + 内容区
return (
  <HeaderProvider>
    <div className="h-screen dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 flex flex-col">
      <SafeAreaView edges={['top']} className="contents">
        <AppHeader />
      </SafeAreaView>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>
      <TabBar />
    </div>
  </HeaderProvider>
)
```

**关键变更：**
- `<Outlet>` 外层从 `flex-1 overflow-y-auto overflow-x-hidden` 包裹（之前可能没有 overflow-x-hidden）
- 移除外层多余的 SafeAreaView 和 AppHeader 重复包装

- [ ] **Step 2: 提交**

```bash
git add frontend/src/components/AppLayout.tsx
git commit -m "refactor: AppLayout mobile mode as single scroll container"
```

---

## Task 4: 迁移 HomePage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 读取 HomePage 并简化**

移除：
- `SafeAreaView` 包装（外层已处理）
- `min-h-screen`（改用 flex-1）
- 自定义 header（改用 PageContainer）
- 静态的 `pb-24`（改用动态计算）

新增：
- `PageContainer` 包装
- `fab` prop

```tsx
// 新的 HomePage 结构
import PageContainer from '@/components/PageContainer'
import { useHeader } from '@/contexts/HeaderContext'
// ... 其他 imports

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setConfig } = useHeader()
  // ... state declarations

  useEffect(() => {
    setConfig({ title: currentLedger?.name || t('nav.ledgers'), showBackButton: false })
    return () => setConfig({})
  }, [currentLedger, t, setConfig])

  // ... 其他逻辑保持不变

  return (
    <PageContainer fab={{ to: '/add' }}>
      {/* Ledger Selector */}
      <div className="max-w-md mx-auto px-4 py-3">
        <LedgerSelector ... />
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="relative">...</div>
      </div>

      {/* Summary Card */}
      <div className="max-w-md mx-auto px-4 py-4">
        <Card>...</Card>
      </div>

      {/* Records List */}
      <div className="max-w-md mx-auto px-4 pb-4">
        {/* ... records */}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog ... />
    </PageContainer>
  )
}
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

预期：无错误

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "refactor: migrate HomePage to PageContainer"
```

---

## Task 5: 迁移 AddRecordPage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx`

- [ ] **Step 1: 读取并简化 AddRecordPage**

移除：
- `SafeAreaView`
- `min-h-screen`
- 自定义 header（返回按钮 + 标题）

新增：
- `PageContainer` 包装，传入 `title` 和 `showBackButton`

```tsx
import PageContainer from '@/components/PageContainer'
// ...

return (
  <PageContainer title={t('addRecord.title')} showBackButton>
    {/* AI Input Section */}
    <div className="max-w-md mx-auto px-4 py-4">
      <div className="relative">...</div>
    </div>

    {/* Form */}
    <div className="max-w-md mx-auto px-4">
      <RecordForm ... />
    </div>
  </PageContainer>
)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/AddRecordPage.tsx
git commit -m "refactor: migrate AddRecordPage to PageContainer"
```

---

## Task 6: 迁移 EditRecordPage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/EditRecordPage.tsx`

- [ ] **Step 1: 读取并简化 EditRecordPage**

```tsx
import PageContainer from '@/components/PageContainer'

return (
  <PageContainer title={t('editRecord.title')} showBackButton>
    <div className="max-w-md mx-auto px-4">
      <RecordForm ... />
    </div>
  </PageContainer>
)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/EditRecordPage.tsx
git commit -m "refactor: migrate EditRecordPage to PageContainer"
```

---

## Task 7: 迁移 StatsPage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/StatsPage.tsx`

- [ ] **Step 1: 读取并简化 StatsPage**

移除 SafeAreaView、min-h-screen、自定义 header，用 PageContainer 替代。

```tsx
import PageContainer from '@/components/PageContainer'

return (
  <PageContainer title={t('stats.title')} showBackButton>
    {/* Year Selector */}
    <div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2">
      {/* ... */}
    </div>

    {/* LedgerSelector */}
    <div className="max-w-md mx-auto px-4 py-3">
      {/* ... */}
    </div>

    {/* Tabs */}
    <div className="max-w-md mx-auto px-4 py-2 flex gap-2">
      {/* ... */}
    </div>

    {/* Content */}
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* ... */}
    </div>
  </PageContainer>
)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/StatsPage.tsx
git commit -m "refactor: migrate StatsPage to PageContainer"
```

---

## Task 8: 迁移 LedgerPage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/LedgerPage.tsx`

- [ ] **Step 1: 读取并简化 LedgerPage**

```tsx
import PageContainer from '@/components/PageContainer'

return (
  <PageContainer title={t('ledger.title')} showBackButton>
    <div className="max-w-md mx-auto px-4 py-4 space-y-3">
      {/* ledgers list */}
    </div>
    <DeleteConfirmDialog ... />
  </PageContainer>
)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/LedgerPage.tsx
git commit -m "refactor: migrate LedgerPage to PageContainer"
```

---

## Task 9: 迁移 CategoryPage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/CategoryPage.tsx`

- [ ] **Step 1: 读取并简化 CategoryPage**

```tsx
import PageContainer from '@/components/PageContainer'

return (
  <PageContainer title={t('category.title')} showBackButton>
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* income categories */}
      {/* expense categories */}
    </div>
  </PageContainer>
)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/CategoryPage.tsx
git commit -m "refactor: migrate CategoryPage to PageContainer"
```

---

## Task 10: 迁移 TagPage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/TagPage.tsx`

- [ ] **Step 1: 读取并简化 TagPage**

```tsx
import PageContainer from '@/components/PageContainer'

return (
  <PageContainer title={t('tag.title')} showBackButton>
    <div className="max-w-md mx-auto px-4 py-4 space-y-3">
      {/* tags list and add form */}
    </div>
    <DeleteConfirmDialog ... />
  </PageContainer>
)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/TagPage.tsx
git commit -m "refactor: migrate TagPage to PageContainer"
```

---

## Task 11: 迁移 SettingsPage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/SettingsPage.tsx`

- [ ] **Step 1: 读取并简化 SettingsPage**

移除 SafeAreaView、min-h-screen、自定义 header。

```tsx
import PageContainer from '@/components/PageContainer'

return (
  <PageContainer title={t('settings.title')} showBackButton>
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Theme Section */}
      {/* Language Section */}
      {/* Profile Section */}
      {/* Password Section */}
      {/* Export Section */}
      {/* App Info */}
    </div>
  </PageContainer>
)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/SettingsPage.tsx
git commit -m "refactor: migrate SettingsPage to PageContainer"
```

---

## Task 12: 迁移 ExportPage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/ExportPage.tsx`

- [ ] **Step 1: 读取并简化 ExportPage**

```tsx
import PageContainer from '@/components/PageContainer'

return (
  <PageContainer title={t('export.title')} showBackButton>
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* export options */}
    </div>
  </PageContainer>
)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/ExportPage.tsx
git commit -m "refactor: migrate ExportPage to PageContainer"
```

---

## Task 13: 迁移 BudgetPage 到 PageContainer

**Files:**
- Modify: `frontend/src/pages/BudgetPage.tsx`

- [ ] **Step 1: 读取并简化 BudgetPage**

```tsx
import PageContainer from '@/components/PageContainer'

return (
  <PageContainer title={t('budget.title')} showBackButton>
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* budget cards */}
    </div>
  </PageContainer>
)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/BudgetPage.tsx
git commit -m "refactor: migrate BudgetPage to PageContainer"
```

---

## Task 14: 验证和测试

**Files:**
- 测试用例文档: `docs/superpowers/test-cases/ui-test-cases.md`

- [ ] **Step 1: 更新测试用例文档**

添加新的测试用例：
- TC-UI-LAYOUT-001: iOS 模拟器滚动正常
- TC-UI-LAYOUT-002: Android 真机滚动正常
- TC-UI-LAYOUT-003: 右滑返回手势在各页面工作
- TC-UI-LAYOUT-004: Header 正确显示（标题 + 返回按钮）
- TC-UI-LAYOUT-005: FAB 位置正确（不与 TabBar 重叠）
- TC-UI-LAYOUT-006: 安全区留白正确（刘海屏、圆角屏）

- [ ] **Step 2: iOS 模拟器测试**

使用 Playwright 或手动测试：
1. 打开 iOS Simulator
2. 运行 App
3. 验证滚动正常
4. 验证 Header 正确
5. 验证 TabBar 可见
6. 测试右滑返回

- [ ] **Step 3: 提交测试结果**

```bash
git add docs/superpowers/test-cases/ui-test-cases.md
git commit -m "docs: add layout framework test cases"
```

---

## 自检清单

完成所有任务后，检查：

1. **Spec coverage**: 每个设计要求都有对应任务实现
2. **Placeholder scan**: 无 "TBD"、"TODO"、"实现 later" 等占位符
3. **Type consistency**: `PageContainerProps` 的接口在所有使用处一致
4. **构建验证**: `npm run build` 无错误
5. **iOS 测试**: 滚动、手势、Header、TabBar 均正常

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-04-24-page-layout-framework.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
