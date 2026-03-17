# 首页账本切换不生效修复计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复首页切换账本时记录和统计不更新的问题

**Architecture:** 前端 API 调用添加 ledger_id 参数，后端 GetSummary 添加 ledger_id 过滤

**Tech Stack:** React, Go, Gin

---

## 受影响文件

1. **前端**:
   - `frontend/src/pages/HomePage.tsx` - recordApi.list(), statsApi.getSummary()
   - `frontend/src/pages/ExportPage.tsx` - recordApi.list()
   - `frontend/src/pages/BudgetPage.tsx` - statsApi.getSummary()

2. **后端**:
   - `backend/internal/service/stats.go` - GetSummary 函数

---

## Chunk 1: 前端修复

### Task 1: 修复 HomePage.tsx

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 修改 recordApi.list() 调用**

```typescript
// 第 50 行，修改前
recordApi.list({ page: 1, page_size: 100 }),

// 修改后
recordApi.list({ ledger_id: currentLedger?.id, page: 1, page_size: 100 }),
```

- [ ] **Step 2: 修改 statsApi.getSummary() 调用**

```typescript
// 第 51 行，修改前
statsApi.getSummary(new Date().getFullYear()),

// 修改后
statsApi.getSummary(new Date().getFullYear(), currentLedger?.id),
```

- [ ] **Step 3: 验证构建**

```bash
cd frontend && npm run build
```

---

### Task 2: 修复 ExportPage.tsx

**Files:**
- Modify: `frontend/src/pages/ExportPage.tsx`

- [ ] **Step 1: 修改 recordApi.list() 调用**

```typescript
// 第 19 行，修改前
recordApi.list({ page: 1, page_size: 1000 }),

// 修改后
recordApi.list({ ledger_id: ledgerId, page: 1, page_size: 1000 }),
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

---

### Task 3: 修复 BudgetPage.tsx

**Files:**
- Modify: `frontend/src/pages/BudgetPage.tsx`

- [ ] **Step 1: 修改 statsApi.getSummary() 调用**

```typescript
// 第 25 行，修改前
const statsRes = await statsApi.getSummary(new Date().getFullYear())

// 修改后
const statsRes = await statsApi.getSummary(new Date().getFullYear(), ledgerId)
```

- [ ] **Step 2: 验证构建**

```bash
cd frontend && npm run build
```

---

## Chunk 2: 后端修复

### Task 4: 修复 GetSummary 服务层

**Files:**
- Modify: `backend/internal/service/stats.go`

- [ ] **Step 1: 修改收入查询添加 ledger_id 过滤**

```go
// 第 71-75 行，修改前
var totalIncome float64
db.Model(&model.Record{}).Select("COALESCE(SUM(amount), 0)").
    Where("user_id = ? AND type = ? AND date >= ? AND date <= ? AND status = 1", userID, model.RecordTypeIncome, startDate, endDate).
    Scan(&totalIncome)

// 修改后
ledgerFilter := ""
var ledgerFilterArgs []interface{}
if ledgerID != nil && *ledgerID > 0 {
    ledgerFilter = " AND ledger_id = ?"
    ledgerFilterArgs = []interface{}{*ledgerID}
}

var totalIncome float64
db.Model(&model.Record{}).Select("COALESCE(SUM(amount), 0)").
    Where("user_id = ? AND type = ? AND date >= ? AND date <= ? AND status = 1"+ledgerFilter, append([]interface{}{userID, model.RecordTypeIncome, startDate, endDate}, ledgerFilterArgs...)...).
    Scan(&totalIncome)
```

- [ ] **Step 2: 修改支出查询添加 ledger_id 过滤**

```go
// 类似修改 totalExpense 查询
```

- [ ] **Step 3: 修改计数查询添加 ledger_id 过滤**

```go
// 类似修改 incomeCount, expenseCount 查询
```

- [ ] **Step 4: 验证构建**

```bash
cd backend && go build ./...
```

---

## Chunk 3: 测试验证

### Task 5: 前端测试

- [ ] **Step 1: 启动前端服务**

```bash
cd frontend && npm run dev
```

- [ ] **Step 2: 测试首页账本切换**

使用 Playwright 验证：
1. 切换账本按钮
2. 记录列表更新
3. 统计卡片更新

- [ ] **Step 3: 测试导出页面**

验证切换账本后导出数据变化

- [ ] **Step 4: 测试预算页面**

验证切换账本后预算统计变化

---

### Task 6: 后端测试

- [ ] **Step 1: 启动后端服务**

```bash
cd backend && go run cmd/server/main.go
```

- [ ] **Step 2: API 测试**

使用 hurl 验证：
1. /api/v1/stats/summary?ledger_id=1 返回正确数据
2. 不同 ledger_id 返回不同数据

---

## 实施顺序

1. **Chunk 1**: 前端修复 (Task 1-3，可并行)
2. **Chunk 2**: 后端修复 (Task 4)
3. **Chunk 3**: 测试验证 (Task 5-6)

---

## 验收标准

- [ ] 切换账本后，首页记录列表只显示当前账本的记录
- [ ] 切换账本后，首页统计卡片数据只反映当前账本
- [ ] 导出页面导出的数据只包含当前账本
- [ ] 预算页面统计只反映当前账本
