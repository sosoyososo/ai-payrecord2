# Export Data Fix — Design Spec

**Date**: 2026-05-15
**Status**: Ready for review
**Scope**: 修复导出数据功能在 iOS App 和 Web 上的问题

## 问题诊断

两个根因：

1. **iOS 无反应**：`downloadFile` 使用 `a.click()` 触发 blob 下载。WKWebView 不支持 blob URL 的 download 属性，点击无效果。
2. **后端分页限制**：`record.go` 中 `page_size` 被静默限制为 100，前端请求 1000，超过 100 条记录时导出不完整。这也是 Web 端表现异常的原因。

## 修复方案

### 1. 安装 Capacitor 插件

```bash
npm install @capacitor/filesystem @capacitor/share
npx cap sync
```

### 2. 后端：提高 page_size 上限

**文件**: `backend/internal/service/record.go:86-88`

将 `query.PageSize > 100` 改为 `query.PageSize > 10000`。

### 3. 前端：平台感知下载函数

**文件**: `frontend/src/pages/ExportPage.tsx`

新增导入：
- `@capacitor/core` → `Capacitor`
- `@capacitor/filesystem` → `Filesystem, Directory`
- `@capacitor/share` → `Share`

新增 `blobToBase64` 工具函数。

重写 `downloadFile`：
- **原生平台**：Blob → Base64 → Filesystem.writeFile(temp) → Share.share(原生分享面板)
- **Web 平台**：保持现有 blob download 逻辑，增加 100ms 延迟清理避免竞态

### 4. 前端：错误提示

`handleLoadData` 的 catch 块中添加 toast 提示。

## 影响范围

- `frontend/src/pages/ExportPage.tsx` — 主要改动
- `backend/internal/service/record.go` — 一行改动
- `frontend/package.json` — 新增两个依赖

## 测试要点

- [ ] iOS App：点击导出 JSON/CSV → 弹出原生分享面板
- [ ] Android App：同上
- [ ] Web：点击导出 → 正常触发浏览器下载
- [ ] 超过 100 条记录时导出完整
- [ ] 数据加载失败时显示错误提示
