# Ledger Switch Fix Tasks

**Issue**: 首页切换账本时记录不更新
**Spec**: docs/superpowers/specs/2026-03-17-ledger-switch-issue.md
**Created**: 2026-03-17
**Status**: ✅ FIXED

## Problem Summary

前端调用 API 时没有传递 `ledger_id` 参数，导致切换账本后记录和统计数据不变化。

## Tasks

- [X] T001 Fix HomePage.tsx - add ledger_id to recordApi.list() call (frontend/src/pages/HomePage.tsx:45)
- [X] T002 Fix HomePage.tsx - add ledger_id to statsApi.getSummary() call (frontend/src/pages/HomePage.tsx:46)
- [X] T003 Fix ExportPage.tsx - add ledger_id to recordApi.list() call (frontend/src/pages/ExportPage.tsx:19)
- [X] T004 Fix BudgetPage.tsx - add ledger_id to statsApi.getSummary() call (frontend/src/pages/BudgetPage.tsx:23)
- [X] T005 Test ledger switch on HomePage ✅
- [X] T006 Test ledger switch on ExportPage ✅
- [X] T007 Test ledger switch on BudgetPage ✅
- [X] T008 Update test case TC-UI-HOME-004 status
- [X] T009 Fix backend GetSummary - add ledger_id filter to income/expense queries (backend/internal/service/stats.go)

## Dependencies

- T001, T002, T003, T004 can be done in parallel
- T005-T007 depend on T001-T004
- T008 depends on T005

## Notes

All fixes involve adding `ledger_id: currentLedger?.id` as the first parameter to API calls.
