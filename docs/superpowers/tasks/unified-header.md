# 统一顶部标题栏任务清单

**Spec**: docs/superpowers/specs/2026-03-18-unified-header.md
**Plan**: docs/superpowers/plans/2026-03-18-unified-header.md
**Created**: 2026-03-18
**Status**: ⏳ PENDING

## 概述

为每个页面添加统一顶部标题栏，修复FAB和保存按钮被遮挡问题

---

## Tasks

- [X] T001 修改 HomePage - 添加顶部标题栏，调整FAB位置 in frontend/src/pages/HomePage.tsx
- [X] T002 修改 AddRecordPage - 添加返回按钮标题栏，调整保存按钮位置 in frontend/src/pages/AddRecordPage.tsx
- [X] T003 修改 StatsPage - 添加返回按钮标题栏 in frontend/src/pages/StatsPage.tsx
- [X] T004 修改 BudgetPage - 添加返回按钮标题栏 in frontend/src/pages/BudgetPage.tsx
- [X] T005 修改 SettingsPage - 添加返回按钮标题栏 in frontend/src/pages/SettingsPage.tsx
- [X] T006 修改 LedgerPage - 添加返回按钮标题栏 in frontend/src/pages/LedgerPage.tsx
- [X] T007 修改 CategoryPage - 添加返回按钮标题栏 in frontend/src/pages/CategoryPage.tsx
- [X] T008 修改 TagPage - 添加返回按钮标题栏 in frontend/src/pages/TagPage.tsx
- [X] T009 修改 ExportPage - 添加返回按钮标题栏 in frontend/src/pages/ExportPage.tsx
- [X] T010 构建验证并提交

---

## Test Criteria

1. 每个页面顶部都有标题栏
2. 二级页面标题栏左侧有返回按钮
3. FAB 完整可见 (bottom-24)
4. 底部保存按钮完整可见 (bottom-24)
5. PC 端布局正常
6. 构建通过
