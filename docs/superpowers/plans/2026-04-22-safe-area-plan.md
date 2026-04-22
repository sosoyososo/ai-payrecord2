# Safe Area 支持实施方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 创建 SafeAreaView 组件并更新所有页面，实现 iOS/Android 安全区域完整支持

**架构:** 使用 CSS `env(safe-area-inset-*)` 变量，通过 React 组件封装，为页面提供可配置的安全区填充

**技术栈:** React 19 + TypeScript + Tailwind CSS + Capacitor 8.x

---

## 文件结构

```
frontend/src/
├── components/
│   └── SafeAreaView.tsx    # 新建：安全区容器组件
└── pages/
    ├── HomePage.tsx        # 修改：添加顶部安全区
    ├── AddRecordPage.tsx   # 修改：添加顶部安全区
    ├── StatsPage.tsx       # 修改：添加顶部安全区
    ├── BudgetPage.tsx      # 修改：添加顶部安全区
    ├── SettingsPage.tsx    # 修改：添加顶部安全区
    └── LoginPage.tsx       # 修改：添加顶部安全区
```

**AppLayout.tsx 已单独处理安全区，将在 Task 2 中更新**

---

## Task 1: 创建 SafeAreaView 组件

**文件:**
- 创建: `frontend/src/components/SafeAreaView.tsx`
- 测试: `frontend/src/components/__tests__/SafeAreaView.test.tsx`

- [ ] **Step 1: 创建 SafeAreaView.tsx 组件**

```tsx
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

interface SafeAreaViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
  className?: string
  children: React.ReactNode
}

const edgeToClass: Record<string, string> = {
  top: 'pt-[env(safe-area-inset-top)]',
  bottom: 'pb-[env(safe-area-inset-bottom)]',
  left: 'pl-[env(safe-area-inset-left)]',
  right: 'pr-[env(safe-area-inset-right)]',
}

export default function SafeAreaView({
  edges = ['top', 'bottom'],
  className,
  children,
}: SafeAreaViewProps) {
  const edgeClasses = edges.map((edge) => edgeToClass[edge]).join(' ')

  return <div className={cn(edgeClasses, className)}>{children}</div>
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/components/SafeAreaView.tsx
git commit -m "feat: add SafeAreaView component"
```

---

## Task 2: 更新 AppLayout 组件

**文件:**
- 修改: `frontend/src/components/AppLayout.tsx:82`

- [ ] **Step 1: 在 AppLayout 中导入并使用 SafeAreaView**

在文件顶部添加导入：
```tsx
import SafeAreaView from './SafeAreaView'
```

- [ ] **Step 2: 更新底部导航使用 SafeAreaView**

将第 82 行附近的底部 nav:
```tsx
<nav className="fixed bottom-0 left-0 right-0 ... safe-area-bottom">
```

改为：
```tsx
<SafeAreaView edges={['bottom']} className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-700">
```

并删除闭合的 `</nav>`，用 `</SafeAreaView>` 替代。

- [ ] **Step 3: 为移动端主容器添加顶部安全区**

在第 79 行附近的移动端容器:
```tsx
<div className="min-h-screen pb-16 ...">
```

改为：
```tsx
<SafeAreaView edges={['top']} className="min-h-screen pb-16 ...">
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/components/AppLayout.tsx
git commit -m "feat: update AppLayout with SafeAreaView"
```

---

## Task 3: 更新 HomePage

**文件:**
- 修改: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 导入 SafeAreaView**

```tsx
import SafeAreaView from '@/components/SafeAreaView'
```

- [ ] **Step 2: 用 SafeAreaView 包装页面主容器**

找到页面主容器（className 含 `min-h-screen` 的 div），用 SafeAreaView 包装，添加 `edges={['top']}`

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: add safe area to HomePage"
```

---

## Task 4: 更新 AddRecordPage

**文件:**
- 修改: `frontend/src/pages/AddRecordPage.tsx`

- [ ] **Step 1: 导入 SafeAreaView**
- [ ] **Step 2: 用 SafeAreaView 包装页面主容器**
- [ ] **Step 3: 提交**

---

## Task 5: 更新 StatsPage

**文件:**
- 修改: `frontend/src/pages/StatsPage.tsx`

- [ ] **Step 1: 导入 SafeAreaView**
- [ ] **Step 2: 用 SafeAreaView 包装页面主容器**
- [ ] **Step 3: 提交**

---

## Task 6: 更新 BudgetPage

**文件:**
- 修改: `frontend/src/pages/BudgetPage.tsx`

- [ ] **Step 1: 导入 SafeAreaView**
- [ ] **Step 2: 用 SafeAreaView 包装页面主容器**
- [ ] **Step 3: 提交**

---

## Task 7: 更新 SettingsPage

**文件:**
- 修改: `frontend/src/pages/SettingsPage.tsx`

- [ ] **Step 1: 导入 SafeAreaView**
- [ ] **Step 2: 用 SafeAreaView 包装页面主容器**
- [ ] **Step 3: 提交**

---

## Task 8: 更新 LoginPage

**文件:**
- 修改: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: 导入 SafeAreaView**
- [ ] **Step 2: 用 SafeAreaView 包装页面主容器（edges={['top']}）**
- [ ] **Step 3: 提交**

---

## Task 9: 清理 index.css 中的旧 safe-area 类

**文件:**
- 修改: `frontend/src/index.css`

- [ ] **Step 1: 移除 .safe-area-* 类**

删除第 164-178 行的旧安全区 CSS 类（.safe-area-top, .safe-area-bottom 等），因为这些已被 SafeAreaView 组件替代。

- [ ] **Step 2: 提交**

```bash
git add frontend/src/index.css
git commit -m "refactor: remove deprecated safe-area CSS classes"
```

---

## Task 10: iOS/Android 真机测试

- [ ] **Step 1: iOS 模拟器测试**
  - 启动 iOS 模拟器
  - 运行 `npx cap open ios`
  - 使用 Xcode 构建并运行
  - 验证异形屏区域正确处理

- [ ] **Step 2: Android 模拟器测试**
  - 启动 Android 模拟器
  - 运行 `npx cap open android`
  - 使用 Android Studio 构建并运行
  - 验证挖孔屏/刘海屏区域正确处理

---

## 自检清单

- [ ] 所有页面都使用 SafeAreaView 包装主容器
- [ ] index.css 中旧 .safe-area-* 类已移除
- [ ] AppLayout 底部导航正确使用 SafeAreaView
- [ ] iOS 和 Android 测试通过
