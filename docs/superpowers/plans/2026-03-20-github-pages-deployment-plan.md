# GitHub Pages 部署实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 GitHub Actions 工作流，自动构建并部署前端到 GitHub Pages

**Architecture:** push 到 main 分支触发 GitHub Actions，执行 npm build（VITE_API_URL 指向 api.payrecord.ai.karsa.info），然后部署到 GitHub Pages

**Tech Stack:** GitHub Actions, Node.js 18+, npm, Vite

---

## 文件结构

```
.github/
└── workflows/
    └── deploy.yml          # 新建 - GitHub Actions 工作流
```

---

## 实施任务

### Task 1: 创建 GitHub Actions 工作流文件

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: 创建目录和工作流文件**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: 写入工作流配置**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        env:
          VITE_API_URL: https://api.payrecord.ai.karsa.info/api/v1
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: frontend/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: 验证文件存在**

Run: `ls -la .github/workflows/deploy.yml`
Expected: 文件存在

- [ ] **Step 4: 提交更改**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Pages deployment workflow

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 完成后需要用户操作

1. **启用 GitHub Pages**: 在 GitHub 仓库 Settings → Pages → Source 选择 "GitHub Actions"
2. **配置自定义域名**: 在 Settings → Pages 添加自定义域名 `web.pay.ai.karsa.info`
3. **配置 DNS**: 添加 CNAME 记录指向 `sosoyososo.github.io`
4. **Nginx CORS 配置**: 在 VPS Nginx 添加以下响应头：
   ```
   Access-Control-Allow-Origin: https://web.pay.ai.karsa.info
   ```
