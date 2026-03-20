# 邮箱验证注册流程设计

## 1. 概述

将现有的前端注册流程改造为"注册 → 邮箱验证 → 登录"三步流程，防止垃圾账户注册。

## 2. 当前状态

- **后端**：已实现 `POST /api/v1/auth/register`（直接创建用户并返回 token）、`POST /api/v1/auth/verify-email`（验证邮箱）、`POST /api/v1/auth/send-verification`（重发验证邮件）、`POST /api/v1/auth/forgot-password`（忘记密码）
- **前端**：`/register` 调用 `authApi.register()` 后立即自动登录

## 3. 流程设计

### 3.1 注册流程（改造）

```
用户填写注册表单
    ↓
POST /api/v1/auth/register
    ↓
后端：创建用户 + 发送验证邮件
    ↓
返回：{ code: 0, message: "Verification email sent", data: { email } }
    ↓
前端：跳转到 /verify-email 页面，显示"请查收验证邮件"
    ↓
用户查收邮件，获取验证码
    ↓
用户输入验证码
    ↓
POST /api/v1/auth/verify-email
    ↓
验证成功
    ↓
跳转到 /login 页面，显示"邮箱验证成功，请登录"
```

### 3.2 忘记密码流程（新增前端页面）

```
点击"忘记密码"链接
    ↓
跳转到 /forgot-password 页面
    ↓
输入邮箱地址
    ↓
POST /api/v1/auth/forgot-password
    ↓
返回成功（不区分邮箱是否存在）
    ↓
显示"如果邮箱存在，已发送重置验证码"
    ↓
用户输入验证码 + 新密码
    ↓
POST /api/v1/auth/reset-password
    ↓
成功
    ↓
跳转到 /login 页面，显示"密码已重置，请登录"
```

## 4. API 接口

### 4.1 注册（改造）

**Request:** 同现有
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "nickname": "Test User"
}
```

**Response（改造后）:**
```json
{
  "code": 0,
  "message": "Verification email sent. Please check your inbox.",
  "data": {
    "email": "test@example.com"
  }
}
```

> 返回不再包含 `access_token`、`refresh_token`、`user`。
> 验证邮件自动发送到用户邮箱。

### 4.2 验证邮箱

**Request:**
```json
{
  "email": "test@example.com",
  "code": "12345678"
}
```

**Response:**
```json
{
  "code": 0,
  "message": "Email verified successfully. Please login.",
  "data": null
}
```

### 4.3 重发验证邮件

**Request:**
```json
{
  "email": "test@example.com"
}
```

**Response:**
```json
{
  "code": 0,
  "message": "Verification email sent.",
  "data": null
}
```

### 4.4 忘记密码

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "code": 0,
  "message": "If the email exists, a reset code has been sent.",
  "data": null
}
```

### 4.5 重置密码

**Request:**
```json
{
  "email": "user@example.com",
  "code": "12345678",
  "new_password": "newPass123"
}
```

**Response:**
```json
{
  "code": 0,
  "message": "Password has been reset successfully. Please login.",
  "data": null
}
```

## 5. 前端页面

| 页面 | 路由 | 说明 |
|------|------|------|
| 登录 | `/login` | 现有页面，添加"忘记密码"链接 |
| 注册 | `/register` | 改造：注册后跳转到验证页面 |
| 邮箱验证 | `/verify-email` | 新增：输入邮箱验证码 |
| 忘记密码 | `/forgot-password` | 新增：请求重置验证码 |
| 重置密码 | `/reset-password` | 新增：输入新密码 |

## 6. 组件清单

### 6.1 新增组件

- `frontend/src/pages/EmailVerificationPage.tsx` - 邮箱验证页面（输入验证码）
- `frontend/src/pages/ForgotPasswordPage.tsx` - 忘记密码页面（输入邮箱）
- `frontend/src/pages/ResetPasswordPage.tsx` - 重置密码页面（输入验证码+新密码）

### 6.2 改造组件

- `frontend/src/pages/LoginPage.tsx` - 添加"忘记密码"链接和消息提示
- `frontend/src/pages/RegisterPage.tsx` - 可能需要（如果当前是内联在 LoginPage 中）
- `frontend/src/services/api.ts` - 添加新的 API 方法
- `frontend/src/contexts/AuthContext.tsx` - 可能需要调整
- `frontend/src/router.tsx` 或路由配置 - 添加新路由

## 7. 错误处理

| 场景 | 响应 |
|------|------|
| 注册时邮箱已存在 | 400 "User already exists" |
| 验证码错误 | 400 "Invalid code" |
| 验证码过期 | 400 "Code has expired" |
| 验证码已使用 | 400 "Code has already been used" |
| 重置密码时邮箱不存在 | 400 "Invalid code" |
| Brevo 发送失败 | 500 "Failed to send email" |

## 8. 实现任务

1. **后端改造**：修改 `AuthService.Register()` 在创建用户后调用 `SendEmailVerification()`
2. **前端改造**：更新 `LoginPage.tsx`，添加忘记密码入口
3. **前端新增**：创建 `EmailVerificationPage.tsx` 验证页面
4. **前端新增**：创建 `ForgotPasswordPage.tsx` 忘记密码页面
5. **前端新增**：创建 `ResetPasswordPage.tsx` 重置密码页面
6. **前端更新**：`api.ts` 添加新 API 方法
7. **前端更新**：路由配置添加新页面
8. **前端更新**：注册流程对接新 API
