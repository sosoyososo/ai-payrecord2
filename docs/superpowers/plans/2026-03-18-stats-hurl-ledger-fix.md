# Stats API 测试脚本账本参数修复实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 stats API 测试添加 ledger_id 参数

**Architecture:** 简单修改 - 为每个 API 调用添加查询参数

**Tech Stack:** hurl

---

## Task 1: 修复 Stats API 测试

**Files:**
- Modify: `docs/superpowers/test-scripts/api-tests.hurl`

- [ ] **Step 1: 修改 stats/summary 添加 ledger_id**

找到：
```
GET http://localhost:8080/api/v1/stats/summary?year=2026
```

替换为：
```
GET http://localhost:8080/api/v1/stats/summary?year=2026&ledger_id=1
```

- [ ] **Step 2: 修改 stats/daily 添加 ledger_id**

找到：
```
GET http://localhost:8080/api/v1/stats/daily?start_date=2026-03-01&end_date=2026-03-17
```

替换为：
```
GET http://localhost:8080/api/v1/stats/daily?start_date=2026-03-01&end_date=2026-03-17&ledger_id=1
```

- [ ] **Step 3: 修改 stats/by-category 添加 ledger_id**

找到：
```
GET http://localhost:8080/api/v1/stats/by-category?type=1
```

替换为：
```
GET http://localhost:8080/api/v1/stats/by-category?type=1&ledger_id=1
```

- [ ] **Step 4: 修改 stats/monthly 添加 ledger_id**

找到：
```
GET http://localhost:8080/api/v1/stats/monthly?year=2026
```

替换为：
```
GET http://localhost:8080/api/v1/stats/monthly?year=2026&ledger_id=1
```

- [ ] **Step 5: 修改 stats/monthly-detail 添加 ledger_id**

找到：
```
GET http://localhost:8080/api/v1/stats/monthly-detail?year=2026&month=3
```

替换为：
```
GET http://localhost:8080/api/v1/stats/monthly-detail?year=2026&month=3&ledger_id=1
```

- [ ] **Step 6: 运行测试验证**

Run: `hurl --test --variables-file docs/superpowers/test-scripts/test-vars.hurl docs/superpowers/test-scripts/api-tests.hurl`
Expected: 所有测试通过

- [ ] **Step 7: 提交**

```bash
git add docs/superpowers/test-scripts/api-tests.hurl
git commit -m "fix: stats API 测试添加 ledger_id 参数"
```

---

## 验收标准

1. 所有 stats API 测试都传递 `ledger_id` 参数
2. 测试通过
