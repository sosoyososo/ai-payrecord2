# 账本切换汇总数据不更新修复实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复账本切换后汇总数据不更新的问题

**Architecture:** 修改 switchLedger 函数，直接更新 currentLedger 状态触发 useEffect

**Tech Stack:** React

---

## Task 1: 修复 StatsPage 账本切换

**Files:**
- Modify: `frontend/src/pages/StatsPage.tsx`

- [ ] **Step 1: 修改 switchLedger 函数**

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
}
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/StatsPage.tsx
git commit -m "fix: 账本切换后汇总数据正确更新"
```

---

## 验收标准

1. 切换账本后，汇总数据正确更新
2. 构建无错误
