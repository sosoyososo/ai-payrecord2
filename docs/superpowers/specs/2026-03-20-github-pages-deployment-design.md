# GitHub Pages 前端部署设计

## 1. 概述

将前端 Web 应用部署到 GitHub Pages，后端 API 部署在 VPS 通过 Nginx 反向代理。

### 域名配置
- **前端**: https://web.pay.ai.karsa.info (GitHub Pages)
- **后端 API**: https://api.payrecord.ai.karsa.info (VPS Nginx → Go Backend)

## 2. GitHub Actions 工作流

### 文件位置
`.github/workflows/deploy.yml`

### 触发条件
- push 到 `main` 分支

### 构建步骤
1. checkout 代码
2. 设置 Node.js 18+
3. 安装依赖: `npm ci`
4. 设置环境变量: `VITE_API_URL=https://api.payrecord.ai.karsa.info/api/v1`
5. 执行构建: `npm run build`
6. 部署到 GitHub Pages: `actions/deploy-pages@v4`

### GitHub Pages 配置
- Source: GitHub Actions

## 3. Nginx CORS 配置（VPS 端）

需要在 Nginx 配置中添加以下响应头：

```nginx
add_header Access-Control-Allow-Origin "https://web.pay.ai.karsa.info" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
```

**关键域名**: `https://web.pay.ai.karsa.info`

## 4. 前端环境变量

生产环境使用 `.env.production` 或 GitHub Secrets 配置：

```
VITE_API_URL=https://api.payrecord.ai.karsa.info/api/v1
```

## 5. 涉及文件

| 文件 | 操作 |
|------|------|
| `.github/workflows/deploy.yml` | 新建 |
| `frontend/.env` | 已存在，VITE_API_URL 配置正确 |

## 6. 部署流程

```
开发者 push 到 main 分支
    → GitHub Actions 自动触发
    → npm install + npm run build
    → 使用 VITE_API_URL 构建
    → 部署到 GitHub Pages
    → 前端可访问 https://web.pay.ai.karsa.info
```
