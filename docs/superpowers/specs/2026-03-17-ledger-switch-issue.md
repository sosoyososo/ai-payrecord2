# Issue: 首页切换账本时记录不更新

## 问题描述

在首页切换账本时，账单记录和统计信息没有变化，仍然显示的是之前账本的数据。

## 根本原因

前端调用 API 时没有传递 `ledger_id` 参数，导致 API 返回的是当前用户的默认账本数据或所有账本的汇总数据，而不是用户选择的账本数据。

## 受影响的页面

1. **HomePage.tsx**
   - `recordApi.list()` 缺少 `ledger_id`
   - `statsApi.getSummary()` 缺少 `ledger_id`

2. **ExportPage.tsx**
   - `recordApi.list()` 缺少 `ledger_id`

3. **BudgetPage.tsx**
   - `statsApi.getSummary()` 缺少 `ledger_id`

## 修复方案

### HomePage.tsx (第45-46行)
```typescript
// 修改前
recordApi.list({ page: 1, page_size: 100 }),
statsApi.getSummary(new Date().getFullYear()),

// 修改后
recordApi.list({ ledger_id: currentLedger?.id, page: 1, page_size: 100 }),
statsApi.getSummary(new Date().getFullYear(), currentLedger?.id),
```

### ExportPage.tsx (第19行)
```typescript
// 修改前
recordApi.list({ page: 1, page_size: 1000 }),

// 修改后
recordApi.list({ ledger_id: currentLedger?.id, page: 1, page_size: 1000 }),
```

### BudgetPage.tsx (第23行)
```typescript
// 修改前
const statsRes = await statsApi.getSummary(new Date().getFullYear())

// 修改后
const statsRes = await statsApi.getSummary(new Date().getFullYear(), currentLedger?.id)
```

## 验收标准

1. 切换账本后，首页记录列表只显示当前账本的记录
2. 切换账本后，首页统计卡片数据只反映当前账本
3. 导出页面导出的数据只包含当前账本
4. 预算页面统计只反映当前账本

## 测试用例

- TC-UI-HOME-004: 切换账本后记录变化 (更新)
- 新增 TC-UI-EXPORT-003: 切换账本后导出数据变化
- 新增 TC-UI-BUDGET-003: 切换账本后预算统计变化
