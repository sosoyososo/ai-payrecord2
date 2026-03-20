# Email Verification Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement registration flow with email verification - users register, receive verification email, verify, then login.

**Architecture:**
- Backend: Modify `AuthService.Register()` to send verification email instead of returning tokens. Create ledger/categories/tags immediately but mark user as unverified.
- Frontend: Add 3 new pages (EmailVerification, ForgotPassword, ResetPassword) and update LoginPage with forgot password link. Register flow redirects to EmailVerification page.
- i18n: Add new translation keys for all new UI text.

**Tech Stack:** React + Gin + Gorm + Brevo API

---

## File Structure

```
backend/
├── internal/
│   └── service/
│       └── auth.go                    # Modify: Register() to send email and return different response
├── internal/
│   └── handler/
│       └── auth.go                    # Modify: Register handler to handle new flow
frontend/
├── src/
│   ├── pages/
│   │   ├── EmailVerificationPage.tsx  # Create: Email verification page
│   │   ├── ForgotPasswordPage.tsx     # Create: Forgot password page
│   │   └── ResetPasswordPage.tsx      # Create: Reset password page
│   ├── services/
│   │   └── api.ts                     # Modify: Add new API methods
│   ├── App.tsx                        # Modify: Add new routes
│   └── i18n/
│       └── locales/
│           ├── en.json                 # Modify: Add auth flow translations
│           └── zh.json                 # Modify: Add auth flow translations
```

---

## Task 1: Backend - Modify Register to Send Verification Email

**Files:**
- Modify: `backend/internal/service/auth.go`
- Modify: `backend/internal/handler/auth.go`

**Context:** The Register function currently returns access_token + refresh_token. It needs to return `{ email }` and send a verification email instead.

- [ ] **Step 1: Create a new RegisterResponse type for pre-verification**

In `backend/internal/service/auth.go`, add a new response type and modify Register:

```go
// RegisterResponse is returned after registration (before email verification)
type RegisterResponse struct {
    Email string `json:"email"`
}

// Register creates user, sends verification email, returns email (no tokens yet)
func (s *AuthService) Register(req *RegisterRequest) (*RegisterResponse, error) {
    db := database.GetDB()

    // Check if user exists
    var count int64
    db.Model(&model.User{}).Where("email = ?", req.Email).Count(&count)
    if count > 0 {
        return nil, ErrUserExists
    }

    db.Model(&model.User{}).Where("username = ?", req.Username).Count(&count)
    if count > 0 {
        return nil, errors.New("username already exists")
    }

    // Hash password
    hashedPassword, err := utils.HashPassword(req.Password)
    if err != nil {
        return nil, err
    }

    // Create user - email_verified defaults to false
    user := &model.User{
        Username: req.Username,
        Email:    req.Email,
        Password: hashedPassword,
        Nickname: req.Nickname,
        Status:   1,
        EmailVerified: false,
    }

    if err := db.Create(user).Error; err != nil {
        return nil, err
    }

    // Create default ledger for user
    ledger := &model.Ledger{
        UserID:    user.ID,
        Name:      "默认账本",
        Icon:      "wallet",
        Color:     "#4CAF50",
        IsDefault: true,
        Status:    1,
    }
    if err := db.Create(ledger).Error; err != nil {
        return nil, err
    }

    // Seed default categories for user
    s.seedDefaultCategories(db, user.ID)

    // Seed default tags for user
    s.seedDefaultTags(db, user.ID)

    // NOTE: Don't generate tokens here - user must verify email first

    return &RegisterResponse{
        Email: user.Email,
    }, nil
}
```

- [ ] **Step 2: Update Register handler**

In `backend/internal/handler/auth.go`, modify Register handler to properly handle errors:

