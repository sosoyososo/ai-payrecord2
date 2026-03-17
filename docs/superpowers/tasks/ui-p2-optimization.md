# UI P2 优化任务清单

**Spec**: docs/superpowers/specs/2026-03-17-ui-design-standard.md
**Plan**: docs/superpowers/plans/2026-03-18-ui-p2-optimization.md
**Created**: 2026-03-18
**Status**: 📋 IN PROGRESS

## 概述

P2 视觉优化 - 骨架屏加载状态和下拉刷新功能

---

## Phase 1: 基础组件

**Goal**: 创建 Skeleton 组件

**Independent Test**: 组件可正常导入使用

- [ ] T001 创建 Skeleton 组件 in frontend/src/components/ui/skeleton.tsx

---

## Phase 2: 首页骨架屏

**Goal**: HomePage 添加骨架屏加载状态

**Independent Test**: 加载数据时显示骨架占位

- [ ] T002 [US1] 导入 Skeleton 组件 in frontend/src/pages/HomePage.tsx
- [ ] T003 [US1] 添加 loading state in frontend/src/pages/HomePage.tsx
- [ ] T004 [US1] 设置 loading 状态 in frontend/src/pages/HomePage.tsx
- [ ] T005 [US1] 添加 Summary Card 骨架屏 in frontend/src/pages/HomePage.tsx
- [ ] T006 [US1] 添加 Records List 骨架屏 in frontend/src/pages/HomePage.tsx

---

## Phase 3: 下拉刷新

**Goal**: HomePage 添加下拉刷新功能

**Independent Test**: 下拉可刷新数据

- [ ] T007 安装 react-pull-to-refresh in frontend/package.json
- [ ] T008 [US2] 导入 PullToRefresh in frontend/src/pages/HomePage.tsx
- [ ] T009 [US2] 添加下拉刷新功能 in frontend/src/pages/HomePage.tsx

---

## Dependencies

- T001 must complete before T002-T006
- T002-T006 must complete before T007-T009

---

## Test Criteria

1. Skeleton: 加载数据时显示骨架占位
2. Pull-to-refresh: 下拉刷新数据
