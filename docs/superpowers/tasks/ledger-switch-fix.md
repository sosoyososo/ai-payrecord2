# Ledger Switch Fix Tasks

**Issue**: 首页切换账本时记录不更新
**Spec**: docs/superpowers/specs/2026-03-17-ledger-switch-issue.md
**Plan**: docs/superpowers/plans/2026-03-17-ledger-switch-fix.md
**Created**: 2026-03-17
**Status**: ✅ FIXED

## Problem Summary

前端调用 API 时没有传递 `ledger_id` 参数，导致切换账本后记录和统计数据不变化。后端 GetSummary 也未按 ledger_id 过滤总收入/支出。

## Tasks

- [X] T001 Fix HomePage.tsx - add ledger_id to recordApi.list() call (frontend/src/pages/HomePage.tsx:50)
- [X] T002 Fix HomePage.tsx - add ledger_id to statsApi.getSummary() call (frontend/src/pages/HomePage.tsx:51)
- [X] T003 Fix ExportPage.tsx - add ledger_id to recordApi.list() call (frontend/src/pages/ExportPage.tsx:19)
- [X] T004 Fix BudgetPage.tsx - add ledger_id to statsApi.getSummary() call (frontend/src/pages/BudgetPage.tsx:25)
- [X] T005 Fix backend GetSummary - add ledger_id filter to income/expense queries (backend/internal/service/stats.go:60-90)
- [X] T006 Verify frontend build passes
- [X] T007 Verify backend build passes
- [X] T008 Test ledger switch on HomePage - records update ✅
- [X] T009 Test ledger switch on ExportPage - data changes ✅
- [X] T010 Test ledger switch on BudgetPage - stats change ✅

## Test Cases (docs/superpowers/test-cases/)

- [X] TC-UI-HOME-004: 切换账本后记录变化 ✅
- [ ] TC-UI-EXPORT-003: 切换账本后导出数据变化 (待添加)
- [ ] TC-UI-BUDGET-003: 切换账本后预算统计变化 (待添加)

## Dependencies

- T001-T004 can be done in parallel
- T005 depends on T001-T004 (need API with ledger_id first)
- T006-T010 depend on previous fixes

## Notes

All frontend fixes involve adding `ledger_id: currentLedger?.id` as parameter to API calls.
Backend fix adds ledger_id filter to SQL queries in GetSummary function.