```go
func (h *AuthHandler) Register(c *gin.Context) {
    var req service.RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    resp, err := h.authService.Register(&req)
    if err != nil {
        if errors.Is(err, service.ErrUserExists) {
            response.BadRequest(c, "User already exists")
            return
        }
        response.InternalServerError(c, err.Error())
        return
    }

    // Send verification email - properly handle error
    user, err := h.authService.GetUserByEmail(req.Email)
    if err == nil {
        h.emailService.SendEmailVerification(user.ID, user.Email, user.Nickname)
    }

    response.SuccessWithMessage(c, "Verification email sent. Please check your inbox.", resp)
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd backend && go build ./...`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add backend/internal/service/auth.go backend/internal/handler/auth.go
git commit -m "feat(auth): send verification email on register instead of returning tokens"
```

---

## Task 1b: Backend - Add Email Verified Check to Login

**Files:**
- Modify: `backend/internal/service/auth.go`

**Context:** Users should not be able to login without verifying their email first.

- [ ] **Step 1: Add email verification check in Login function**

In `backend/internal/service/auth.go`, find the `Login` function and add a check after password verification:

```go
func (s *AuthService) Login(req *LoginRequest) (*AuthResponse, error) {
    db := database.GetDB()

    // Find user
    var user model.User
    if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, ErrInvalidCreds
        }
        return nil, err
    }

    // Check password
    if !utils.CheckPassword(req.Password, user.Password) {
        return nil, ErrInvalidCreds
    }

    // Check if email is verified
    if !user.EmailVerified {
        return nil, errors.New("please verify your email before logging in")
    }

    // Check user status
    if user.Status != 1 {
        return nil, errors.New("user account is disabled")
    }

    // ... rest of the function remains the same
