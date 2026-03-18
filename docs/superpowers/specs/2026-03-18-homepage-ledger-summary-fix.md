# 首页账本切换汇总数据不更新 Bug 修复

**Created**: 2026-03-18
**Status**: Draft

## 问题描述

首页切换账本时，汇总数据（本月支出、收入、结余）没有更新。

## 原因分析

`loadData()` 函数依赖 `getCurrent()` API 获取当前账本 ID，可能存在时序问题。

## 修复方案

直接传递 `ledgerId` 给 `loadData`，避免依赖 `getCurrent()` API：

```tsx
// 修改 loadData 接受 ledgerId 参数
const loadData = async (targetLedgerId?: number) => {
  const id = targetLedgerId ?? currentLedger?.id
  // 使用 id 获取汇总数据
}

// 修改 switchLedger
const switchLedger = async (ledgerId: number) => {
  await ledgerApi.setCurrent(ledgerId)
  const newLedger = ledgers.find(l => l.id === ledgerId)
  setCurrentLedger(newLedger || null)
  loadData(ledgerId) // 直接传入
}
```

## 受影响文件

- frontend/src/pages/HomePage.tsx

## 验收标准

1. 切换账本后，首页汇总数据正确更新
2. 构建无错误
