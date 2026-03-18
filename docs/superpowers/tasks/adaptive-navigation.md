# 自适应导航任务清单

**Spec**: docs/superpowers/specs/2026-03-18-adaptive-navigation.md
**Plan**: docs/superpowers/plans/2026-03-18-adaptive-navigation.md
**Created**: 2026-03-18
**Status**: ⏳ PENDING

## 概述

实现自适应导航，根据屏幕尺寸显示不同导航模式

---

## Tasks

- [X] T001 创建 AppLayout 组件 in frontend/src/components/AppLayout.tsx
- [X] T002 修改 App.tsx 使用 AppLayout in frontend/src/App.tsx
- [X] T003 移除 HomePage header in frontend/src/pages/HomePage.tsx
- [X] T004 移除 StatsPage header in frontend/src/pages/StatsPage.tsx
- [X] T005 移除 BudgetPage header in frontend/src/pages/BudgetPage.tsx
- [X] T006 移除 SettingsPage header in frontend/src/pages/SettingsPage.tsx
- [X] T007 移除其他页面 header (AddRecordPage, LedgerPage, CategoryPage, TagPage, ExportPage)
- [X] T008 构建验证

---

## Test Criteria

1. 手机 (<768px): 显示底部 Tab Bar
2. 平板 (768-1024px): 显示底部 Tab Bar
3. PC (>1024px): 显示左侧导航栏
4. 构建通过
