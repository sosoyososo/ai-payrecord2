# Brevo 邮件集成实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 集成 Brevo API，支持密码重置、邮箱验证、登录提醒三种邮件发送

**Architecture:** 创建独立的服务层处理邮件发送，令牌使用 AES-256 加密存储，遵循现有项目模式

**Tech Stack:** Go + Gin + Gorm + Brevo API

---

## 文件结构

```
backend/
├── internal/
│   ├── config/
│   │   └── config.go                    # 修改：添加 Brevo 和 Token 加密配置
│   ├── model/
│   │   └── verification_token.go       # 新建：VerificationToken 模型
│   ├── service/
│   │   ├── email.go                     # 新建：EmailService
│   │   └── token.go                    # 新建：TokenService
│   └── handler/
│       └── auth.go                      # 修改：添加新端点
├── pkg/
│   ├── brevo/
│   │   └── client.go                   # 新建：Brevo API 客户端
│   └── crypto/
│       └── aes.go                      # 新建：AES 加密工具
├── cmd/server/
│   └── main.go                         # 修改：注册新路由、AutoMigrate 新模型
```

---

## Task 1: 配置更新

**Files:**
- Modify: `backend/internal/config/config.go`

- [ ] **Step 1: 在 Config 结构体添加 Brevo 配置**

```go
// 在 Config 结构体中添加:
BreavoAPIKey       string
BreavoSenderEmail  string
BreavoSenderName   string
TokenEncryptionKey string  // 32字节十六进制字符串
```

- [ ] **Step 2: 在 Load() 函数中添加环境变量读取**

```go
BreavoAPIKey:       getEnv("BREVO_API_KEY", ""),
BreavoSenderEmail:  getEnv("BREVO_SENDER_EMAIL", "noreply@example.com"),
BreavoSenderName:   getEnv("BREVO_SENDER_NAME", "AI PayRecord"),
TokenEncryptionKey: getEnv("TOKEN_ENCRYPTION_KEY", ""),
```

- [ ] **Step 3: 提交**

```bash
git add backend/internal/config/config.go
git commit -m "config: add Brevo and token encryption settings"
```

---

## Task 2: AES 加密工具

**Files:**
- Create: `backend/pkg/crypto/aes.go`
- Create: `backend/pkg/crypto/aes_test.go`

- [ ] **Step 1: 创建 AES 加密工具**

```go
package crypto

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/hex"
    "errors"
    "io"
)

var ErrInvalidKey = errors.New("invalid encryption key: must be 32 bytes (64 hex chars)")

func ParseHexKey(keyStr string) ([]byte, error) {
    key, err := hex.DecodeString(keyStr)
    if err != nil || len(key) != 32 {
        return nil, ErrInvalidKey
    }
    return key, nil
}

func Encrypt(plaintext string, key []byte) (string, error) {
    block, err := aes.NewCipher(key)
    if err != nil {
        return "", err
    }

    ciphertext := make([]byte, aes.BlockSize+len(plaintext))
    iv := ciphertext[:aes.BlockSize]
    if _, err := io.ReadFull(rand.Reader, iv); err != nil {
        return "", err
    }

    stream := cipher.NewCFBEncrypter(block, iv)
    stream.XORKeyStream(ciphertext[aes.BlockSize:], []byte(plaintext))

    return hex.EncodeToString(ciphertext), nil
}

func Decrypt(ciphertextHex string, key []byte) (string, error) {
    ciphertext, err := hex.DecodeString(ciphertextHex)
    if err != nil {
        return "", err
    }

    if len(ciphertext) < aes.BlockSize {
        return "", errors.New("ciphertext too short")
    }

    iv := ciphertext[:aes.BlockSize]
    ciphertext = ciphertext[aes.BlockSize:]

    block, err := aes.NewCipher(key)
    if err != nil {
        return "", err
    }

    stream := cipher.NewCFBDecrypter(block, iv)
    stream.XORKeyStream(ciphertext, ciphertext)

    return string(ciphertext), nil
}
```

- [ ] **Step 2: 编写测试**

```go
package crypto

import (
    "testing"
)

func TestEncryptDecrypt(t *testing.T) {
    key := "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    keyBytes, err := ParseHexKey(key)
    if err != nil {
        t.Fatalf("ParseHexKey failed: %v", err)
    }

    plaintext := "12345678"

    encrypted, err := Encrypt(plaintext, keyBytes)
    if err != nil {
        t.Fatalf("Encrypt failed: %v", err)
    }

    if encrypted == plaintext {
        t.Error("Encrypted should differ from plaintext")
    }

    decrypted, err := Decrypt(encrypted, keyBytes)
    if err != nil {
        t.Fatalf("Decrypt failed: %v", err)
    }

    if decrypted != plaintext {
        t.Errorf("Decrypt mismatch: got %s, want %s", decrypted, plaintext)
    }
}

func TestInvalidKey(t *testing.T) {
    _, err := ParseHexKey("too-short")
    if err != ErrInvalidKey {
        t.Errorf("Expected ErrInvalidKey, got %v", err)
    }
}
```

