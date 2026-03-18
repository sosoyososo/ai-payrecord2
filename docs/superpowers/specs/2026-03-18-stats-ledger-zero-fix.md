# 修复 Stats API ledger_id=0 时返回所有账本数据问题

**Created**: 2026-03-18
**Status**: Draft

## 问题描述

当前端传递 `ledger_id=0` 时，后端 Stats API 返回所有账本的汇总数据，而不是指定账本的数据。

原因：后端检查 `*ledgerID > 0` 失败（0 不大于 0），导致不添加 WHERE 条件。

## 修复方案

修改后端 handler 层，当 `ledger_id` 为空或 0 时，不传递 ledgerID 给 service，让 service 查询当前账本的汇总数据。

## 受影响文件

- `backend/internal/handler/stats.go`

## 验收标准

1. ledger_id=0 或空时，返回当前账本数据
2. ledger_id>0 时，返回指定账本数据
3. 测试通过
