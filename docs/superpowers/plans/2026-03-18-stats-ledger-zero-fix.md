# Stats API ledger_id=0 修复实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 ledger_id=0 时返回所有账本数据的问题

**Architecture:** 在 handler 层过滤掉 ledger_id=0 的情况

**Tech Stack:** Go, Gin

---

## Task 1: 修复 Stats Handler

**Files:**
- Modify: `backend/internal/handler/stats.go`

- [ ] **Step 1: 修改 GetSummary handler**

找到：
```go
// Parse ledger_id
var ledgerID *uint
if ledgerIDStr := c.Query("ledger_id"); ledgerIDStr != "" {
    if id, err := strconv.ParseUint(ledgerIDStr, 10, 32); err == nil {
        uid := uint(id)
        ledgerID = &uid
    }
}
```

替换为：
```go
// Parse ledger_id
var ledgerID *uint
if ledgerIDStr := c.Query("ledger_id"); ledgerIDStr != "" {
    if id, err := strconv.ParseUint(ledgerIDStr, 10, 32); err == nil {
        uid := uint(id)
        if uid > 0 {
            ledgerID = &uid
        }
    }
}
```

- [ ] **Step 2: 修改其他 Stats handler (GetDailyStats, GetCategoryStats, GetMonthlyStats, GetTagStats, GetMonthlyDetail)**

对以下函数应用相同的修复：
- GetDailyStats (line ~86)
- GetCategoryStats (line ~123)
- GetMonthlyStats (line ~161)
- GetTagStats (line ~198)
- GetMonthlyDetail (line ~235)

- [ ] **Step 3: 构建验证**

Run: `cd backend && go build ./...`
Expected: 无错误

- [ ] **Step 4: 运行测试验证**

Run: `hurl --test --variables-file docs/superpowers/test-scripts/test-vars.hurl docs/superpowers/test-scripts/api-tests.hurl`
Expected: 所有测试通过

- [ ] **Step 5: 提交**

```bash
git add backend/internal/handler/stats.go
git commit -m "fix: stats API ledger_id=0 时返回当前账本数据"
```

---

## 验收标准

1. ledger_id=0 或空时，返回当前账本数据
2. ledger_id>0 时，返回指定账本数据
3. 测试通过
