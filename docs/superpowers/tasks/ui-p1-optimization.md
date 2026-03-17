# UI 优化任务清单

**Spec**: docs/superpowers/specs/2026-03-17-ui-design-standard.md
**Created**: 2026-03-17
**Status**: ✅ COMPLETED

## 概述

优化 P1 体验问题 - 移动端手势交互优化

---

## Tasks

- [X] T001 [P1] 优化导航菜单 - 将 hover 触发改为点击触发 (HomePage.tsx)
- [X] T002 [P1] 优化 Ledger 切换 - 改为下拉选择器 (HomePage.tsx)
- [X] T003 [P1] 优化 FAB 位置 - 调整为更安全的底部位置 (HomePage.tsx)

---

## Dependencies

- T001-T003 are independent and can be done in parallel

---

## Test Criteria

1. 导航菜单：点击图标显示菜单，点击外部关闭
2. Ledger 切换：点击账本名称显示下拉选择器
3. FAB：位置不遮挡内容，添加底部安全间距