- [ ] **Step 3: 运行测试**

```bash
cd backend && go test ./pkg/crypto/... -v
```

- [ ] **Step 4: 提交**

```bash
git add backend/pkg/crypto/aes.go backend/pkg/crypto/aes_test.go
git commit -m "pkg/crypto: add AES encryption for token storage"
```

---

## Task 3: Brevo API 客户端

**Files:**
- Create: `backend/pkg/brevo/client.go`
- Create: `backend/pkg/brevo/client_test.go`

- [ ] **Step 1: 创建 Brevo 客户端**

```go
package brevo

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type Client struct {
    apiKey    string
    senderEmail string
    senderName  string
    client    *http.Client
}

type EmailRequest struct {
    Sender    Sender    `json:"sender"`
    To        []Recipient `json:"to"`
    Subject   string    `json:"subject"`
    Text      string    `json:"text"`
}

type Sender struct {
    Email string `json:"email"`
    Name  string `json:"name"`
}

type Recipient struct {
    Email string `json:"email"`
    Name  string `json:"name,omitempty"`
}

func NewClient(apiKey, senderEmail, senderName string) *Client {
    return &Client{
        apiKey:      apiKey,
        senderEmail: senderEmail,
        senderName:  senderName,
        client: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

func (c *Client) SendEmail(toEmail, toName, subject, text string) error {
    req := EmailRequest{
        Sender: Sender{
            Email: c.senderEmail,
            Name:  c.senderName,
        },
        To: []Recipient{
            {Email: toEmail, Name: toName},
        },
        Subject: subject,
        Text:    text,
    }

    body, err := json.Marshal(req)
    if err != nil {
        return fmt.Errorf("failed to marshal request: %w", err)
    }

    httpReq, err := http.NewRequest("POST", "https://api.brevo.com/api.v3/smtp/email", bytes.NewReader(body))
    if err != nil {
        return fmt.Errorf("failed to create request: %w", err)
    }

    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("api-key", c.apiKey)

    resp, err := c.client.Do(httpReq)
    if err != nil {
        return fmt.Errorf("failed to send request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return fmt.Errorf("brevo API error: status %d", resp.StatusCode)
    }

    return nil
}
```

- [ ] **Step 2: 编写测试（mock http）**

```go
package brevo

import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestSendEmail(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.Header.Get("api-key") != "test-key" {
            t.Error("Missing or invalid api-key header")
        }
        w.WriteHeader(http.StatusOK)
    }))
    defer server.Close()

    // 注意：实际测试中需要 mock 发送地址
    _ = server
}
```

- [ ] **Step 3: 提交**

```bash
git add backend/pkg/brevo/client.go
git commit -m "pkg/brevo: add Brevo API client for transactional emails"
```

---

## Task 4: VerificationToken 模型

**Files:**
- Create: `backend/internal/model/verification_token.go`

- [ ] **Step 1: 创建模型**

```go
package model

import (
    "time"
)

type VerificationToken struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    CreatedAt time.Time `json:"created_at"`
    UserID    uint      `gorm:"index;not null" json:"user_id"`
    Type      string    `gorm:"size:50;not null" json:"type"` // "password_reset" | "email_verification"
    Code      string    `gorm:"size:255;not null" json:"code"` // AES 加密存储
    ExpiresAt time.Time `gorm:"index;not null" json:"expires_at"`
    Used      bool      `gorm:"default:false" json:"used"`
}

func (VerificationToken) TableName() string {
    return "verification_tokens"
}
```

- [ ] **Step 2: 提交**

```bash
git add backend/internal/model/verification_token.go
git commit -m "model: add VerificationToken for password reset and email verification"
```

---

## Task 5: TokenService

**Files:**
- Create: `backend/internal/service/token.go`
- Create: `backend/internal/service/token_test.go`

- [ ] **Step 1: 创建 TokenService**