```

- [ ] **Step 2: Update handler to return proper error message**

In `backend/internal/handler/auth.go`, update the Login handler to return a user-friendly message:

```go
func (h *AuthHandler) Login(c *gin.Context) {
    var req service.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    resp, err := h.authService.Login(&req)
    if err != nil {
        if errors.Is(err, service.ErrInvalidCreds) {
            response.BadRequest(c, "Invalid email or password")
            return
        }
        // Check for email not verified error
        if err.Error() == "please verify your email before logging in" {
            response.BadRequest(c, "please verify your email before logging in")
            return
        }
        response.InternalServerError(c, err.Error())
        return
    }

    response.Success(c, resp)
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd backend && go build ./...`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add backend/internal/service/auth.go backend/internal/handler/auth.go
git commit -m "feat(auth): require email verification before login"
```

---

## Task 1c: Backend - Fix SendVerification Route (Make it Public)

**Files:**
- Modify: `backend/cmd/server/main.go`

**Context:** The `/auth/send-verification` endpoint is currently protected but should be public so newly registered users can resend verification codes before logging in.

- [ ] **Step 1: Move send-verification from protected to public routes**

In `backend/cmd/server/main.go`, find the auth routes section (around line 66-73) and add send-verification as a public route:

```go
auth := v1.Group("/auth")
{
    auth.POST("/register", authHandler.Register)
    auth.POST("/login", authHandler.Login)
    auth.POST("/refresh", authHandler.Refresh)
    auth.POST("/forgot-password", authHandler.ForgotPassword)
    auth.POST("/reset-password", authHandler.ResetPassword)
    auth.POST("/verify-email", authHandler.VerifyEmail)
    auth.POST("/send-verification", authHandler.SendVerification)  // PUBLIC - moved from protected
}
```

- [ ] **Step 2: Remove send-verification from protected routes**

Find the protected routes section (around line 76-81) and remove `protected.POST("/auth/send-verification", ...)`.

- [ ] **Step 3: Verify compilation**

Run: `cd backend && go build ./...`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add backend/cmd/server/main.go
git commit -m "fix(auth): make send-verification endpoint public"
```

---

## Task 2: Frontend - Add API Methods

**Files:**
- Modify: `frontend/src/services/api.ts:46-60`

- [ ] **Step 1: Add new auth API methods**

In `frontend/src/services/api.ts`, add to the `authApi` object:

```typescript
export const authApi = {
  register: (data: { username: string; email: string; password: string; nickname?: string }) =>
    api.post<{ code: number; message: string; data: { email: string } }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ code: number; message: string; data: AuthResponse }>('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post<{ code: number; message: string; data: AuthResponse }>('/auth/refresh', {
      refresh_token: refreshToken,
    }),

  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refresh_token: refreshToken }),

  // NEW: Email verification
  verifyEmail: (data: { email: string; code: string }) =>
    api.post<{ code: number; message: string; data: null }>('/auth/verify-email', data),

  // NEW: Resend verification email
  sendVerification: (data: { email: string }) =>
    api.post<{ code: number; message: string; data: null }>('/auth/send-verification', data),

  // NEW: Forgot password - request reset code
  forgotPassword: (data: { email: string }) =>
    api.post<{ code: number; message: string; data: null }>('/auth/forgot-password', data),

  // NEW: Reset password with code
  resetPassword: (data: { email: string; code: string; new_password: string }) =>
    api.post<{ code: number; message: string; data: null }>('/auth/reset-password', data),
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat(api): add email verification and password reset API methods"
```

---

## Task 3: Frontend - Add i18n Translations

**Files:**
- Modify: `frontend/src/i18n/locales/en.json`
- Modify: `frontend/src/i18n/locales/zh.json`

- [ ] **Step 1: Add English translations**

Add to `frontend/src/i18n/locales/en.json` under `auth` section:

```json
"auth": {
  "welcomeBack": "Welcome Back",
  "createAccount": "Create Account",
  "enterCredentials": "Enter your credentials to access your account",
  "startTracking": "Start tracking your finances today",
  "email": "Email",
  "password": "Password",
  "username": "Username",
  "nicknameOptional": "Nickname (optional)",
  "signIn": "Sign In",
  "signUp": "Sign up",
  "noAccount": "Don't have an account?",
  "haveAccount": "Already have an account? ",
  "forgotPassword": "Forgot password?",
  "verifyEmail": "Verify Email",
  "verifyEmailDesc": "Please enter the verification code sent to your email.",
  "verificationCode": "Verification Code",
  "verificationCodePlaceholder": "Enter 8-digit code",
  "verifySuccess": "Email verified successfully! Please login.",
  "resendCode": "Resend Code",
  "codeSent": "A new verification code has been sent.",
  "invalidCode": "Invalid or expired code",
  "forgotPasswordTitle": "Reset Password",
  "forgotPasswordDesc": "Enter your email to receive a reset code.",
  "resetCodeSent": "If the email exists, a reset code has been sent.",
  "resetPasswordTitle": "Set New Password",
  "newPassword": "New Password",
  "confirmPassword": "Confirm Password",
  "resetSuccess": "Password has been reset successfully. Please login.",
  "backToLogin": "Back to Login"
}
```

- [ ] **Step 2: Add Chinese translations**

Add to `frontend/src/i18n/locales/zh.json` under `auth` section:

```json
"auth": {
  "welcomeBack": "欢迎回来",
  "createAccount": "创建账户",
  "enterCredentials": "输入您的凭据以访问您的账户",
  "startTracking": "开始记录您的财务",
  "email": "邮箱",
  "password": "密码",
  "username": "用户名",
  "nicknameOptional": "昵称（可选）",
  "signIn": "登录",
  "signUp": "注册",
  "noAccount": "没有账号？",
  "haveAccount": "已有账号？",
  "forgotPassword": "忘记密码？",
  "verifyEmail": "验证邮箱",
  "verifyEmailDesc": "请输入发送到您邮箱的验证码",
  "verificationCode": "验证码",
  "verificationCodePlaceholder": "输入8位验证码",
  "verifySuccess": "邮箱验证成功！请登录。",
  "resendCode": "重新发送验证码",
  "codeSent": "新的验证码已发送。",
  "invalidCode": "验证码无效或已过期",
  "forgotPasswordTitle": "重置密码",
  "forgotPasswordDesc": "输入邮箱地址以接收重置验证码",
  "resetCodeSent": "如果邮箱存在，已发送重置验证码",
  "resetPasswordTitle": "设置新密码",
  "newPassword": "新密码",
  "confirmPassword": "确认密码",
  "resetSuccess": "密码已重置成功。请登录。",
  "backToLogin": "返回登录"
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/i18n/locales/en.json frontend/src/i18n/locales/zh.json
git commit -m "feat(i18n): add email verification and password reset translations"
```

---

## Task 4: Frontend - Create EmailVerificationPage

**Files:**
- Create: `frontend/src/pages/EmailVerificationPage.tsx`

- [ ] **Step 1: Create EmailVerificationPage component**

```tsx
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function EmailVerificationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || code.length !== 8) {
      setError(t('auth.invalidCode'))
      return
    }

    setError('')
    setLoading(true)

    try {
      await authApi.verifyEmail({ email, code })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.invalidCode'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return

    setError('')
    setResendLoading(true)

    try {
      await authApi.sendVerification({ email })
      setError(t('auth.codeSent'))
    } catch {
      setError(t('auth.invalidCode'))
    } finally {
      setResendLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6 text-center">
            <div className="text-green-500 text-lg font-medium">
              {t('auth.verifySuccess')}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t('auth.verifyEmail')}
          </CardTitle>
          <CardDescription>
            {t('auth.verifyEmailDesc')}
          </CardDescription>
          {email && (
            <div className="text-sm text-muted-foreground mt-2">
              {email}
            </div>
          )}
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={t('auth.verificationCodePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                required
                disabled={loading}
                className="text-center text-lg tracking-widest"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || code.length !== 8}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.verifyEmail')}
            </Button>
            <div className="flex justify-between w-full text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-primary flex items-center"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t('auth.backToLogin')}
              </button>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? t('common.loading') : t('auth.resendCode')}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/EmailVerificationPage.tsx
