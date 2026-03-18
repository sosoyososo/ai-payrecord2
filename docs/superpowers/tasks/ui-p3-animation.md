# UI P3 动效增强任务清单

**Spec**: docs/superpowers/specs/2026-03-18-ui-p3-animation.md
**Plan**: docs/superpowers/plans/2026-03-18-ui-p3-animation.md
**Created**: 2026-03-18
**Status**: In Progress

## 概述

P3 动效增强 - 为账本 App 添加微交互动画

---

## Phase 1: 页面转场动画

**Goal**: App.tsx 添加页面转场动画

**Independent Test**: 页面切换时有滑入动画效果

- [ ] T001 创建 AnimatedPage 组件 in frontend/src/App.tsx
- [ ] T002 [US1] 为首页添加 AnimatedPage 包装 in frontend/src/App.tsx
- [ ] T003 [US1] 为其他页面添加 AnimatedPage 包装 in frontend/src/App.tsx

---

## Phase 2: 列表项交错入场

**Goal**: HomePage 列表动画优化

**Independent Test**: 记录列表加载时有交错入场效果

- [ ] T004 检查 stagger-children 应用 in frontend/src/pages/HomePage.tsx

---

## Phase 3: 按钮交互反馈

**Goal**: AddRecordPage 按钮动画

**Independent Test**: 按钮点击时有按下缩小反馈

- [ ] T005 [US2] 检查保存按钮 className in frontend/src/pages/AddRecordPage.tsx
- [ ] T006 [US2] 添加 btn-press 到保存按钮 in frontend/src/pages/AddRecordPage.tsx

---

## Phase 4: 卡片入场动画

**Goal**: HomePage 卡片动画

**Independent Test**: 卡片有缩放入场效果，金额数字有渐显效果

- [ ] T007 [US3] 为记录卡片添加 scale-enter in frontend/src/pages/HomePage.tsx
- [ ] T008 [US3] 为金额添加 amount-animate in frontend/src/pages/HomePage.tsx

---

## Phase 5: 骨架屏优化

**Goal**: Skeleton 组件优化

**Independent Test**: 骨架屏有 shimmer 效果

- [ ] T009 检查当前 Skeleton 实现 in frontend/src/components/ui/skeleton.tsx
- [ ] T010 [US4] 添加 shimmer 效果到 Skeleton in frontend/src/components/ui/skeleton.tsx

---

## Dependencies

- T001 must complete before T002-T003
- T002-T003 must complete before T004
- T004 must complete before T007-T008
- T005 must complete before T006
- T009 must complete before T010

---

## Test Criteria

1. 页面切换时有滑入动画效果
2. 记录列表加载时有交错入场效果
3. 按钮点击时有按下缩小反馈
4. 卡片有缩放入场效果
5. 金额数字有渐显效果
6. 骨架屏有 shimmer 效果
7. 所有动画流畅无卡顿