```go
package service

import (
    "crypto/rand"
    "encoding/hex"
    "errors"
    "fmt"
    "math/big"
    "time"

    "github.com/karsa/ai-payrecord2/backend/internal/model"
    "github.com/karsa/ai-payrecord2/backend/pkg/crypto"
    "github.com/karsa/ai-payrecord2/backend/pkg/database"
)

var (
    ErrTokenNotFound   = errors.New("token not found")
    ErrTokenExpired    = errors.New("token has expired")
    ErrTokenUsed       = errors.New("token has already been used")
    ErrTokenInvalid    = errors.New("invalid token")
    ErrTokenMismatch   = errors.New("token does not match")
    ErrInvalidKey      = errors.New("encryption key not configured")
)

const (
    TokenTypePasswordReset    = "password_reset"
    TokenTypeEmailVerification = "email_verification"
)

type TokenService struct {
    encryptionKey []byte
}

func NewTokenService(encryptionKey string) (*TokenService, error) {
    if encryptionKey == "" {
        return nil, ErrInvalidKey
    }
    key, err := crypto.ParseHexKey(encryptionKey)
    if err != nil {
        return nil, err
    }
    return &TokenService{encryptionKey: key}, nil
}

func (s *TokenService) GenerateCode() (string, error) {
    code, err := rand.Int(rand.Reader, big.NewInt(100000000))
    if err != nil {
        return "", fmt.Errorf("failed to generate code: %w", err)
    }
    return fmt.Sprintf("%08d", code.Int64()), nil
}

func (s *TokenService) GenerateAndStore(userID uint, tokenType string, expiry time.Duration) (*model.VerificationToken, error) {
    code, err := s.GenerateCode()
    if err != nil {
        return nil, err
    }

    encryptedCode, err := crypto.Encrypt(code, s.encryptionKey)
    if err != nil {
        return nil, fmt.Errorf("failed to encrypt code: %w", err)
    }

    token := &model.VerificationToken{
        UserID:    userID,
        Type:      tokenType,
        Code:      encryptedCode,
        ExpiresAt: time.Now().Add(expiry),
        Used:      false,
    }

    db := database.GetDB()
    if err := db.Create(token).Error; err != nil {
        return nil, fmt.Errorf("failed to store token: %w", err)
    }

    // 返回未加密的 code 用于发送
    token.Code = code
    return token, nil
}

func (s *TokenService) Validate(userID uint, tokenType, code string) (*model.VerificationToken, error) {
    db := database.GetDB()

    var tokens []model.VerificationToken
    if err := db.Where("user_id = ? AND type = ? AND used = false", userID, tokenType).
        Order("created_at DESC").
        Find(&tokens).Error; err != nil {
        return nil, fmt.Errorf("database error: %w", err)
    }

    if len(tokens) == 0 {
        return nil, ErrTokenNotFound
    }

    // 找到最新的未使用 token 并验证
    for _, token := range tokens {
        if time.Now().After(token.ExpiresAt) {
            continue // 跳过过期的
        }

        decrypted, err := crypto.Decrypt(token.Code, s.encryptionKey)
        if err != nil {
            continue
        }

        if decrypted == code {
            return &token, nil
        }
    }

    return nil, ErrTokenInvalid
}

func (s *TokenService) MarkUsed(tokenID uint) error {
    db := database.GetDB()
    return db.Model(&model.VerificationToken{}).Where("id = ?", tokenID).Update("used", true).Error
}

func (s *TokenService) CleanupExpired() (int64, error) {
    db := database.GetDB()
    result := db.Where("expires_at < ? AND used = false", time.Now()).Delete(&model.VerificationToken{})
    return result.RowsAffected, result.Error
}
```

- [ ] **Step 2: 编写测试**

```go
package service

import (
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
)

func TestTokenService_GenerateCode(t *testing.T) {
    svc, err := NewTokenService("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
    assert.NoError(t, err)

    code, err := svc.GenerateCode()
    assert.NoError(t, err)
    assert.Len(t, code, 8)
}

func TestTokenService_InvalidKey(t *testing.T) {
    _, err := NewTokenService("too-short")
    assert.Error(t, err)
    assert.Equal(t, ErrInvalidKey, err)
}
```

- [ ] **Step 3: 运行测试**

```bash
cd backend && go test ./internal/service/token_test.go -v -run TestTokenService
```

- [ ] **Step 4: 提交**

```bash
git add backend/internal/service/token.go backend/internal/service/token_test.go
git commit -m "service: add TokenService for verification code management"
```

---

## Task 6: EmailService

**Files:**
- Create: `backend/internal/service/email.go`
- Create: `backend/internal/service/email_test.go`

- [ ] **Step 1: 创建 EmailService**

