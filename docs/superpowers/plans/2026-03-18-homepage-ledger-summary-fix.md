# 首页账本切换汇总数据不更新修复实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复首页切换账本后汇总数据不更新的问题

**Architecture:** 直接传递 ledgerId 给 loadData，避免依赖 getCurrent() API

**Tech Stack:** React

---

## Task 1: 修复 HomePage loadData 函数

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 修改 loadData 函数接受 ledgerId 参数**

找到当前的 loadData 函数：
```tsx
const loadData = async () => {
  try {
    const [ledgersRes, currentRes] = await Promise.all([
      ledgerApi.list(),
      ledgerApi.getCurrent(),
    ])
    const currentLedgerId = currentRes.data.data?.id
    const [recordsRes, summaryRes] = await Promise.all([
      recordApi.list({ ledger_id: currentLedgerId, page: 1, page_size: 100 }),
      statsApi.getSummary(new Date().getFullYear(), currentLedgerId),
    ])
    // ...
  }
}
```

替换为：
```tsx
const loadData = async (targetLedgerId?: number) => {
  try {
    const [ledgersRes, currentRes] = await Promise.all([
      ledgerApi.list(),
      ledgerApi.getCurrent(),
    ])
    const currentLedgerId = targetLedgerId ?? currentRes.data.data?.id
    const [recordsRes, summaryRes] = await Promise.all([
      recordApi.list({ ledger_id: currentLedgerId, page: 1, page_size: 100 }),
      statsApi.getSummary(new Date().getFullYear(), currentLedgerId),
    ])
    // ...
  }
}
```

- [ ] **Step 2: 修改 switchLedger 函数传递 ledgerId**

找到当前的 switchLedger 函数：
```tsx
const switchLedger = async (ledgerId: number) => {
  await ledgerApi.setCurrent(ledgerId)
  loadData()
}
```

替换为：
```tsx
const switchLedger = async (ledgerId: number) => {
  await ledgerApi.setCurrent(ledgerId)
  const newLedger = ledgers.find(l => l.id === ledgerId)
  setCurrentLedger(newLedger || null)
  loadData(ledgerId)
}
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "fix: 首页切换账本后汇总数据正确更新"
```

---

## 验收标准

1. 切换账本后，首页汇总数据正确更新
2. 构建无错误
