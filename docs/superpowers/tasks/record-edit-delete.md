# 记录编辑和删除功能 - 任务清单

**Spec**: docs/superpowers/specs/2026-03-18-record-edit-delete.md
**Plan**: docs/superpowers/plans/2026-03-18-record-edit-delete.md
**Created**: 2026-03-18
**Status**: ⏳ PENDING

## 概述

为账本记录添加编辑和删除功能

---

## Tasks

- [X] T001 修改 HomePage - 添加编辑和删除按钮 in frontend/src/pages/HomePage.tsx
- [X] T002 创建 EditRecordPage - 复用 AddRecordPage 实现编辑功能 in frontend/src/pages/EditRecordPage.tsx
- [X] T003 添加路由 - 编辑页面路由 in frontend/src/App.tsx
- [X] T004 构建验证并提交

---

## Test Criteria

1. 首页每条记录右侧显示编辑和删除按钮
2. 点击编辑按钮跳转到编辑页面
3. 编辑页面可以修改所有字段并保存
4. 点击删除按钮弹出确认对话框
5. 确认删除后记录被删除并刷新列表
6. 构建通过
