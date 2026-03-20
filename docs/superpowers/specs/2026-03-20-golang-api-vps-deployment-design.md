# Go API VPS 部署设计

## 1. 概述

将 Go 后端 API 部署到 VPS (47.101.10.220)，通过 GitHub Actions 自动构建并部署。

### 域名配置
- **API**: https://api.payrecord.ai.karsa.info (VPS Nginx → Go Backend)
- **前端**: https://web.pay.ai.karsa.info (GitHub Pages)

### DNS
- `api.payrecord.ai.karsa.info` → `47.101.10.220`

---

## 2. 部署结构

```
/root/ai-payrecord/
├── bin/
│   └── server          # Go binary
├── config/
│   └── .env            # 配置文件
├── data/
│   └── ledger.db       # SQLite 数据库
└── logs/               # 日志目录
```

---

## 3. GitHub Actions 工作流

### 文件位置
`.github/workflows/deploy-api.yml`

### 触发条件
- push 到 `main` 分支（涉及 backend/ 目录的变更）
- 手动触发 `workflow_dispatch`

### 部署步骤
1. checkout 代码
2. 设置 Go 1.25+
3. 构建 binary: `go build -o bin/server ./cmd/server`
4. 创建部署目录（如果不存在）
5. 通过 SSH 上传 binary 和配置
6. 重启 systemd 服务

### SSH 认证
- 使用 `SSH_PRIVATE_KEY` secrets
- 用户: root
- 主机: 47.101.10.220

---

## 4. VPS 端配置

### systemd 服务
```ini
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
```

### Nginx 配置
```nginx
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
```

### Let's Encrypt 证书
使用 lego 获取证书（用户已安装）:
```bash
lego --http --http.port=:8888 --domains=api.payrecord.ai.karsa.info --path=/var/www/.well-known/acme-challenge run
```

---

## 5. GitHub Secrets 需要配置

| Secret | 说明 |
|--------|------|
| `SSH_PRIVATE_KEY` | VPS SSH 私钥 |
| `VPS_HOST` | 47.101.10.220 |
| `VPS_USER` | root |

---

## 6. 涉及文件

| 文件 | 操作 |
|------|------|
| `.github/workflows/deploy-api.yml` | 新建 |
| `backend/.env` | 需要创建生产配置 |

### VPS 端需要创建
- `/etc/systemd/system/ai-payrecord.service`
- `/etc/nginx/sites-available/api.payrecord.ai.karsa.info`
- `/etc/nginx/sites-enabled/api.payrecord.ai.karsa.info`
- `/root/ai-payrecord/config/.env`
- `/root/ai-payrecord/logs/`