git commit -m "feat(pages): add EmailVerificationPage for email verification flow"
```

---

## Task 5: Frontend - Create ForgotPasswordPage

**Files:**
- Create: `frontend/src/pages/ForgotPasswordPage.tsx`

- [ ] **Step 1: Create ForgotPasswordPage component**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.forgotPassword({ email })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = () => {
    navigate('/reset-password', { state: { email } })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              {t('auth.forgotPasswordTitle')}
            </CardTitle>
            <CardDescription>
              {t('auth.resetCodeSent')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4">
            <Button onClick={handleResetPassword} className="w-full">
              {t('auth.resetPasswordTitle')}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center w-full"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('auth.backToLogin')}
            </button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t('auth.forgotPasswordTitle')}
          </CardTitle>
          <CardDescription>
            {t('auth.forgotPasswordDesc')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.forgotPasswordTitle')}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center w-full"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('auth.backToLogin')}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/ForgotPasswordPage.tsx
git commit -m "feat(pages): add ForgotPasswordPage for password reset request"
```

---

## Task 6: Frontend - Create ResetPasswordPage

**Files:**
- Create: `frontend/src/pages/ResetPasswordPage.tsx`

- [ ] **Step 1: Create ResetPasswordPage component**

```tsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string })?.email || ''

  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordMismatch'))
      return
    }

    if (newPassword.length < 6) {
      setError(t('settings.passwordTooShort'))
      return
    }

    if (code.length !== 8) {
      setError(t('auth.invalidCode'))
      return
    }

    setError('')
    setLoading(true)

    try {
      await authApi.resetPassword({ email, code, new_password: newPassword })
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.invalidCode'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t('auth.resetPasswordTitle')}
          </CardTitle>
          {email && (
            <CardDescription className="text-sm">
              {email}
            </CardDescription>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={t('auth.verificationCodePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                required
                disabled={loading}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={t('auth.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.resetPasswordTitle')}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center w-full"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('auth.backToLogin')}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/ResetPasswordPage.tsx
git commit -m "feat(pages): add ResetPasswordPage for setting new password"
```

