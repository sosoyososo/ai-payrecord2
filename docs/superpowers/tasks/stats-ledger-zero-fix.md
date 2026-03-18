# Stats API ledger_id=0 修复任务清单

**Spec**: docs/superpowers/specs/2026-03-18-stats-ledger-zero-fix.md
**Plan**: docs/superpowers/plans/2026-03-18-stats-ledger-zero-fix.md
**Created**: 2026-03-18
**Status**: ✅ COMPLETED

## 概述

修复 ledger_id=0 时返回所有账本数据的问题

---

## Tasks

- [X] T001 修改 GetSummary handler 过滤 ledger_id=0 in backend/internal/handler/stats.go
- [X] T002 修改 GetDailyStats handler 过滤 ledger_id=0 in backend/internal/handler/stats.go
- [X] T003 修改 GetCategoryStats handler 过滤 ledger_id=0 in backend/internal/handler/stats.go
- [X] T004 修改 GetMonthlyStats handler 过滤 ledger_id=0 in backend/internal/handler/stats.go
- [X] T005 修改 GetTagStats handler 过滤 ledger_id=0 in backend/internal/handler/stats.go
- [X] T006 修改 GetMonthlyDetail handler 过滤 ledger_id=0 in backend/internal/handler/stats.go
- [X] T007 构建验证 in backend
- [X] T008 运行 hurl 测试验证

---

## Test Criteria

1. ledger_id=0 或空时，返回当前账本数据
2. ledger_id>0 时，返回指定账本数据
3. 测试通过
