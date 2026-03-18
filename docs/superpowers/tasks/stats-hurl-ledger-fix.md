# Stats API 测试脚本账本参数修复任务清单

**Spec**: docs/superpowers/specs/2026-03-18-stats-hurl-ledger-fix.md
**Plan**: docs/superpowers/plans/2026-03-18-stats-hurl-ledger-fix.md
**Created**: 2026-03-18
**Status**: ✅ COMPLETED

## 概述

修复 stats API hurl 测试脚本，添加 ledger_id 参数

---

## Tasks

- [X] T001 修改 stats/summary 添加 ledger_id=1 in docs/superpowers/test-scripts/api-tests.hurl
- [X] T002 修改 stats/daily 添加 ledger_id=1 in docs/superpowers/test-scripts/api-tests.hurl
- [X] T003 修改 stats/by-category 添加 ledger_id=1 in docs/superpowers/test-scripts/api-tests.hurl
- [X] T004 修改 stats/monthly 添加 ledger_id=1 in docs/superpowers/test-scripts/api-tests.hurl
- [X] T005 修改 stats/monthly-detail 添加 ledger_id=1 in docs/superpowers/test-scripts/api-tests.hurl
- [X] T006 运行 hurl 测试验证 in docs/superpowers/test-scripts/api-tests.hurl

---

## Test Criteria

1. 所有 stats API 测试都传递 ledger_id 参数
2. 测试通过
