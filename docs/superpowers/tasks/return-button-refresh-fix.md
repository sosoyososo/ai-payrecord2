# 返回按钮页面刷新 Bug 修复

**Created**: 2026-03-18
**Status**: ✅ COMPLETED

## 问题描述

点击返回按钮后，URL 变化但页面没有刷新，导致数据不更新。

## 原因分析

使用 React Router 的 `navigate('/')` 只是改变路由，不会重新挂载组件，导致页面数据不更新。

## 修复方案

将 `navigate('/')` 改为 `window.location.href = '/'`，强制页面刷新。

## 修复的页面

| 页面 | 文件 |
|------|------|
| StatsPage | frontend/src/pages/StatsPage.tsx |
| AddRecordPage | frontend/src/pages/AddRecordPage.tsx |
| CategoryPage | frontend/src/pages/CategoryPage.tsx |
| TagPage | frontend/src/pages/TagPage.tsx |
| BudgetPage | frontend/src/pages/BudgetPage.tsx |
| ExportPage | frontend/src/pages/ExportPage.tsx |
| LedgerPage | frontend/src/pages/LedgerPage.tsx |
| SettingsPage | frontend/src/pages/SettingsPage.tsx |

## 提交记录

- `0dcea45` fix: 返回按钮使用 window.location.href 刷新页面
