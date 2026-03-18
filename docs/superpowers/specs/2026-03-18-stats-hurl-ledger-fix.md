# 修复 Stats API 测试脚本添加账本参数

**Created**: 2026-03-18
**Status**: Draft

## 问题描述

hurl 测试脚本中的 stats API 调用没有传递 `ledger_id` 参数，导致返回所有账本的汇总数据，而不是指定账本的数据。

例如：
- `GET /api/v1/stats/summary?year=2026` 没有传 `ledger_id`
- 返回：`{"total_income":1301,"total_expense":300}`

## 修复方案

为所有 stats 相关 API 测试添加 `ledger_id` 参数：
- `/api/v1/stats/summary` 添加 `ledger_id=1`
- `/api/v1/stats/daily` 添加 `ledger_id=1`
- `/api/v1/stats/by-category` 添加 `ledger_id=1`
- `/api/v1/stats/monthly` 添加 `ledger_id=1`
- `/api/v1/stats/monthly-detail` 添加 `ledger_id=1`

## 受影响文件

- `docs/superpowers/test-scripts/api-tests.hurl`

## 验收标准

1. 所有 stats API 测试都传递 `ledger_id` 参数
2. 测试通过
