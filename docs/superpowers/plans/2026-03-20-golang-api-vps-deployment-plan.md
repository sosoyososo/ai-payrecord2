# Go API VPS 部署实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 GitHub Actions 工作流自动构建部署 Go API 到 VPS，并通过 SSH 配置 Nginx、Let's Encrypt 和 systemd

**Architecture:** push 到 main 分支触发 GitHub Actions，构建 Go binary 后通过 SSH 部署到 VPS (47.101.10.220)，配置 Nginx 反向代理和 Let's Encrypt SSL

**Tech Stack:** GitHub Actions, Go 1.25, SSH, Nginx, Let's Encrypt (lego), systemd

---

## 文件结构

```
.github/workflows/
└── deploy-api.yml          # 新建 - GitHub Actions 工作流
```

---

## 实施任务

### Task 1: 创建 GitHub Actions API 部署工作流

**Files:**
- Create: `.github/workflows/deploy-api.yml`

- [ ] **Step 1: 创建工作流文件**

```yaml
name: Deploy API to VPS

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
  workflow_dispatch:

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.25'

      - name: Build
        working-directory: ./backend
        run: go build -o bin/server ./cmd/server

      - name: Create deployment directory
        run: |
          ssh -o StrictHostKeyChecking=no ${{ vars.VPS_USER }}@${{ vars.VPS_HOST }} \
            "mkdir -p /root/ai-payrecord/bin /root/ai-payrecord/config /root/ai-payrecord/data /root/ai-payrecord/logs"

      - name: Upload binary
        run: |
          scp -o StrictHostKeyChecking=no ./backend/bin/server \
            ${{ vars.VPS_USER }}@${{ vars.VPS_HOST }}:/root/ai-payrecord/bin/server

      - name: Upload config
        run: |
          scp -o StrictHostKeyChecking=no ./backend/.env \
            ${{ vars.VPS_USER }}@${{ vars.VPS_HOST }}:/root/ai-payrecord/config/.env

      - name: Restart service
        run: |
          ssh -o StrictHostKeyChecking=no ${{ vars.VPS_USER }}@${{ vars.VPS_HOST }} \
            "systemctl restart ai-payrecord || true"
```

- [ ] **Step 2: 验证文件存在**

Run: `ls -la .github/workflows/deploy-api.yml`

- [ ] **Step 3: 提交更改**

```bash
git add .github/workflows/deploy-api.yml
git commit -m "feat: add GitHub Actions workflow to deploy API to VPS

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: VPS 端配置（需要你在 VPS 上执行）

**这些命令需要在 VPS (47.101.10.220) 上手动执行：**

- [ ] **Step 1: 创建部署目录**

```bash
mkdir -p /root/ai-payrecord/{bin,config,data,logs}
```

- [ ] **Step 2: 创建 systemd 服务文件**

```bash
cat > /etc/systemd/system/ai-payrecord.service << 'EOF'
[Unit]
Description=AI Payrecord API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/ai-payrecord
ExecStart=/root/ai-payrecord/bin/server
Restart=always
EnvironmentFile=/root/ai-payrecord/config/.env

[Install]
WantedBy=multi-user.target
EOF
```

- [ ] **Step 3: 创建 Nginx HTTP 服务器配置**

```bash
cat > /etc/nginx/sites-available/api.payrecord.ai.karsa.info << 'EOF'
server {
    listen 80;
    server_name api.payrecord.ai.karsa.info;

    location /.well-known/acme-challenge/ {
        root /var/www/.well-known/acme-challenge/;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
EOF
```

- [ ] **Step 4: 启用 Nginx 配置**

```bash
ln -sf /etc/nginx/sites-available/api.payrecord.ai.karsa.info /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

- [ ] **Step 5: 使用 lego 获取 SSL 证书**

```bash
lego --http --http.port=:8888 --domains=api.payrecord.ai.karsa.info --path=/var/www/.well-known/acme-challenge run
```

- [ ] **Step 6: 创建 Nginx HTTPS 配置**

```bash
cat > /etc/nginx/sites-available/api.payrecord.ai.karsa.info << 'EOF'
server {
    listen 80;
    server_name api.payrecord.ai.karsa.info;

    location /.well-known/acme-challenge/ {
        root /var/www/.well-known/acme-challenge/;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name api.payrecord.ai.karsa.info;

    ssl_certificate /etc/letsencrypt/live/api.payrecord.ai.karsa.info/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.payrecord.ai.karsa.info/privkey.pem;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://web.pay.ai.karsa.info" always;
    add_header Access-Control-Allow-Origin "http://localhost:3000" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

- [ ] **Step 7: 重载 Nginx**

```bash
nginx -t && systemctl reload nginx
```

- [ ] **Step 8: 启用并启动服务**

```bash
systemctl daemon-reload
systemctl enable ai-payrecord
systemctl start ai-payrecord
systemctl status ai-payrecord
```

---

### Task 3: 配置 GitHub Secrets 和 Variables

- [ ] **在 GitHub 仓库 Settings → Secrets and variables → Actions 中配置:**

| Name | Type | Value |
|------|------|-------|
| `SSH_PRIVATE_KEY` | Secret | 你的 VPS SSH 私钥 |
| `VPS_HOST` | Variable | `47.101.10.220` |
| `VPS_USER` | Variable | `root` |

---

### Task 4: 验证部署

- [ ] **推送 backend 代码触发部署**

```bash
git add backend/.env
git commit -m "chore: add production env config

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin main
```

- [ ] **检查 GitHub Actions 运行状态**

```bash
gh run list --limit 3
```

- [ ] **验证 API 可访问**

```bash
curl https://api.payrecord.ai.karsa.info/health
```

---

## 完成后需要你操作

1. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加:
   - `SSH_PRIVATE_KEY` - VPS SSH 私钥
   - `VPS_HOST` - `47.101.10.220`
   - `VPS_USER` - `root`
2. 在 VPS 上执行 Task 2 的所有命令
3. 推送代码触发部署
