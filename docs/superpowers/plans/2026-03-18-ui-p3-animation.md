# UI P3 动效增强实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为账本 App 添加微交互动画，提升用户体验

**Architecture:** 使用纯 CSS 动画，复用 index.css 中已定义的动画类

**Tech Stack:** React, Tailwind CSS, CSS Animations

---

## 文件结构

- `frontend/src/App.tsx` - 添加页面转场动画
- `frontend/src/pages/HomePage.tsx` - 确保列表动画正确应用
- `frontend/src/pages/AddRecordPage.tsx` - 添加按钮交互效果

---

## Chunk 1: 页面转场动画

### Task 1: App.tsx 添加页面转场

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 创建页面包装组件**

在 App.tsx 中添加页面包装组件：

```tsx
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}
```

- [ ] **Step 2: 为每个页面应用动画**

修改 Routes 中的页面包装：

```tsx
<Route
  path="/"
  element={
    <ProtectedRoute>
      <AnimatedPage>
        <HomePage />
      </AnimatedPage>
    </ProtectedRoute>
  }
/>
```

对所有页面路由 (/add, /stats, /ledgers, /categories, /tags, /settings, /export, /budget) 重复此步骤。

- [ ] **Step 3: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add frontend/src/App.tsx
git commit -m "feat: 添加页面转场动画"
```

---

## Chunk 2: 列表项交错入场

### Task 2: HomePage 列表动画优化

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 检查 stagger-children 应用**

查看当前记录列表的 className 是否包含 stagger-children：

```tsx
<div className="space-y-3 stagger-children">
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: HomePage 列表交错入场动画"
```

---

## Chunk 3: 按钮交互反馈

### Task 3: AddRecordPage 按钮动画

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx`

- [ ] **Step 1: 检查按钮 className**

查看保存按钮是否包含 btn-press：

```tsx
<Button className="btn-press w-full">
  {t('common.save')}
</Button>
```

- [ ] **Step 2: 添加 btn-press 到保存按钮**

找到保存按钮，添加 btn-press 类：

```tsx
<Button className="w-full btn-press">
  {t('addRecord.saveRecord')}
</Button>
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/AddRecordPage.tsx
git commit -m "feat: AddRecordPage 添加按钮点击效果"
```

---

## Chunk 4: 卡片入场动画

### Task 4: HomePage 卡片动画

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 为记录卡片添加 scale-enter**

找到记录 Card 组件，添加 scale-enter 类：

```tsx
<Card key={record.id} className="card-hover cursor-pointer scale-enter">
```

- [ ] **Step 2: 为金额添加 amount-animate**

找到金额显示部分，添加 amount-animate 类：

```tsx
<div className={`font-semibold amount-animate ${record.type === 2 ? 'text-green-600' : 'text-red-600'}`}>
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: HomePage 卡片入场动画"
```

---

## Chunk 5: 骨架屏优化

### Task 5: Skeleton 组件优化

**Files:**
- Modify: `frontend/src/components/ui/skeleton.tsx`

- [ ] **Step 1: 检查当前 Skeleton 实现**

```tsx
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
```

- [ ] **Step 2: 添加 shimmer 效果**

修改 Skeleton 组件添加 shimmer 效果：

```tsx
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted skeleton", className)}
      {...props}
    />
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/ui/skeleton.tsx
git commit -m "feat: Skeleton 组件添加 shimmer 效果"
```

---

## 执行顺序

1. Task 1 → Task 2 → Task 3 → Task 4 → Task 5（顺序执行）
2. 每个 Task 内的步骤按顺序执行
3. 每个 Task 完成后进行提交

---

## 验收标准

1. 页面切换时有滑入动画效果
2. 记录列表加载时有交错入场效果
3. 按钮点击时有按下缩小反馈
4. 卡片有缩放入场效果
5. 金额数字有渐显效果
6. 骨架屏有 shimmer 效果
7. 所有动画流畅无卡顿
