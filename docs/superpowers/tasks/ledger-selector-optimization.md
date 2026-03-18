# 账本切换组件优化任务清单

**Spec**: docs/superpowers/specs/2026-03-18-ledger-selector-optimization.md
**Plan**: docs/superpowers/plans/2026-03-18-ledger-selector-optimization.md
**Created**: 2026-03-18
**Status**: In Progress

## 概述

统一并优化账本切换组件

---

## Phase 1: 安装 shadcn/ui Select

**Goal**: 安装 Select 组件

**Independent Test**: Select 组件可正常导入

- [ ] T001 安装 shadcn/ui Select 组件 in frontend

---

## Phase 2: 创建 LedgerSelector 组件

**Goal**: 创建账本选择器组件

**Independent Test**: 组件可正常导入使用

- [ ] T002 创建 LedgerSelector 组件 in frontend/src/components/LedgerSelector.tsx

---

## Phase 3: HomePage 集成

**Goal**: HomePage 使用 LedgerSelector

**Independent Test**: 页面正常显示账本选择器

- [ ] T003 [US1] 导入 LedgerSelector in frontend/src/pages/HomePage.tsx
- [ ] T004 [US1] 替换原生 select in frontend/src/pages/HomePage.tsx

---

## Phase 4: StatsPage 集成

**Goal**: StatsPage 使用 LedgerSelector

**Independent Test**: 页面正常显示账本选择器

- [ ] T005 [US2] 导入 LedgerSelector in frontend/src/pages/StatsPage.tsx
- [ ] T006 [US2] 替换按钮组 in frontend/src/pages/StatsPage.tsx

---

## Dependencies

- T001 must complete before T002
- T002 must complete before T003-T004
- T002 must complete before T005-T006

---

## Test Criteria

1. Select 组件安装成功
2. LedgerSelector 组件可正常导入
3. HomePage 显示账本选择器
4. StatsPage 显示账本选择器
5. 账本切换功能正常
6. 构建无错误
