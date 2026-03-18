# 导航修复任务清单

**Spec**: docs/superpowers/specs/2026-03-18-navigation-fix.md
**Plan**: docs/superpowers/plans/2026-03-18-navigation-fix.md
**Created**: 2026-03-18
**Status**: ⏳ PENDING

## 概述

修复首页 FAB 被底部导航遮挡问题，并为二级页面添加返回导航

---

## Tasks

- [X] T001 [P] 修复首页 FAB 位置 (bottom-6 -> bottom-20) in frontend/src/pages/HomePage.tsx
- [X] T002 [P] 为 AddRecordPage 添加返回导航 in frontend/src/pages/AddRecordPage.tsx
- [X] T003 [P] 为 StatsPage 添加返回导航 in frontend/src/pages/StatsPage.tsx
- [X] T004 [P] 为 BudgetPage 添加返回导航 in frontend/src/pages/BudgetPage.tsx
- [X] T005 [P] 为 SettingsPage 添加返回导航 in frontend/src/pages/SettingsPage.tsx
- [X] T006 [P] 为 LedgerPage 添加返回导航 in frontend/src/pages/LedgerPage.tsx
- [X] T007 [P] 为 CategoryPage 添加返回导航 in frontend/src/pages/CategoryPage.tsx
- [X] T008 [P] 为 TagPage 添加返回导航 in frontend/src/pages/TagPage.tsx
- [X] T009 [P] 为 ExportPage 添加返回导航 in frontend/src/pages/ExportPage.tsx
- [X] T010 构建验证并提交

---

## Test Criteria

1. 首页 FAB 可见且不被底部导航遮挡
2. 所有二级页面顶部有返回按钮
3. 点击返回按钮可正常返回上一页
4. PC 端布局不受影响
5. 构建通过
