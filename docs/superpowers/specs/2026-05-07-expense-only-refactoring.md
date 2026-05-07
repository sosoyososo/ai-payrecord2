# 只保留支出功能重构方案

**日期**: 2026-05-07
**状态**: 已批准
**类型**: 架构重构 / 功能精简

## 背景

当前应用支持三种记录类型：支出(expense)、收入(income)、转账(transfer)，以及基于收入的预算(budget)和结余(balance)统计。项目核心目标是**统计支出**，因此需要删除预算、收入、转账、结余相关所有功能，将应用简化为纯支出记账工具。

## 目标

1. 删除预算功能（BudgetPage 及相关入口）
2. 删除收入(income)和转账(transfer)记录类型，所有记录均为支出
3. 删除收入分类和转账分类，所有分类均为支出分类
4. 删除结余(balance)计算和展示
5. 重建数据库（删除旧的 SQLite 文件）
6. 不影响用户认证等现有核心功能
7. 不影响现有记录的展示功能（所有历史记录视为支出）

## 范围

### 1. 后端改动

#### 1.1 数据模型

**Record** (`backend/internal/model/record.go`):
- 删除 `RecordTypeIncome RecordType = 2` 和 `RecordTypeTransfer RecordType = 3`
- 删除 `Type RecordType` 字段
- 仅保留 `RecordTypeExpense RecordType = 1`

**Category** (`backend/internal/model/category.go`):
- 删除 `CategoryTypeIncome CategoryType = 1` 和 `CategoryTypeTransfer CategoryType = 3`
- 删除 `Type CategoryType` 字段
- 仅保留 `CategoryTypeExpense CategoryType = 2`

#### 1.2 统计服务

**Stats** (`backend/internal/service/stats.go`):
- `SummaryStats`：移除 `TotalIncome`、`IncomeCount`、`Balance` 字段
- `MonthlyStats`：移除 `Income`、`IncomeCount` 字段
- `DailyStats`：移除 `Income`、`IncomeCount` 字段
- 查询逻辑：不再按 type 分组汇总，统计所有记录

**Stats Handler** (`backend/internal/handler/stats.go`):
- 移除 income/balance 相关字段返回

#### 1.3 记录服务

**Record** (`backend/internal/service/record.go`):
- `CreateRecordRequest` 移除 `Type` 字段，创建记录时默认为支出

#### 1.4 数据库迁移

- 删除 `backend/*.db` SQLite 文件
- 应用启动时通过 AutoMigrate 重新创建表结构

### 2. 前端改动

#### 2.1 删除的文件

- `frontend/src/pages/BudgetPage.tsx` — 整个预算页面

#### 2.2 路由和导航

- `frontend/src/App.tsx` — 移除 budget 路由和 lazy import
- `frontend/src/config/navigation.ts` — 移除 budget 导航项

#### 2.3 类型定义

**types** (`frontend/src/types/index.ts`):
- `RecordType`：简化为只有开销类型（去除 income/transfer）
- `CategoryType`：简化为只有支出类型（去除 income/transfer）
- `SummaryStats`：移除 `total_income`、`income_count`、`balance`
- `MonthlyStats`：移除 `income`、`income_count`

#### 2.4 组件

**RecordForm** (`frontend/src/components/RecordForm.tsx`):
- 移除支出/收入/转账类型选择器
- 移除 `income` translations prop
- 分类过滤逻辑简化：直接加载所有分类

**AddRecordPage** (`frontend/src/pages/AddRecordPage.tsx`):
- 移除 `income` translations 传参

**EditRecordPage** (`frontend/src/pages/EditRecordPage.tsx`):
- 移除 `income` translations 传参

**CategoryPage** (`frontend/src/pages/CategoryPage.tsx`):
- 移除"收入分类"区域
- 分类类型标签简化

**ExportPage** (`frontend/src/pages/ExportPage.tsx`):
- 记录类型标签仅显示"支出"

**SettingsPage** (`frontend/src/pages/SettingsPage.tsx`):
- 移除"预算设置"链接

#### 2.5 页面

**HomePage** (`frontend/src/pages/HomePage.tsx`):
- 移除收入(income)统计卡片
- 移除结余(balance)统计卡片
- 仅保留支出统计

**StatsPage** (`frontend/src/pages/StatsPage.tsx`):
- 移除收入卡片和结余卡片
- 移除收入折线图(LineChart income dataKey)
- 移除收入柱状图(BarChart income dataKey)
- 仅展示支出相关统计

#### 2.6 国际化

**en.json / zh.json**:
- 移除 `nav.budget`
- 移除 `settings.budgetSettings`
- 移除整个 `budget` 翻译区块
- 移除 `home.income`、`home.balance`
- 移除 `income`、`balance`、`incomeAmount`、`incomeCategory` 等

### 3. 测试文档更新

- `docs/superpowers/test-cases/ui-test-cases.md`：
  - 移除 Section 9（Budget 测试用例）
  - 更新包含收入断言的测试用例
- `docs/superpowers/test-cases/api-test-cases.md`：
  - 更新 Stats 测试用例，移除 income/balance 断言

## 执行顺序

```
1. 后端数据模型简化（model/record.go, model/category.go）
2. 后端服务层简化（service/stats.go, service/record.go）
3. 后端 handler 简化（handler/stats.go）
4. 删除数据库文件
5. 前端类型简化（types/index.ts）
6. 前端 RecordForm 组件简化
7. 前端页面简化（HomePage, StatsPage, CategoryPage, ExportPage, SettingsPage）
8. 删除 BudgetPage 和相关路由/导航
9. 前端 i18n 清理
10. 测试文档更新
11. 端到端验证
```

## 不包含的范围

- 用户认证系统不变（注册、登录、密码重置、邮箱验证）
- Ledger（账本）模块不变
- Tag（标签）模块不变
- LLM AI 解析功能不变
- 页面布局和动画框架不变

## 风险与注意事项

- 需要确保删除数据库文件前用户数据已备份（开发阶段）
- 注意前端 `CategoryPage` 中 income 分类相关逻辑的清除要彻底
- Stats 查询逻辑修改后需验证查询结果准确性
- 分类的 CRUD 接口虽然删除 type 字段，但请求/响应结构需要对应更新
