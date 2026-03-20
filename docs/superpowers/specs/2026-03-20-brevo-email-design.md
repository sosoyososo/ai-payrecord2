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
    Type      string    `gorm:"not null"`  // "password_reset" | "email_verification" | "login_alert"
    Code      string    `gorm:"not null"`
    ExpiresAt time.Time `gorm:"not null"`
    Used      bool      `gorm:"default:false"`
    CreatedAt time.Time
}
```

### 有效期

| 类型 | 有效期 |
|------|--------|
| password_reset | 15 分钟 |
| email_verification | 24 小时 |
| login_alert | 不存储，直接发送 |

## 4. API 端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/forgot-password` | 输入邮箱，发送密码重置验证码 | 否 |
| POST | `/api/auth/reset-password` | 提交新密码（需验证码） | 否 |
| POST | `/api/auth/verify-email` | 邮箱验证 | 否 |
| POST | `/api/auth/send-verification` | 重新发送验证邮件 | JWT |

### 请求/响应示例

**POST /api/auth/forgot-password**
```json
Request:  { "email": "user@example.com" }
Response: { "message": "If the email exists, a reset code has been sent." }
```

**POST /api/auth/reset-password**
```json
Request:  { "email": "user@example.com", "code": "12345678", "new_password": "newPass123" }
Response: { "message": "Password has been reset successfully." }
```

## 5. 配置

环境变量：
- `BREVO_API_KEY`: Brevo API 密钥
- `BREVO_SENDER_EMAIL`: 发件人邮箱 (默认使用配置的发件人)
- `BREVO_SENDER_NAME`: 发件人名称

## 6. 错误处理

| 场景 | 返回 |
|------|------|
| 邮箱不存在 | 返回通用消息（防用户枚举攻击） |
| 令牌已使用 | 400 "Code has already been used" |
| 令牌过期 | 400 "Code has expired" |
| 令牌无效 | 400 "Invalid code" |
| Brevo API 失败 | 500 "Failed to send email"，记录日志 |

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

## 8. 验证码规格

- 格式：8 位数字
- 生成：使用 crypto/rand 随机生成
- 存储：bcrypt 哈希存储（防止泄露）

## 9. 实现步骤

1. 添加 `BREVO_API_KEY` 环境变量配置
2. 创建 `pkg/brevo/client.go` Brevo API 客户端
3. 创建 `internal/model/token.go` Token 模型
4. 创建 `internal/service/token.go` 令牌服务
5. 创建 `internal/service/email.go` 邮件服务
6. 在 `internal/handler/auth.go` 添加新端点
7. 编写单元测试