```go
package service

import (
    "fmt"
    "log"

    "github.com/karsa/ai-payrecord2/backend/internal/config"
    "github.com/karsa/ai-payrecord2/backend/pkg/brevo"
)

type EmailService struct {
    client     *brevo.Client
    tokenSvc   *TokenService
}

func NewEmailService(tokenSvc *TokenService) *EmailService {
    client := brevo.NewClient(
        config.AppConfig.BreavoAPIKey,
        config.AppConfig.BreavoSenderEmail,
        config.AppConfig.BreavoSenderName,
    )
    return &EmailService{
        client:   client,
        tokenSvc: tokenSvc,
    }
}

func (s *EmailService) SendPasswordResetEmail(userEmail, userName string) (string, error) {
    token, err := s.tokenSvc.GenerateAndStore(0, TokenTypePasswordReset, 15*time.Minute)
    if err != nil {
        return "", fmt.Errorf("failed to generate token: %w", err)
    }

    subject := "Password Reset Code"
    body := fmt.Sprintf(`You have requested a password reset for your account.

Your verification code is: %s

This code will expire in 15 minutes.

If you did not request this, please ignore this email.`, token.Code)

    if err := s.client.SendEmail(userEmail, userName, subject, body); err != nil {
        log.Printf("Failed to send password reset email to %s: %v", userEmail, err)
        return "", fmt.Errorf("failed to send email")
    }

    return token.Code, nil
}

func (s *EmailService) SendEmailVerification(userID uint, userEmail, userName string) (string, error) {
    token, err := s.tokenSvc.GenerateAndStore(userID, TokenTypeEmailVerification, 24*time.Hour)
    if err != nil {
        return "", fmt.Errorf("failed to generate token: %w", err)
    }

    subject := "Email Verification"
    body := fmt.Sprintf(`Welcome! Please verify your email address.

Your verification code is: %s

This code will expire in 24 hours.

If you did not create an account, please ignore this email.`, token.Code)

    if err := s.client.SendEmail(userEmail, userName, subject, body); err != nil {
        log.Printf("Failed to send verification email to %s: %v", userEmail, err)
        return "", fmt.Errorf("failed to send email")
    }

    return token.Code, nil
}

func (s *EmailService) SendLoginAlert(userEmail, userName, loginTime, location, device string) error {
    subject := "New Device Login Alert"
    body := fmt.Sprintf(`We noticed a new sign-in to your account.

Time: %s
Location: %s
Device: %s

If this was you, you can ignore this email.
If this wasn't you, please secure your account immediately.`, loginTime, location, device)

    if err := s.client.SendEmail(userEmail, userName, subject, body); err != nil {
        log.Printf("Failed to send login alert email to %s: %v", userEmail, err)
        return fmt.Errorf("failed to send email")
    }

    return nil
}
```

> 注意：需要添加 `"time"` import 和实际的用户 ID 关联逻辑

- [ ] **Step 2: 提交**

```bash
git add backend/internal/service/email.go
git commit -m "service: add EmailService for Brevo email integration"
```

---

## Task 7: Auth Handler 新端点

**Files:**
- Modify: `backend/internal/handler/auth.go`

- [ ] **Step 1: 添加新请求结构体和方法**

```go
// 在文件顶部添加:
"time"

// 添加请求结构体:
type ForgotPasswordRequest struct {
    Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
    Email       string `json:"email" binding:"required,email"`
    Code        string `json:"code" binding:"required,len=8"`
    NewPassword string `json:"new_password" binding:"required,min=6"`
}

type VerifyEmailRequest struct {
    Email string `json:"email" binding:"required,email"`
    Code  string `json:"code" binding:"required,len=8"`
}

type SendVerificationRequest struct {
    Email string `json:"email" binding:"required,email"`
}

// 在 AuthHandler 结构体添加:
emailService *service.EmailService

// 在 NewAuthHandler 添加:
func NewAuthHandler() *AuthHandler {
    return &AuthHandler{
        authService:  service.NewAuthService(),
        emailService: service.NewEmailService(), // TODO: 需要传入 tokenSvc
    }
}

