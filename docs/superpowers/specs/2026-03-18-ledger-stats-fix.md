# 账本切换汇总数据不更新 Bug 修复

**Created**: 2026-03-18
**Status**: Draft

## 问题描述

首页和统计页面切换账本时，记录数据正确变化，但汇总数据没有更新。

## 原因分析

- HomePage: `loadData()` 内部重新调用 `getCurrent()`，能获取到最新账本
- StatsPage: `switchLedger` 调用 `loadData()` 时使用 `currentLedger?.id`（旧状态），未更新

## 修复方案

在 StatsPage 的 `switchLedger` 中直接更新 `currentLedger` 状态，触发 `useEffect` 重新加载数据：

```tsx
const switchLedger = async (ledgerId: number) => {
  await ledgerApi.setCurrent(ledgerId)
  const newLedger = ledgers.find(l => l.id === ledgerId)
  setCurrentLedger(newLedger || null)
}
```

## 受影响文件

- frontend/src/pages/StatsPage.tsx

## 验收标准

1. 切换账本后，汇总数据正确更新
2. 构建无错误
