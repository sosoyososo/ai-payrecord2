# 导航优化 - FAB 位置与返回导航

**Created**: 2026-03-18
**Status**: Draft

## 概述

修复首页 FAB 被底部导航遮挡的问题，并为二级页面添加返回导航。

## 问题分析

1. **FAB 被遮挡** - 首页 FAB 使用 `bottom-6`，被底部导航栏（高度 3.5rem）挡住
2. **缺少返回导航** - 移除 header 后，添加记录页等二级页面无法返回首页

## 解决方案

### 1. FAB 位置调整

将首页 FAB 从 `bottom-6` 改为 `bottom-20`，确保不被底部导航遮挡。

```tsx
// 之前
className="fixed bottom-6 right-6 ..."

// 之后
className="fixed bottom-20 right-6 ..."
```

### 2. 二级页面返回导航

在以下页面顶部添加返回按钮：
- AddRecordPage
- StatsPage
- BudgetPage
- SettingsPage
- LedgerPage
- CategoryPage
- TagPage
- ExportPage

使用 react-router-dom 的 `useNavigate` 返回上一页：

```tsx
const navigate = useNavigate()

<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
  <ArrowLeft className="h-5 w-5" />
</Button>
```

## 验收标准

1. 首页 FAB 可见且不被底部导航遮挡
2. 所有二级页面顶部有返回按钮
3. 点击返回按钮可正常返回上一页
4. PC 端布局不受影响

## 受影响文件

- frontend/src/pages/HomePage.tsx
- frontend/src/pages/AddRecordPage.tsx
- frontend/src/pages/StatsPage.tsx
- frontend/src/pages/BudgetPage.tsx
- frontend/src/pages/SettingsPage.tsx
- frontend/src/pages/LedgerPage.tsx
- frontend/src/pages/CategoryPage.tsx
- frontend/src/pages/TagPage.tsx
- frontend/src/pages/ExportPage.tsx
