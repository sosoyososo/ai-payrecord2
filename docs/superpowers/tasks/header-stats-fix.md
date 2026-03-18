# 首页布局优化与统计页年份选择器修复 - 任务清单

**Spec**: docs/superpowers/specs/2026-03-18-header-stats-fix.md
**Plan**: docs/superpowers/plans/2026-03-18-header-stats-fix.md
**Created**: 2026-03-18
**Status**: ⏳ PENDING

## 概述

修复以下 UI 问题：
1. 首页顶部右侧按钮与底部 tab 冲突 - 移除按钮
2. 统计页面年份选择器深色主题样式不佳 - 改用 shadcn/ui Select 组件

---

## Tasks

- [X] T001 [P] 修改 HomePage - 移除顶部右侧统计和设置按钮 in frontend/src/pages/HomePage.tsx
- [X] T002 [P] 修改 StatsPage - 替换原生 select 为 shadcn Select 组件 in frontend/src/pages/StatsPage.tsx
- [X] T003 构建验证并提交

---

## Test Criteria

1. 首页顶部标题栏简洁，只有账本名称
2. 底部导航栏可正常访问统计和设置
3. 统计页面年份选择在深色/浅色模式下样式正常
4. 构建通过