---

## Task 7: Frontend - Update LoginPage with Forgot Password Link

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Add forgot password link**

In `LoginPage.tsx`, add a "Forgot password?" link after the password input:

Find the password Input in the form and add a "Forgot password?" link below it:

```tsx
<div className="space-y-2">
  <Input
    type="password"
    placeholder={t('auth.password')}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    disabled={loading}
  />
</div>
{/* Add this forgot password link */}
{isLogin && (
  <div className="flex justify-end">
    <button
      type="button"
      className="text-sm text-primary hover:underline"
      onClick={() => navigate('/forgot-password')}
    >
      {t('auth.forgotPassword')}
    </button>
  </div>
)}
```

Also add `useNavigate` import if not already present:
```tsx
import { useNavigate } from 'react-router-dom'
```

And initialize navigate:
```tsx
const navigate = useNavigate()
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat(pages): add forgot password link to LoginPage"
```

---

## Task 8: Frontend - Add Routes

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add imports for new pages**

Add to the lazy load imports at the top:

```tsx
const EmailVerificationPage = lazy(() => import('@/pages/EmailVerificationPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
```

- [ ] **Step 2: Add routes for new pages**

Add these routes as public routes (outside the ProtectedRoute/AppLayout):

```tsx
<Route path="/login" element={<LoginPage />} />
<Route path="/verify-email" element={<EmailVerificationPage />} />
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(routes): add email verification and password reset routes"
```

---

## Task 9: Frontend - Update Register Flow

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Update LoginPage register flow to redirect to verify-email**

In `LoginPage.tsx`, modify the `handleSubmit` function for the register case:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    if (isLogin) {
      await login(email, password)
      navigate('/')
    } else {
      await register(username, email, password, nickname)
      // After register, redirect to email verification page
      navigate('/verify-email', { state: { email } })
    }
  } catch (err: any) {
    setError(err.response?.data?.message || 'An error occurred')
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat(pages): redirect to verify-email page after register"
```

---

## Task 10: Verify Build

- [ ] **Step 1: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds without errors

- [ ] **Step 2: Run backend build**

Run: `cd backend && go build ./...`
Expected: Build succeeds without errors

---

## Task 9: Frontend - Update Register Flow and AuthContext

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/contexts/AuthContext.tsx`

**Context:** The `register()` function in AuthContext should NOT auto-login after register. The frontend should redirect to the verify-email page instead. No changes to AuthContext are actually needed for the register flow since it just calls authApi.register() and doesn't handle tokens from it - the LoginPage handles the redirect after register.

However, we need to ensure AuthContext's `login()` still works correctly and doesn't try to auto-login with unverified users.

- [ ] **Step 1: Update LoginPage register flow to redirect to verify-email**

In `frontend/src/pages/LoginPage.tsx`, modify the `handleSubmit` function for the register case:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    if (isLogin) {
      await login(email, password)
      navigate('/')
    } else {
      await register(username, email, password, nickname)
      // After register, redirect to email verification page
      navigate('/verify-email?email=' + encodeURIComponent(email))
    }
  } catch (err: any) {
    setError(err.response?.data?.message || 'An error occurred')
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat(pages): redirect to verify-email page after register"
```

---

## Execution Order

1. Task 1: Backend - Modify Register to Send Verification Email
2. Task 1b: Backend - Add Email Verified Check to Login
3. Task 1c: Backend - Fix SendVerification Route (Make it Public)
4. Task 2: Frontend - Add API Methods
5. Task 3: Frontend - Add i18n Translations
6. Task 4: Frontend - Create EmailVerificationPage
7. Task 5: Frontend - Create ForgotPasswordPage
8. Task 6: Frontend - Create ResetPasswordPage
9. Task 7: Frontend - Update LoginPage with Forgot Password Link
10. Task 8: Frontend - Add Routes
11. Task 9: Frontend - Update Register Flow
12. Task 10: Verify Build
