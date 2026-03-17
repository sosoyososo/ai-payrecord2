# UI P2 视觉优化实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为账本 App 添加骨架屏加载状态和下拉刷新功能，提升用户体验

**Architecture:** 使用 React + Tailwind CSS 实现，Skeleton 组件使用 shadcn/ui 模式，Pull-to-Refresh 使用 react-pull-to-refresh 库

**Tech Stack:** React, Tailwind CSS, react-pull-to-refresh

---

## 文件结构

- `frontend/src/components/ui/skeleton.tsx` - 新建 Skeleton 组件
- `frontend/src/pages/HomePage.tsx` - 添加骨架屏和下拉刷新
- `frontend/src/pages/StatsPage.tsx` - 添加骨架屏
- `frontend/src/pages/BudgetPage.tsx` - 添加骨架屏
- `frontend/src/pages/ExportPage.tsx` - 添加骨架屏
- `frontend/src/index.css` - 添加 pull-to-refresh 样式

---

## Chunk 1: Skeleton 组件创建

### Task 1: 创建 Skeleton 组件

**Files:**
- Create: `frontend/src/components/ui/skeleton.tsx`

- [ ] **Step 1: 创建 Skeleton 组件**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

- [ ] **Step 2: 验证组件创建成功**

Run: `ls frontend/src/components/ui/skeleton.tsx`
Expected: 文件存在

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/ui/skeleton.tsx
git commit -m "feat: 添加 Skeleton 组件"
```

---

## Chunk 2: HomePage 骨架屏

### Task 2: HomePage 添加骨架屏

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 导入 Skeleton 组件**

在 import 部分添加：
```tsx
import { Skeleton } from '@/components/ui/skeleton'
```

- [ ] **Step 2: 添加 loading state**

在 useState 声明部分添加：
```tsx
const [loading, setLoading] = useState(true)
```

- [ ] **Step 3: 设置 loading 状态**

在 loadData 函数中，成功和失败时都添加：
```tsx
setLoading(false)
```

- [ ] **Step 4: 添加 Summary Card 骨架屏**

在 Summary Card 区域使用条件渲染：
```tsx
{loading ? (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-4 w-24 mb-1" />
      <Skeleton className="h-8 w-32 mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardContent>
  </Card>
) : (
  // 现有代码
)}
```

- [ ] **Step 5: 添加 Records List 骨架屏**

在 Records List 区域添加：
```tsx
{loading ? (
  <>
    <Card><CardContent className="p-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-24" /></CardContent></Card>
    <Card><CardContent className="p-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-24" /></CardContent></Card>
    <Card><CardContent className="p-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-24" /></CardContent></Card>
  </>
) : (
  // 现有代码
)}
```

- [ ] **Step 6: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 7: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: HomePage 添加骨架屏加载状态"
```

---

## Chunk 3: Pull-to-Refresh

### Task 3: 添加下拉刷新功能

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/package.json`

- [ ] **Step 1: 安装 react-pull-to-refresh**

Run: `cd frontend && npm install react-pull-to-refresh`
Expected: 安装成功

- [ ] **Step 2: 导入 PullToRefresh**

```tsx
import PullToRefresh from 'react-pull-to-refresh'
```

- [ ] **Step 3: 修改 HomePage 结构**

将主要内容包裹在 PullToRefresh 中：
```tsx
<PullToRefresh
  onRefresh={loadData}
  className="max-w-md mx-auto"
  pullDownThreshold={80}
  pullingContent={<div className="text-center py-2">Pull to refresh</div>}
>
  {/* 现有内容 */}
</PullToRefresh>
```

- [ ] **Step 4: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add frontend/src/pages/HomePage.tsx frontend/package.json
git commit -m "feat: HomePage 添加下拉刷新功能"
```

---

## 执行顺序

1. Task 1 → Task 2 → Task 3（顺序执行）
2. 每个 Task 内的步骤按顺序执行
3. 每个 Task 完成后进行提交