// 添加新方法:
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
    var req ForgotPasswordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    // 查找用户
    user, err := h.authService.GetUserByEmail(req.Email)
    if err != nil {
        // 返回通用消息防止用户枚举
        response.SuccessWithMessage(c, "If the email exists, a reset code has been sent.", nil)
        return
    }

    _, err = h.emailService.SendPasswordResetEmail(user.Email, user.Nickname)
    if err != nil {
        response.InternalServerError(c, "Failed to send email")
        return
    }

    response.SuccessWithMessage(c, "If the email exists, a reset code has been sent.", nil)
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
    var req ResetPasswordRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    // 获取用户
    user, err := h.authService.GetUserByEmail(req.Email)
    if err != nil {
        response.BadRequest(c, "Invalid code")
        return
    }

    // 验证 token
    token, err := h.emailService.ValidateToken(user.ID, service.TokenTypePasswordReset, req.Code)
    if err != nil {
        switch err {
        case service.ErrTokenNotFound, service.ErrTokenInvalid:
            response.BadRequest(c, "Invalid code")
        case service.ErrTokenExpired:
            response.BadRequest(c, "Code has expired")
        case service.ErrTokenUsed:
            response.BadRequest(c, "Code has already been used")
        default:
            response.InternalServerError(c, err.Error())
        }
        return
    }

    // 更新密码
    if err := h.authService.UpdatePassword(user.ID, req.NewPassword); err != nil {
        response.InternalServerError(c, err.Error())
        return
    }

    // 标记 token 已使用
    h.emailService.MarkTokenUsed(token.ID)

    response.SuccessWithMessage(c, "Password has been reset successfully.", nil)
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
    var req VerifyEmailRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.BadRequest(c, err.Error())
        return
    }

    user, err := h.authService.GetUserByEmail(req.Email)
    if err != nil {
        response.BadRequest(c, "Invalid code")
        return
    }

    token, err := h.emailService.ValidateToken(user.ID, service.TokenTypeEmailVerification, req.Code)
    if err != nil {
        response.BadRequest(c, "Invalid code")
        return
    }

    if err := h.authService.MarkEmailVerified(user.ID); err != nil {
        response.InternalServerError(c, err.Error())
        return
    }

    h.emailService.MarkTokenUsed(token.ID)

    response.SuccessWithMessage(c, "Email verified successfully.", nil)
}
```

> **注意**：实际实现需要调整 EmailService 接口和 AuthService 方法

- [ ] **Step 2: 提交**

```bash
git add backend/internal/handler/auth.go
git commit -m "handler: add forgot-password, reset-password, verify-email endpoints"
```

---

## Task 8: 路由注册

**Files:**
- Modify: `backend/cmd/server/main.go`

- [ ] **Step 1: 添加新路由**

```go
// 在 auth.go 路由组中添加:
auth.POST("/forgot-password", authHandler.ForgotPassword)
auth.POST("/reset-password", authHandler.ResetPassword)
auth.POST("/verify-email", authHandler.VerifyEmail)

// 在 protected 路由组中添加:
protected.POST("/send-verification", authHandler.SendVerification)
```

- [ ] **Step 2: 添加 AutoMigrate**

```go
// 在 AutoMigrate 中添加:
&model.VerificationToken{},
```

- [ ] **Step 3: 提交**

```bash
git add backend/cmd/server/main.go
git commit -m "server: register email auth routes and migrate VerificationToken"
```

---

## Task 9: 集成测试

**Files:**
- Create: `backend/internal/test/email_integration_test.go`

- [ ] **Step 1: 编写集成测试**

```go
package test

import (
    "testing"
    "time"

    "github.com/karsa/ai-payrecord2/backend/internal/service"
    "github.com/karsa/ai-payrecord2/backend/pkg/database"
    "github.com/stretchr/testify/assert"
)

func setupTokenService(t *testing.T) *service.TokenService {
    database.Init()
    svc, err := service.NewTokenService("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
    assert.NoError(t, err)
    return svc
}

func TestTokenService_GenerateAndValidate(t *testing.T) {
    svc := setupTokenService(t)

    // 生成 token
    token, err := svc.GenerateAndStore(1, service.TokenTypePasswordReset, 15*time.Minute)
    assert.NoError(t, err)
    assert.NotEmpty(t, token.Code)

    // 验证 code
    validated, err := svc.Validate(1, service.TokenTypePasswordReset, token.Code)
    assert.NoError(t, err)
    assert.Equal(t, token.ID, validated.ID)

    // 验证后标记已使用
    err = svc.MarkUsed(token.ID)
    assert.NoError(t, err)
}
```

- [ ] **Step 2: 运行测试**

```bash
cd backend && go test ./internal/test/... -v -run TestTokenService
```

- [ ] **Step 3: 提交**

```bash
git add backend/internal/test/email_integration_test.go
git commit -m "test: add email service integration tests"
```

---

## 执行顺序

1. Task 1: 配置更新
2. Task 2: AES 加密工具
3. Task 3: Brevo API 客户端
4. Task 4: VerificationToken 模型
5. Task 5: TokenService
6. Task 6: EmailService
7. Task 7: Auth Handler 新端点
8. Task 8: 路由注册
9. Task 9: 集成测试
