# Brevo 邮件集成设计文档

## 1. 概述

通过 Brevo (formerly Sendinblue) API 集成邮件服务，支持账户安全类邮件：密码重置、邮箱验证、登录提醒。

## 2. 技术架构

```
backend/
├── internal/
│   ├── model/
│   │   └── token.go          # Token 数据模型
│   ├── service/
│   │   ├── email.go          # EmailService (Brevo 封装)
│   │   └── token.go          # TokenService (令牌管理)
│   └── handler/
│       └── auth.go           # 新增端点
├── pkg/
│   └── brevo/
│       └── client.go         # Brevo API 客户端封装
```

## 3. Token 数据模型

```go
type Token struct {
    ID        uint      `gorm:"primaryKey"`
    UserID    uint      `gorm:"index;not null"`
    Type      string    `gorm:"not null"`  // "password_reset" | "email_verification"
    Code      string    `gorm:"not null"`  // 8位数字验证码，明文加密存储
    ExpiresAt time.Time `gorm:"not null"`
    Used      bool      `gorm:"default:false"`
    CreatedAt time.Time
}
```

> **注意**：`login_alert` 类型不存储令牌，仅发送通知邮件（见第7节）。

### 有效期

| 类型 | 有效期 |
|------|--------|
| password_reset | 15 分钟 |
| email_verification | 24 小时 |

## 4. API 端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/forgot-password` | 输入邮箱，发送密码重置验证码 | 否 |
| POST | `/api/auth/reset-password` | 提交新密码（需验证码） | 否 |
| POST | `/api/auth/verify-email` | 邮箱验证 | 否 |
| POST | `/api/auth/send-verification` | 重新发送验证邮件 | JWT |

> **响应格式**：所有端点使用项目统一的 `response.SuccessWithMessage()` 格式。

### 请求/响应示例

**POST /api/auth/forgot-password**
```
Request:  { "email": "user@example.com" }
Response: { "code": 0, "message": "If the email exists, a reset code has been sent.", "data": null }
```

**POST /api/auth/reset-password**
```
Request:  { "email": "user@example.com", "code": "12345678", "new_password": "newPass123" }
Response: { "code": 0, "message": "Password has been reset successfully.", "data": null }
```

**POST /api/auth/verify-email**
```
Request:  { "email": "user@example.com", "code": "12345678" }
Response: { "code": 0, "message": "Email verified successfully.", "data": null }
```

## 5. 配置

在 `internal/config/config.go` 的 `Config` 结构体中添加：

```go
BrevoAPIKey    string
BrevoSenderEmail string
BrevoSenderName  string
```

环境变量：
- `BREVO_API_KEY`: Brevo API 密钥
- `BREVO_SENDER_EMAIL`: 发件人邮箱
- `BREVO_SENDER_NAME`: 发件人名称

## 6. 错误处理

| 场景 | 返回 |
|------|------|
| 邮箱不存在 | 返回通用消息（防用户枚举攻击） |
| 令牌已使用 | 400 "Code has already been used" |
| 令牌过期 | 400 "Code has expired" |
| 令牌无效 | 400 "Invalid code" |
| Brevo API 失败 | 500 "Failed to send email"，记录日志 |
| 请求过于频繁 | 429 "Too many requests" |

### 限流

- 每个 IP 每分钟最多 5 次 `forgot-password` 请求
- 每个邮箱每 15 分钟最多 1 封密码重置邮件

## 7. 邮件内容

纯文本格式，不使用 HTML。

**密码重置邮件示例：**
```
Subject: Password Reset Code

You have requested a password reset for your account.

Your verification code is: 12345678

This code will expire in 15 minutes.

If you did not request this, please ignore this email.
```

**邮箱验证邮件示例：**
```
Subject: Email Verification

Welcome! Please verify your email address.

Your verification code is: 12345678

This code will expire in 24 hours.

If you did not create an account, please ignore this email.
```

**登录提醒邮件示例：**
```
Subject: New Device Login Alert

We noticed a new sign-in to your account.

Time: {login_time}
Location: {location}
Device: {device}

If this was you, you can ignore this email.
If this wasn't you, please secure your account immediately.
```

## 8. 验证码规格

- 格式：8 位数字
- 生成：使用 crypto/rand 随机生成
- 存储：**AES-256 加密存储**（可逆加密，不是 bcrypt，以便验证时解密比对）
- 加密密钥通过环境变量 `TOKEN_ENCRYPTION_KEY` 配置（32字节十六进制字符串）

## 9. 实现步骤

1. 在 `internal/config/config.go` 添加 Brevo 和 Token 加密配置
2. 创建 `pkg/brevo/client.go` Brevo API 客户端
3. 创建 `pkg/crypto/aes.go` AES 加密工具（用于验证码加密存储）
4. 创建 `internal/model/token.go` Token 模型
5. 创建 `internal/service/token.go` 令牌服务
6. 创建 `internal/service/email.go` 邮件服务
7. 在 `internal/handler/auth.go` 添加新端点并在路由注册
8. 编写单元测试

### 新环境变量

```
BREVO_API_KEY=your-api-key
BREVO_SENDER_EMAIL=noreply@example.com
BREVO_SENDER_NAME=AI PayRecord
TOKEN_ENCRYPTION_KEY=32字节十六进制字符串
```
