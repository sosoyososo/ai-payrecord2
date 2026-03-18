# UI P3 动效增强设计方案

**Spec**: docs/superpowers/specs/2026-03-17-ui-design-standard.md
**Created**: 2026-03-18
**Status**: Draft

## 概述

P3 动效增强 - 为账本 App 添加微交互动画，提升用户体验

---

## 1. 页面转场动画

### 实现方式
在 App.tsx 中为每个页面根元素添加 `page-enter` 类：

```tsx
<div className="page-enter">
  <HomePage />
</div>
```

### 效果
- 页面从下方滑入
- 透明度从 0 到 1
- 持续时间：300ms
- 缓动：ease-out

---

## 2. 列表项交错入场

### 实现方式
确保 HomePage 记录列表使用 `stagger-children` 类：

```tsx
<div className="space-y-3 stagger-children">
  {records.map((record) => (...))}
</div>
```

### 效果
- 每个列表项依次入场
- 间隔延迟：50ms
- 使用 slideIn 动画

---

## 3. 按钮交互反馈

### 实现方式
确保所有可点击元素使用 `btn-press` 类：

```tsx
<button className="btn-press">
  点击我
</button>
```

### 效果
- 按下时缩小至 96%
- 持续时间：100ms
- 缓动：ease

---

## 4. 卡片动画效果

### 实现方式
- 记录卡片使用 `scale-enter` 入场动画
- 金额使用 `amount-animate` 数字跳动效果

```tsx
// 卡片入场
<Card className="scale-enter">

// 金额动画
<div className="amount-animate">
  ¥{amount}
</div>
```

### 效果
- scaleEnter: 从 95% 缩放过渡到 100%
- amountAnimate: 透明度 + 上移效果

---

## 5. 加载状态优化

### 骨架屏动画
已有 shimmer 效果，确保在加载时显示：

```tsx
<Skeleton className="h-10 w-10 rounded-full" />
```

### Spinner 优化
调整旋转速度，当前已配置 animate-spin

---

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| frontend/src/App.tsx | 为每个页面添加 page-enter 类 |
| frontend/src/pages/HomePage.tsx | 确保 stagger-children 正确应用 |
| frontend/src/pages/AddRecordPage.tsx | 添加按钮 btn-press 效果 |

---

## 验收标准

1. 页面切换时有滑入动画效果
2. 记录列表加载时有交错入场效果
3. 按钮点击时有按下缩小反馈
4. 卡片有缩放入场效果
5. 金额数字有渐显效果
6. 所有动画流畅无卡顿
