# 深色模式任务清单

**Spec**: docs/superpowers/specs/2026-03-18-dark-mode.md
**Plan**: docs/superpowers/plans/2026-03-18-dark-mode.md
**Created**: 2026-03-18
**Status**: ✅ COMPLETED

## 概述

为账本 App 添加深色模式支持

---

## Tasks

- [X] T001 创建 ThemeContext in frontend/src/contexts/ThemeContext.tsx (已存在)
- [X] T002 修改 App.tsx 添加 ThemeProvider in frontend/src/App.tsx
- [X] T003 添加主题切换 UI 到设置页面 in frontend/src/pages/SettingsPage.tsx (已存在)
- [X] T004 修复 StatsPage 深色模式颜色 in frontend/src/pages/StatsPage.tsx
- [X] T005 修复其他页面深色模式颜色
- [X] T006 构建验证

---

## Test Criteria

1. 设置页面可切换浅色/深色/自动模式
2. 刷新页面保持用户选择的主题
3. 深色模式下所有颜色正确显示
