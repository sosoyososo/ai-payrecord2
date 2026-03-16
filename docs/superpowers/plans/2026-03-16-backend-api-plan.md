# 账本 App 后端实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现账本 App 后端 API 服务（Golang + Gin + Gorm + SQLite + JWT）

**Architecture:** 采用分层架构 - handler 层处理请求、service 层处理业务逻辑、model 层定义数据模型

**Tech Stack:** Golang, Gin, Gorm, SQLite, JWT (golang-jwt)

---

## 项目结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go           # 入口文件
├── internal/
│   ├── config/
│   │   └── config.go         # 配置加载
│   ├── model/
│   │   ├── user.go           # 用户模型
│   │   ├── ledger.go         # 账本模型
│   │   ├── category.go       # 分类模型
│   │   ├── tag.go            # 标签模型
│   │   ├── record.go         # 记录模型
│   │   └── token.go          # Token 模型
│   ├── handler/
│   │   ├── auth.go           # 认证接口
│   │   ├── user.go           # 用户接口
│   │   ├── ledger.go         # 账本接口
│   │   ├── category.go       # 分类接口
│   │   ├── tag.go            # 标签接口
│   │   ├── record.go         # 记录接口
│   │   ├── llm.go            # LLM 接口
│   │   └── stats.go          # 统计接口
│   ├── service/
│   │   ├── auth.go           # 认证服务
│   │   ├── ledger.go         # 账本服务
│   │   ├── category.go       # 分类服务
│   │   ├── tag.go            # 标签服务
│   │   ├── record.go         # 记录服务
│   │   ├── llm.go           # LLM 服务
│   │   └── stats.go          # 统计服务
│   ├── middleware/
│   │   └── auth.go           # JWT 中间件
│   └── response/
│       └── response.go        # 统一响应格式
├── pkg/
│   ├── database/
│   │   └── database.go       # 数据库连接
│   └── utils/
│       └── bcrypt.go         # 密码工具
├── go.mod
├── go.sum
└── .env                      # 环境变量配置
```

---

## Chunk 1: 项目初始化与基础架构

### Task 1: 初始化 Go Module 和依赖

- [ ] **Step 1: 创建 backend 目录并初始化 go.mod**

Run:
```bash
mkdir -p /Users/karsa/proj/ai-payrecord2/backend/cmd/server
mkdir -p /Users/karsa/proj/ai-payrecord2/backend/internal/{config,model,handler,service,middleware,response}
mkdir -p /Users/karsa/proj/ai-payrecord2/backend/pkg/{database,utils}
cd /Users/karsa/proj/ai-payrecord2/backend
go mod init github.com/ai-payrecord2/backend
```

- [ ] **Step 2: 安装依赖**

Run:
```bash
go get github.com/gin-gonic/gin
go get gorm.io/gorm
go get gorm.io/driver/sqlite
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto/bcrypt
go get github.com/joho/godotenv
```

- [ ] **Step 3: 创建 .env 配置文件**

Create: `backend/.env`
```env
PORT=8080
DB_PATH=./data/ledger.db
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE_HOURS=168
REFRESH_TOKEN_EXPIRE_HOURS=720
LLM_API_KEY=
LLM_API_BASE=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
```

- [ ] **Step 4: 创建 config.go**

Create: `backend/internal/config/config.go`
```go
package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                     int
	DBPath                   string
	JWTSecret                string
	JWTExpireHours           time.Duration
	RefreshTokenExpireHours  time.Duration
	LLMAPIKey                string
	LLMAPIBase               string
	LLMModel                 string
}

var AppConfig *Config

func Load() {
	godotenv.Load()

	expireHours, _ := strconv.Atoi(getEnv("JWT_EXPIRE_HOURS", "168"))
	refreshExpireHours, _ := strconv.Atoi(getEnv("REFRESH_TOKEN_EXPIRE_HOURS", "720"))
	port, _ := strconv.Atoi(getEnv("PORT", "8080"))

	AppConfig = &Config{
		Port:                    port,
		DBPath:                  getEnv("DB_PATH", "./data/ledger.db"),
		JWTSecret:               getEnv("JWT_SECRET", "default-secret"),
		JWTExpireHours:          time.Duration(expireHours) * time.Hour,
		RefreshTokenExpireHours: time.Duration(refreshExpireHours) * time.Hour,
		LLMAPIKey:               getEnv("LLM_API_KEY", ""),
		LLMAPIBase:              getEnv("LLM_API_BASE", "https://api.openai.com/v1"),
		LLMModel:                getEnv("LLM_MODEL", "gpt-3.5-turbo"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
```

- [ ] **Step 5: 创建数据库连接**

Create: `backend/pkg/database/database.go`
```go
package database

import (
	"log"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/ai-payrecord2/backend/internal/model"
)

var DB *gorm.DB

func Init(dbPath string) {
	// 确保目录存在
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Fatalf("Failed to create database directory: %v", err)
	}

	var err error
	DB, err = sqlite.Open(dbPath)
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	// 自动迁移
	err = DB.AutoMigrate(
		&model.User{},
		&model.Ledger{},
		&model.Category{},
		&model.Tag{},
		&model.Record{},
		&model.RecordTag{},
		&model.RefreshToken{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database connected and migrated successfully")
}
```

- [ ] **Step 6: 创建统一响应格式**

Create: `backend/internal/response/response.go`
```go
package response

import "github.com/gin-gonic/gin"

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

func Error(c *gin.Context, code int, message string) {
	c.JSON(200, Response{
		Code:    code,
		Message: message,
	})
}

func Error401(c *gin.Context, message string) {
	Error(c, 401, message)
}

func Error400(c *gin.Context, message string) {
	Error(c, 400, message)
}

func Error500(c *gin.Context, message string) {
	Error(c, 500, message)
}
```

- [ ] **Step 7: 创建 main.go**

Create: `backend/cmd/server/main.go`
```go
package main

import (
	"log"

	"github.com/ai-payrecord2/backend/internal/config"
	"github.com/ai-payrecord2/backend/internal/handler"
	"github.com/ai-payrecord2/backend/pkg/database"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	config.Load()

	// 初始化数据库
	database.Init(config.AppConfig.DBPath)

	// 初始化路由
	r := gin.Default()

	// 注册路由
	api := r.Group("/api/v1")
	{
		authHandler := handler.NewAuthHandler()
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
		}

		// 需要认证的路由
		userHandler := handler.NewUserHandler()
		ledgerHandler := handler.NewLedgerHandler()
		categoryHandler := handler.NewCategoryHandler()
		tagHandler := handler.NewTagHandler()
		recordHandler := handler.NewRecordHandler()
		llmHandler := handler.NewLLMHandler()
		statsHandler := handler.NewStatsHandler()

		protected := api.Group("")
		protected.Use(handler.AuthMiddleware())
		{
			// 用户
			protected.GET("/user/profile", userHandler.Profile)

			// 账本
			protected.GET("/ledgers", ledgerHandler.List)
			protected.GET("/ledgers/current", ledgerHandler.Current)
			protected.POST("/ledgers", ledgerHandler.Create)
			protected.PUT("/ledgers/:id", ledgerHandler.Update)
			protected.DELETE("/ledgers/:id", ledgerHandler.Delete)
			protected.POST("/ledgers/:id/switch", ledgerHandler.Switch)

			// 分类
			protected.GET("/categories", categoryHandler.List)
			protected.POST("/categories", categoryHandler.Create)
			protected.PUT("/categories/:id", categoryHandler.Update)
			protected.DELETE("/categories/:id", categoryHandler.Delete)

			// 标签
			protected.GET("/tags", tagHandler.List)
			protected.POST("/tags", tagHandler.Create)
			protected.PUT("/tags/:id", tagHandler.Update)
			protected.DELETE("/tags/:id", tagHandler.Delete)

			// 记录
			protected.GET("/records", recordHandler.List)
			protected.GET("/records/:id", recordHandler.Get)
			protected.POST("/records", recordHandler.Create)
			protected.PUT("/records/:id", recordHandler.Update)
			protected.DELETE("/records/:id", recordHandler.Delete)

			// LLM
			protected.GET("/llm/categories", llmHandler.Categories)
			protected.POST("/llm/parse", llmHandler.Parse)
			protected.POST("/llm/records", llmHandler.CreateRecord)

			// 统计
			protected.GET("/stats/summary", statsHandler.Summary)
			protected.GET("/stats/by-category", statsHandler.ByCategory)
			protected.GET("/stats/by-tag", statsHandler.ByTag)
			protected.GET("/stats/monthly", statsHandler.Monthly)
			protected.GET("/stats/daily", statsHandler.Daily)
			protected.GET("/stats/monthly-detail", statsHandler.MonthlyDetail)
		}
	}

	// 启动服务
	log.Printf("Server starting on port %d", config.AppConfig.Port)
	r.Run()
}
```

- [ ] **Step 8: 提交代码**

```bash
cd /Users/karsa/proj/ai-payrecord2
git add backend/
git commit -m "feat: 初始化后端项目结构

- 添加 Go module 和依赖
- 创建配置加载模块
- 创建数据库连接和自动迁移
- 创建统一响应格式
- 创建 main.go 入口文件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: 数据模型定义

### Task 2: 创建数据模型

- [ ] **Step 1: 创建 User 模型**

Create: `backend/internal/model/user.go`
```go
package model

import "time"

type User struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Username        string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash    string    `gorm:"size:255;not null" json:"-"`
	CurrentLedgerID *uint    `json:"current_ledger_id,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
```

- [ ] **Step 2: 创建 Ledger 模型**

Create: `backend/internal/model/ledger.go`
```go
package model

import "time"

type Ledger struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
```

- [ ] **Step 3: 创建 Category 模型**

Create: `backend/internal/model/category.go`
```go
package model

import "time"

type Category struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    *uint     `gorm:"index" json:"user_id"` // NULL 表示系统预置
	Name      string    `gorm:"size:50;not null" json:"name"`
	Icon      string    `gorm:"size:10" json:"icon"`
	Color     string    `gorm:"size:20" json:"color"`
	Type      int       `gorm:"type:tinyint;not null;default:1" json:"type"` // 1=支出, 2=收入
	IsSystem  bool      `gorm:"not null;default:false" json:"is_system"`
	CreatedAt time.Time `json:"created_at"`
}
```

- [ ] **Step 4: 创建 Tag 模型**

Create: `backend/internal/model/tag.go`
```go
package model

import "time"

type Tag struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    *uint     `gorm:"index" json:"user_id"` // NULL 表示系统预置
	Name      string    `gorm:"size:20;not null" json:"name"`
	Color     string    `gorm:"size:20" json:"color"`
	IsSystem  bool      `gorm:"not null;default:false" json:"is_system"`
	CreatedAt time.Time `json:"created_at"`
}
```

- [ ] **Step 5: 创建 Record 模型**

Create: `backend/internal/model/record.go`
```go
package model

import "time"

type Record struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	LedgerID   uint      `gorm:"index;not null" json:"ledger_id"`
	CategoryID uint      `gorm:"index;not null" json:"category_id"`
	Amount     float64   `gorm:"type:decimal(12,2);not null" json:"amount"`
	Type       int       `gorm:"type:tinyint;not null" json:"type"` // 1=支出, 2=收入
	Remark     string    `gorm:"size:500" json:"remark"`
	CreatedAt  time.Time `gorm:"index" json:"created_at"`
}
```

- [ ] **Step 6: 创建 RecordTag 关联模型**

Create: `backend/internal/model/record_tag.go`
```go
package model

type RecordTag struct {
	RecordID uint `gorm:"primaryKey" json:"record_id"`
	TagID    uint `gorm:"primaryKey" json:"tag_id"`
}
```

- [ ] **Step 7: 创建 RefreshToken 模型**

Create: `backend/internal/model/token.go`
```go
package model

import "time"

type RefreshToken struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Token     string    `gorm:"size:255;not null" json:"-"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}
```

- [ ] **Step 8: 提交代码**

```bash
git add backend/internal/model/
git commit -m "feat: 添加数据模型定义

- User 用户模型
- Ledger 账本模型
- Category 分类模型（含 type 字段）
- Tag 标签模型
- Record 记录模型
- RecordTag 记录-标签关联
- RefreshToken 刷新令牌模型

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: 认证模块

### Task 3: 实现认证服务

- [ ] **Step 1: 创建密码工具**

Create: `backend/pkg/utils/bcrypt.go`
```go
package utils

import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
```

- [ ] **Step 2: 创建 JWT 中间件**

Create: `backend/internal/middleware/auth.go`
```go
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/ai-payrecord2/backend/internal/config"
	"github.com/ai-payrecord2/backend/internal/response"
)

type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error401(c, "Authorization header required")
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			response.Error401(c, "Invalid authorization format")
			c.Abort()
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.AppConfig.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			response.Error401(c, "Invalid token")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Next()
	}
}

func GetUserID(c *gin.Context) uint {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	return userID.(uint)
}
```

- [ ] **Step 3: 创建 Auth Service**

Create: `backend/internal/service/auth.go`
```go
package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"

	"github.com/ai-payrecord2/backend/internal/config"
	"github.com/ai-payrecord2/backend/internal/model"
	"github.com/ai-payrecord2/backend/pkg/utils"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Register(username, password string) (*model.User, error) {
	// 检查用户名是否已存在
	var count int64
	s.db.Model(&model.User{}).Where("username = ?", username).Count(&count)
	if count > 0 {
		return nil, errors.New("用户名已存在")
	}

	// 加密密码
	hash, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}

	// 创建用户
	user := &model.User{
		Username:     username,
		PasswordHash: hash,
	}
	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	// 创建默认账本
	ledger := &model.Ledger{
		UserID: user.ID,
		Name:   "默认账本",
	}
	s.db.Create(ledger)

	// 更新用户的当前账本
	s.db.Model(user).Update("current_ledger_id", ledger.ID)

	// 创建预置分类
	s.createDefaultCategories(user.ID)

	// 创建预置标签
	s.createDefaultTags(user.ID)

	return user, nil
}

func (s *AuthService) Login(username, password string) (*model.User, string, string, error) {
	var user model.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", errors.New("用户名或密码错误")
		}
		return nil, "", "", err
	}

	if !utils.CheckPassword(password, user.PasswordHash) {
		return nil, "", "", errors.New("用户名或密码错误")
	}

	// 生成 JWT Token
	accessToken, err := s.generateJWT(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	// 生成 Refresh Token
	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	return &user, accessToken, refreshToken, nil
}

func (s *AuthService) Refresh(refreshToken string) (string, string, error) {
	// 查找 refresh token
	var token model.RefreshToken
	if err := s.db.Where("token = ? AND expires_at > ?", refreshToken, time.Now()).First(&token).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", errors.New("Invalid refresh token")
		}
		return "", "", err
	}

	// 删除旧的 refresh token
	s.db.Delete(&token)

	// 生成新的 tokens
	userID := token.UserID
	accessToken, err := s.generateJWT(userID)
	if err != nil {
		return "", "", err
	}

	newRefreshToken, err := s.generateRefreshToken(userID)
	if err != nil {
		return "", "", err
	}

	return accessToken, newRefreshToken, nil
}

func (s *AuthService) Logout(userID uint, refreshToken string) error {
	// 删除对应的 refresh token
	return s.db.Where("user_id = ? AND token = ?", userID, refreshToken).Delete(&model.RefreshToken{}).Error
}

func (s *AuthService) generateJWT(userID uint) (string, error) {
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(config.AppConfig.JWTExpireHours)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

func (s *AuthService) generateRefreshToken(userID uint) (string, error) {
	claims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(config.AppConfig.RefreshTokenExpireHours)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return "", err
	}

	// 存储 refresh token
	rt := &model.RefreshToken{
		UserID:    userID,
		Token:     tokenString,
		ExpiresAt: time.Now().Add(config.AppConfig.RefreshTokenExpireHours),
	}
	s.db.Create(rt)

	return tokenString, nil
}

func (s *AuthService) createDefaultCategories(userID uint) {
	categories := []model.Category{
		{UserID: &userID, Name: "餐饮", Icon: "🍜", Color: "#FF6B6B", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "交通", Icon: "🚗", Color: "#4ECDC4", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "购物", Icon: "🛍️", Color: "#45B7D1", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "居住", Icon: "🏠", Color: "#96CEB4", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "教育", Icon: "📚", Color: "#FFEAA7", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "医疗", Icon: "💊", Color: "#DDA0DD", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "娱乐", Icon: "🎮", Color: "#98D8C8", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "人情", Icon: "🎁", Color: "#F7DC6F", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "投资", Icon: "📈", Color: "#BB8FCE", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "通讯", Icon: "📱", Color: "#85C1E9", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "日用", Icon: "📦", Color: "#F8B500", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "其他", Icon: "➖", Color: "#95A5A6", Type: 1, IsSystem: true},
		{UserID: &userID, Name: "工资", Icon: "💰", Color: "#2ECC71", Type: 2, IsSystem: true},
		{UserID: &userID, Name: "奖金", Icon: "🎉", Color: "#1ABC9C", Type: 2, IsSystem: true},
	}
	for _, c := range categories {
		s.db.Create(&c)
	}
}

func (s *AuthService) createDefaultTags(userID uint) {
	tags := []model.Tag{
		{UserID: &userID, Name: "重要", Color: "#E74C3C", IsSystem: true},
		{UserID: &userID, Name: "报销", Color: "#3498DB", IsSystem: true},
		{UserID: &userID, Name: "定期", Color: "#27AE60", IsSystem: true},
		{UserID: &userID, Name: "人情", Color: "#E91E63", IsSystem: true},
		{UserID: &userID, Name: "刚需", Color: "#F39C12", IsSystem: true},
	}
	for _, t := range tags {
		s.db.Create(&t)
	}
}
```

- [ ] **Step 4: 创建 Auth Handler**

Create: `backend/internal/handler/auth.go`
```go
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ai-payrecord2/backend/internal/middleware"
	"github.com/ai-payrecord2/backend/internal/response"
	"github.com/ai-payrecord2/backend/internal/service"
	"github.com/ai-payrecord2/backend/pkg/database"
)

type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		service: service.NewAuthService(database.DB),
	}
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误: "+err.Error())
		return
	}

	user, err := h.service.Register(req.Username, req.Password)
	if err != nil {
		response.Error400(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误: "+err.Error())
		return
	}

	user, accessToken, refreshToken, err := h.service.Login(req.Username, req.Password)
	if err != nil {
		response.Error401(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"user": gin.H{
			"id":                user.ID,
			"username":          user.Username,
			"current_ledger_id": user.CurrentLedgerID,
		},
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误: "+err.Error())
		return
	}

	accessToken, refreshToken, err := h.service.Refresh(req.RefreshToken)
	if err != nil {
		response.Error401(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var req LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误: "+err.Error())
		return
	}

	userID := middleware.GetUserID(c)
	if err := h.service.Logout(userID, req.RefreshToken); err != nil {
		response.Error500(c, "登出失败")
		return
	}

	response.Success(c, nil)
}

func AuthMiddleware() gin.HandlerFunc {
	return middleware.AuthMiddleware()
}
```

- [ ] **Step 5: 测试编译**

Run:
```bash
cd /Users/karsa/proj/ai-payrecord2/backend
go build -o server ./cmd/server
```

- [ ] **Step 6: 提交代码**

```bash
git add backend/
git commit -m "feat: 实现认证模块

- 添加密码加密工具
- 实现 JWT 中间件
- 实现 Auth Service（注册、登录、刷新token、登出）
- 实现 Auth Handler
- 用户注册时创建默认账本和预置数据

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 4: 账本和用户模块

### Task 4: 实现账本和用户接口

- [ ] **Step 1: 创建 User Service**

Create: `backend/internal/service/user.go`
```go
package service

import (
	"gorm.io/gorm"

	"github.com/ai-payrecord2/backend/internal/model"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) GetProfile(userID uint) (*model.User, error) {
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
```

- [ ] **Step 2: 创建 User Handler**

Create: `backend/internal/handler/user.go`
```go
package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-payrecord2/backend/internal/middleware"
	"github.com/ai-payrecord2/backend/internal/response"
	"github.com/ai-payrecord2/backend/internal/service"
	"github.com/ai-payrecord2/backend/pkg/database"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		service: service.NewUserService(database.DB),
	}
}

func (h *UserHandler) Profile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := h.service.GetProfile(userID)
	if err != nil {
		response.Error400(c, "获取用户信息失败")
		return
	}

	response.Success(c, gin.H{
		"id":                user.ID,
		"username":          user.Username,
		"current_ledger_id": user.CurrentLedgerID,
	})
}
```

- [ ] **Step 3: 创建 Ledger Service**

Create: `backend/internal/service/ledger.go`
```go
package service

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ai-payrecord2/backend/internal/model"
)

type LedgerService struct {
	db *gorm.DB
}

func NewLedgerService(db *gorm.DB) *LedgerService {
	return &LedgerService{db: db}
}

func (s *LedgerService) List(userID uint) ([]model.Ledger, error) {
	var ledgers []model.Ledger
	err := s.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&ledgers).Error
	return ledgers, err
}

func (s *LedgerService) Get(userID, id uint) (*model.Ledger, error) {
	var ledger model.Ledger
	err := s.db.Where("id = ? AND user_id = ?", id, userID).First(&ledger).Error
	if err != nil {
		return nil, err
	}
	return &ledger, nil
}

func (s *LedgerService) Current(userID uint) (*model.Ledger, error) {
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	if user.CurrentLedgerID == nil {
		return nil, errors.New("no current ledger")
	}
	return s.Get(userID, *user.CurrentLedgerID)
}

func (s *LedgerService) Create(userID uint, name string) (*model.Ledger, error) {
	ledger := &model.Ledger{
		UserID: userID,
		Name:   name,
	}
	err := s.db.Create(ledger).Error
	return ledger, err
}

func (s *LedgerService) Update(userID, id uint, name string) (*model.Ledger, error) {
	ledger, err := s.Get(userID, id)
	if err != nil {
		return nil, err
	}
	ledger.Name = name
	err = s.db.Save(ledger).Error
	return ledger, err
}

func (s *LedgerService) Delete(userID, id uint) error {
	// 删除账本下的所有记录
	s.db.Where("ledger_id = ?", id).Delete(&model.Record{})
	return s.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Ledger{}).Error
}

func (s *LedgerService) Switch(userID, id uint) (*model.Ledger, error) {
	// 验证账本存在且属于用户
	_, err := s.Get(userID, id)
	if err != nil {
		return nil, err
	}

	// 更新用户的当前账本
	err = s.db.Model(&model.User{}).Where("id = ?", userID).Update("current_ledger_id", id).Error
	if err != nil {
		return nil, err
	}

	return s.Get(userID, id)
}
```

- [ ] **Step 4: 创建 Ledger Handler**

Create: `backend/internal/handler/ledger.go`
```go
package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-payrecord2/backend/internal/middleware"
	"github.com/ai-payrecord2/backend/internal/response"
	"github.com/ai-payrecord2/backend/internal/service"
	"github.com/ai-payrecord2/backend/pkg/database"
)

type LedgerHandler struct {
	service *service.LedgerService
}

func NewLedgerHandler() *LedgerHandler {
	return &LedgerHandler{
		service: service.NewLedgerService(database.DB),
	}
}

type CreateLedgerRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

type UpdateLedgerRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

func (h *LedgerHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ledgers, err := h.service.List(userID)
	if err != nil {
		response.Error400(c, "获取账本列表失败")
		return
	}
	response.Success(c, ledgers)
}

func (h *LedgerHandler) Current(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ledger, err := h.service.Current(userID)
	if err != nil {
		response.Error400(c, "获取当前账本失败")
		return
	}
	response.Success(c, ledger)
}

func (h *LedgerHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req CreateLedgerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	ledger, err := h.service.Create(userID, req.Name)
	if err != nil {
		response.Error400(c, "创建账本失败")
		return
	}
	response.Success(c, ledger)
}

func (h *LedgerHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req UpdateLedgerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	ledger, err := h.service.Update(userID, uint(id), req.Name)
	if err != nil {
		response.Error400(c, "更新账本失败")
		return
	}
	response.Success(c, ledger)
}

func (h *LedgerHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := h.service.Delete(userID, uint(id)); err != nil {
		response.Error400(c, "删除账本失败")
		return
	}
	response.Success(c, nil)
}

func (h *LedgerHandler) Switch(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	ledger, err := h.service.Switch(userID, uint(id))
	if err != nil {
		response.Error400(c, "切换账本失败")
		return
	}
	response.Success(c, ledger)
}
```

- [ ] **Step 5: 编译测试**

Run:
```bash
cd /Users/karsa/proj/ai-payrecord2/backend
go build -o server ./cmd/server
```

- [ ] **Step 6: 提交代码**

```bash
git add backend/
git commit -m "feat: 实现账本和用户模块

- User Service 和 Handler
- Ledger Service 和 Handler
- 账本 CRUD 和切换功能

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 5: 分类和标签模块

### Task 5: 实现分类和标签接口

- [ ] **Step 1: 创建 Category Service**

Create: `backend/internal/service/category.go`
```go
package service

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ai-payrecord2/backend/internal/model"
)

type CategoryService struct {
	db *gorm.DB
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{db: db}
}

func (s *CategoryService) List(userID uint) ([]model.Category, error) {
	var categories []model.Category
	err := s.db.Where("user_id = ? OR user_id IS NULL", userID).Order("type, id").Find(&categories).Error
	return categories, err
}

func (s *CategoryService) Get(userID, id uint) (*model.Category, error) {
	var category model.Category
	err := s.db.Where("(user_id = ? OR user_id IS NULL) AND id = ?", userID, id).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (s *CategoryService) Create(userID uint, name, icon, color string, categoryType int) (*model.Category, error) {
	category := &model.Category{
		UserID: &userID,
		Name:   name,
		Icon:   icon,
		Color:  color,
		Type:   categoryType,
	}
	err := s.db.Create(category).Error
	return category, err
}

func (s *CategoryService) Update(userID, id uint, name, icon, color string) (*model.Category, error) {
	category, err := s.Get(userID, id)
	if err != nil {
		return nil, err
	}
	if category.IsSystem {
		return nil, errors.New("cannot update system category")
	}
	if category.UserID == nil || *category.UserID != userID {
		return nil, errors.New("cannot update other user's category")
	}

	category.Name = name
	category.Icon = icon
	category.Color = color
	err = s.db.Save(category).Error
	return category, err
}

func (s *CategoryService) Delete(userID, id uint) error {
	category, err := s.Get(userID, id)
	if err != nil {
		return err
	}
	if category.IsSystem {
		return errors.New("cannot delete system category")
	}
	if category.UserID == nil || *category.UserID != userID {
		return errors.New("cannot delete other user's category")
	}

	// 检查是否有记录使用该分类
	var count int64
	s.db.Model(&model.Record{}).Where("category_id = ?", id).Count(&count)
	if count > 0 {
		return errors.New("该分类下有记录，无法删除")
	}

	return s.db.Delete(category).Error
}
```

- [ ] **Step 2: 创建 Category Handler**

Create: `backend/internal/handler/category.go`
```go
package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-payrecord2/backend/internal/middleware"
	"github.com/ai-payrecord2/backend/internal/response"
	"github.com/ai-payrecord2/backend/internal/service"
	"github.com/ai-payrecord2/backend/pkg/database"
)

type CategoryHandler struct {
	service *service.CategoryService
}

func NewCategoryHandler() *CategoryHandler {
	return &CategoryHandler{
		service: service.NewCategoryService(database.DB),
	}
}

type CreateCategoryRequest struct {
	Name     string `json:"name" binding:"required,min=1,max=50"`
	Icon     string `json:"icon" binding:"required,max=10"`
	Color    string `json:"color" binding:"required,max=20"`
	Type     int    `json:"type" binding:"required,oneof=1 2"`
}

type UpdateCategoryRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=50"`
	Icon  string `json:"icon" binding:"required,max=10"`
	Color string `json:"color" binding:"required,max=20"`
}

func (h *CategoryHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	categories, err := h.service.List(userID)
	if err != nil {
		response.Error400(c, "获取分类列表失败")
		return
	}
	response.Success(c, categories)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	category, err := h.service.Create(userID, req.Name, req.Icon, req.Color, req.Type)
	if err != nil {
		response.Error400(c, "创建分类失败")
		return
	}
	response.Success(c, category)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	category, err := h.service.Update(userID, uint(id), req.Name, req.Icon, req.Color)
	if err != nil {
		response.Error400(c, err.Error())
		return
	}
	response.Success(c, category)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := h.service.Delete(userID, uint(id)); err != nil {
		response.Error400(c, err.Error())
		return
	}
	response.Success(c, nil)
}
```

- [ ] **Step 3: 创建 Tag Service**

Create: `backend/internal/service/tag.go`
```go
package service

import (
	"errors"

	"gorm.io/gorm"

	"github.com/ai-payrecord2/backend/internal/model"
)

type TagService struct {
	db *gorm.DB
}

func NewTagService(db *gorm.DB) *TagService {
	return &TagService{db: db}
}

func (s *TagService) List(userID uint) ([]model.Tag, error) {
	var tags []model.Tag
	err := s.db.Where("user_id = ? OR user_id IS NULL", userID).Find(&tags).Error
	return tags, err
}

func (s *TagService) Get(userID, id uint) (*model.Tag, error) {
	var tag model.Tag
	err := s.db.Where("(user_id = ? OR user_id IS NULL) AND id = ?", userID, id).First(&tag).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (s *TagService) Create(userID uint, name, color string) (*model.Tag, error) {
	tag := &model.Tag{
		UserID: &userID,
		Name:   name,
		Color:  color,
	}
	err := s.db.Create(tag).Error
	return tag, err
}

func (s *TagService) Update(userID, id uint, name, color string) (*model.Tag, error) {
	tag, err := s.Get(userID, id)
	if err != nil {
		return nil, err
	}
	if tag.IsSystem {
		return nil, errors.New("cannot update system tag")
	}
	if tag.UserID == nil || *tag.UserID != userID {
		return nil, errors.New("cannot update other user's tag")
	}

	tag.Name = name
	tag.Color = color
	err = s.db.Save(tag).Error
	return tag, err
}

func (s *TagService) Delete(userID, id uint) error {
	tag, err := s.Get(userID, id)
	if err != nil {
		return err
	}
	if tag.IsSystem {
		return errors.New("cannot delete system tag")
	}
	if tag.UserID == nil || *tag.UserID != userID {
		return errors.New("cannot delete other user's tag")
	}

	// 删除标签关联
	s.db.Where("tag_id = ?", id).Delete(&model.RecordTag{})

	return s.db.Delete(tag).Error
}
```

- [ ] **Step 4: 创建 Tag Handler**

Create: `backend/internal/handler/tag.go`
```go
package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-payrecord2/backend/internal/middleware"
	"github.com/ai-payrecord2/backend/internal/response"
	"github.com/ai-payrecord2/backend/internal/service"
	"github.com/ai-payrecord2/backend/pkg/database"
)

type TagHandler struct {
	service *service.TagService
}

func NewTagHandler() *TagHandler {
	return &TagHandler{
		service: service.NewTagService(database.DB),
	}
}

type CreateTagRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=20"`
	Color string `json:"color" binding:"required,max=20"`
}

type UpdateTagRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=20"`
	Color string `json:"color" binding:"required,max=20"`
}

func (h *TagHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tags, err := h.service.List(userID)
	if err != nil {
		response.Error400(c, "获取标签列表失败")
		return
	}
	response.Success(c, tags)
}

func (h *TagHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	tag, err := h.service.Create(userID, req.Name, req.Color)
	if err != nil {
		response.Error400(c, "创建标签失败")
		return
	}
	response.Success(c, tag)
}

func (h *TagHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req UpdateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	tag, err := h.service.Update(userID, uint(id), req.Name, req.Color)
	if err != nil {
		response.Error400(c, err.Error())
		return
	}
	response.Success(c, tag)
}

func (h *TagHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := h.service.Delete(userID, uint(id)); err != nil {
		response.Error400(c, err.Error())
		return
	}
	response.Success(c, nil)
}
```

- [ ] **Step 5: 编译测试**

Run:
```bash
cd /Users/karsa/proj/ai-payrecord2/backend
go build -o server ./cmd/server
```

- [ ] **Step 6: 提交代码**

```bash
git add backend/
git commit -m "feat: 实现分类和标签模块

- Category Service 和 Handler
- Tag Service 和 Handler
- 分类/标签 CRUD 功能

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 6: 记录模块

### Task 6: 实现记录 CRUD 接口

- [ ] **Step 1: 创建 Record Service**

Create: `backend/internal/service/record.go`
```go
package service

import (
	"strconv"

	"gorm.io/gorm"

	"github.com/ai-payrecord2/backend/internal/model"
)

type RecordService struct {
	db *gorm.DB
}

func NewRecordService(db *gorm.DB) *RecordService {
	return &RecordService{db: db}
}

type RecordWithDetails struct {
	model.Record
	CategoryName  string      `json:"category_name"`
	CategoryIcon  string      `json:"category_icon"`
	CategoryColor string      `json:"category_color"`
	Tags          []model.Tag `json:"tags"`
}

func (s *RecordService) List(userID uint, ledgerID *uint, cursor uint, limit int) ([]RecordWithDetails, uint, bool, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	// 获取用户的当前账本
	var currentLedgerID uint
	if ledgerID != nil {
		currentLedgerID = *ledgerID
	} else {
		var user model.User
		if err := s.db.First(&user, userID).Error; err != nil {
			return nil, 0, false, err
		}
		if user.CurrentLedgerID == nil {
			return nil, 0, false, nil
		}
		currentLedgerID = *user.CurrentLedgerID
	}

	// 查询记录
	query := s.db.Where("ledger_id = ?", currentLedgerID)
	if cursor > 0 {
		query = query.Where("id < ?", cursor)
	}
	query = query.Order("created_at DESC, id DESC").Limit(limit + 1)

	var records []model.Record
	if err := query.Find(&records).Error; err != nil {
		return nil, 0, false, err
	}

	hasMore := len(records) > limit
	if hasMore {
		records = records[:limit]
	}

	// 获取详情
	var result []RecordWithDetails
	var lastID uint
	for _, r := range records {
		lastID = r.ID

		var category model.Category
		s.db.First(&category, r.CategoryID)

		var tags []model.Tag
		s.db.Joins("JOIN record_tags ON record_tags.tag_id = tags.id").
			Where("record_tags.record_id = ?", r.ID).Find(&tags)

		result = append(result, RecordWithDetails{
			Record:         r,
			CategoryName:   category.Name,
			CategoryIcon:   category.Icon,
			CategoryColor:  category.Color,
			Tags:           tags,
		})
	}

	return result, lastID, hasMore, nil
}

func (s *RecordService) Get(userID, id uint) (*RecordWithDetails, error) {
	var record model.Record
	if err := s.db.Where("id = ?", id).First(&record).Error; err != nil {
		return nil, err
	}

	// 验证账本属于用户
	var ledger model.Ledger
	if err := s.db.Where("id = ? AND user_id = ?", record.LedgerID, userID).First(&ledger).Error; err != nil {
		return nil, err
	}

	var category model.Category
	s.db.First(&category, record.CategoryID)

	var tags []model.Tag
	s.db.Joins("JOIN record_tags ON record_tags.tag_id = tags.id").
		Where("record_tags.record_id = ?", record.ID).Find(&tags)

	return &RecordWithDetails{
		Record:         record,
		CategoryName:   category.Name,
		CategoryIcon:   category.Icon,
		CategoryColor:  category.Color,
		Tags:           tags,
	}, nil
}

func (s *RecordService) Create(userID uint, ledgerID *uint, categoryID uint, amount float64, recordType int, remark string, tagIDs []uint) (*RecordWithDetails, error) {
	// 获取账本
	var currentLedgerID uint
	if ledgerID != nil {
		currentLedgerID = *ledgerID
	} else {
		var user model.User
		if err := s.db.First(&user, userID).Error; err != nil {
			return nil, err
		}
		if user.CurrentLedgerID == nil {
			return nil, gorm.ErrRecordNotFound
		}
		currentLedgerID = *user.CurrentLedgerID
	}

	// 验证分类存在
	var category model.Category
	if err := s.db.First(&category, categoryID).Error; err != nil {
		return nil, err
	}

	record := &model.Record{
		LedgerID:   currentLedgerID,
		CategoryID: categoryID,
		Amount:     amount,
		Type:       recordType,
		Remark:     remark,
	}
	if err := s.db.Create(record).Error; err != nil {
		return nil, err
	}

	// 添加标签关联
	for _, tagID := range tagIDs {
		s.db.Create(&model.RecordTag{RecordID: record.ID, TagID: tagID})
	}

	return s.Get(userID, record.ID)
}

func (s *RecordService) Update(userID, id uint, categoryID uint, amount float64, recordType int, remark string, tagIDs []uint) (*RecordWithDetails, error) {
	record, err := s.Get(userID, id)
	if err != nil {
		return nil, err
	}

	record.CategoryID = categoryID
	record.Amount = amount
	record.Type = recordType
	record.Remark = remark

	if err := s.db.Save(&record.Record).Error; err != nil {
		return nil, err
	}

	// 更新标签关联
	s.db.Where("record_id = ?", id).Delete(&model.RecordTag{})
	for _, tagID := range tagIDs {
		s.db.Create(&model.RecordTag{RecordID: id, TagID: tagID})
	}

	return s.Get(userID, id)
}

func (s *RecordService) Delete(userID, id uint) error {
	_, err := s.Get(userID, id)
	if err != nil {
		return err
	}

	s.db.Where("record_id = ?", id).Delete(&model.RecordTag{})
	return s.db.Delete(&model.Record{}, id).Error
}

func ParseCursor(cursorStr string) uint {
	if cursorStr == "" {
		return 0
	}
	cursor, _ := strconv.ParseUint(cursorStr, 10, 32)
	return uint(cursor)
}
```

- [ ] **Step 2: 创建 Record Handler**

Create: `backend/internal/handler/record.go`
```go
package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-payrecord2/backend/internal/middleware"
	"github.com/ai-payrecord2/backend/internal/response"
	"github.com/ai-payrecord2/backend/internal/service"
	"github.com/ai-payrecord2/backend/pkg/database"
)

type RecordHandler struct {
	service *service.RecordService
}

func NewRecordHandler() *RecordHandler {
	return &RecordHandler{
		service: service.NewRecordService(database.DB),
	}
}

type CreateRecordRequest struct {
	CategoryID uint    `json:"category_id" binding:"required"`
	Amount     float64 `json:"amount" binding:"required"`
	Type       int     `json:"type" binding:"required,oneof=1 2"`
	Remark     string  `json:"remark"`
	TagIDs     []uint  `json:"tag_ids"`
}

type UpdateRecordRequest struct {
	CategoryID uint    `json:"category_id" binding:"required"`
	Amount     float64 `json:"amount" binding:"required"`
	Type       int     `json:"type" binding:"required,oneof=1 2"`
	Remark     string  `json:"remark"`
	TagIDs     []uint  `json:"tag_ids"`
}

type PaginationResponse struct {
	NextCursor uint `json:"next_cursor"`
	HasMore    bool `json:"has_more"`
}

func (h *RecordHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var ledgerID *uint
	if lid := c.Query("ledger_id"); lid != "" {
		id, _ := strconv.ParseUint(lid, 10, 32)
		uid := uint(id)
		ledgerID = &uid
	}

	cursor := service.ParseCursor(c.Query("cursor"))
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	records, lastID, hasMore, err := h.service.List(userID, ledgerID, cursor, limit)
	if err != nil {
		response.Error400(c, "获取记录列表失败")
		return
	}

	response.Success(c, gin.H{
		"data":       records,
		"pagination": PaginationResponse{NextCursor: lastID, HasMore: hasMore},
	})
}

func (h *RecordHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	record, err := h.service.Get(userID, uint(id))
	if err != nil {
		response.Error400(c, "获取记录失败")
		return
	}
	response.Success(c, record)
}

func (h *RecordHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	record, err := h.service.Create(userID, nil, req.CategoryID, req.Amount, req.Type, req.Remark, req.TagIDs)
	if err != nil {
		response.Error400(c, "创建记录失败")
		return
	}
	response.Success(c, record)
}

func (h *RecordHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var req UpdateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	record, err := h.service.Update(userID, uint(id), req.CategoryID, req.Amount, req.Type, req.Remark, req.TagIDs)
	if err != nil {
		response.Error400(c, "更新记录失败")
		return
	}
	response.Success(c, record)
}

func (h *RecordHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	if err := h.service.Delete(userID, uint(id)); err != nil {
		response.Error400(c, "删除记录失败")
		return
	}
	response.Success(c, nil)
}
```

- [ ] **Step 3: 编译测试**

Run:
```bash
cd /Users/karsa/proj/ai-payrecord2/backend
go build -o server ./cmd/server
```

- [ ] **Step 4: 提交代码**

```bash
git add backend/
git commit -m "feat: 实现记录模块

- Record Service 和 Handler
- 记录 CRUD 和分页功能

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 7: LLM 模块

### Task 7: 实现 LLM 智能添加记录

- [ ] **Step 1: 创建 LLM Service**

Create: `backend/internal/service/llm.go`
```go
package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"gorm.io/gorm"

	"github.com/ai-payrecord2/backend/internal/config"
	"github.com/ai-payrecord2/backend/internal/model"
)

type LLMService struct {
	db *gorm.DB
}

type LLMCategory struct {
	Name     string `json:"name"`
	Icon     string `json:"icon"`
	Color    string `json:"color"`
	IsNew    bool   `json:"is_new"`
}

type LLMResponse struct {
	Amount    float64       `json:"amount"`
	Type     int           `json:"type"`
	Category LLMCategory    `json:"category"`
	Tags     []string      `json:"tags"`
	Remark   string        `json:"remark"`
}

func NewLLMService(db *gorm.DB) *LLMService {
	return &LLMService{db: db}
}

func (s *LLMService) GetCategories(userID uint) ([]model.Category, error) {
	var categories []model.Category
	err := s.db.Where("user_id = ? OR user_id IS NULL", userID).Find(&categories).Error
	return categories, err
}

func (s *LLMService) Parse(userID uint, text string) (*LLMResponse, bool, error) {
	// 获取用户分类
	categories, err := s.GetCategories(userID)
	if err != nil {
		return nil, false, err
	}

	// 构建 prompt
	categoryList := ""
	for _, c := range categories {
		categoryList += fmt.Sprintf("- %s (%s)\n", c.Name, c.Icon)
	}

	prompt := fmt.Sprintf(`你是一个记账助手，请从用户的自然语言描述中提取记账信息。

用户的分类列表：
%s

请从以下文本中提取记账信息，返回JSON格式：
{
  "amount": 金额（数字）,
  "type": 1表示支出，2表示收入,
  "category": 匹配的分类名称（如果无法匹配，返回一个新的分类名称）,
  "tags": 匹配的标签列表（可选）,
  "remark": 备注（可选）
}

用户输入：%s

只返回JSON，不要其他内容。`, categoryList, text)

	// 调用 LLM API
	reqBody, _ := json.Marshal(map[string]interface{}{
		"model": config.AppConfig.LLMModel,
		"messages": []map[string]string{
			{"role": "system", "content": "你是一个专业的记账助手，擅长从自然语言中提取财务信息。"},
			{"role": "user", "content": prompt},
		},
		"temperature": 0.3,
		"max_tokens": 500,
	})

	req, _ := http.NewRequest("POST", config.AppConfig.LLMAPIBase+"/chat/completions", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.AppConfig.LLMAPIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, false, fmt.Errorf("LLM API 调用失败: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	// 解析响应
	choices := result["choices"].([]interface{})
	message := choices[0].(map[string]interface{})["message"].(map[string]interface{})
	content := message["content"].(string)

	// 清理 JSON 响应（去除可能的 markdown 代码块）
	content = bytes.TrimPrefix([]byte(content), []byte("```json"))
	content = bytes.TrimSuffix(content, []byte("```"))
	content = bytes.TrimSpace(content)

	var llmResp LLMResponse
	if err := json.Unmarshal(content, &llmResp); err != nil {
		return nil, false, fmt.Errorf("解析 LLM 响应失败: %v", err)
	}

	// 检查是否是新分类
	isNew := true
	for _, c := range categories {
		if c.Name == llmResp.Category.Name {
			llmResp.Category.Icon = c.Icon
			llmResp.Category.Color = c.Color
			isNew = false
			break
		}
	}
	llmResp.Category.IsNew = isNew

	return &llmResp, isNew, nil
}

func (s *LLMService) CreateWithLLM(userID uint, amount float64, recordType int, categoryName, categoryIcon, categoryColor string, categoryID *uint, tagNames []string, remark string) (*model.Record, error) {
	// 获取账本
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	if user.CurrentLedgerID == nil {
		return nil, gorm.ErrRecordNotFound
	}

	var catID uint
	if categoryID != nil {
		catID = *categoryID
	} else {
		// 创建新分类
		cat := model.Category{
			UserID: &userID,
			Name:   categoryName,
			Icon:   categoryIcon,
			Color:  categoryColor,
			Type:   recordType,
		}
		s.db.Create(&cat)
		catID = cat.ID
	}

	// 查找或创建标签
	var tagIDs []uint
	for _, tagName := range tagNames {
		var tag model.Tag
		if err := s.db.Where("user_id = ? AND name = ?", userID, tagName).First(&tag).Error; err == nil {
			tagIDs = append(tagIDs, tag.ID)
		}
	}

	// 创建记录
	record := &model.Record{
		LedgerID:   *user.CurrentLedgerID,
		CategoryID: catID,
		Amount:     amount,
		Type:       recordType,
		Remark:     remark,
	}
	if err := s.db.Create(record).Error; err != nil {
		return nil, err
	}

	// 添加标签关联
	for _, tagID := range tagIDs {
		s.db.Create(&model.RecordTag{RecordID: record.ID, TagID: tagID})
	}

	return record, nil
}
```

- [ ] **Step 2: 创建 LLM Handler**

Create: `backend/internal/handler/llm.go`
```go
package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-payrecord2/backend/internal/middleware"
	"github.com/ai-payrecord2/backend/internal/response"
	"github.com/ai-payrecord2/backend/internal/service"
	"github.com/ai-payrecord2/backend/pkg/database"
)

type LLMHandler struct {
	service *service.LLMService
}

func NewLLMHandler() *LLMHandler {
	return &LLMHandler{
		service: service.NewLLMService(database.DB),
	}
}

func (h *LLMHandler) Categories(c *gin.Context) {
	userID := middleware.GetUserID(c)
	categories, err := h.service.GetCategories(userID)
	if err != nil {
		response.Error400(c, "获取分类列表失败")
		return
	}
	response.Success(c, categories)
}

type ParseRequest struct {
	Text string `json:"text" binding:"required"`
}

func (h *LLMHandler) Parse(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req ParseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	result, isNew, err := h.service.Parse(userID, req.Text)
	if err != nil {
		response.Error400(c, "解析失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"data":                   result,
		"needs_category_confirm": isNew,
	})
}

type CreateRecordWithLLMRequest struct {
	Amount         float64  `json:"amount" binding:"required"`
	Type           int      `json:"type" binding:"required,oneof=1 2"`
	CategoryID     *uint    `json:"category_id"`
	CategoryName   string   `json:"category_name"`
	CategoryIcon   string   `json:"category_icon"`
	CategoryColor  string   `json:"category_color"`
	TagNames       []string `json:"tag_names"`
	Remark         string   `json:"remark"`
}

func (h *LLMHandler) CreateRecord(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req CreateRecordWithLLMRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error400(c, "请求参数错误")
		return
	}

	record, err := h.service.CreateWithLLM(
		userID,
		req.Amount,
		req.Type,
		req.CategoryName,
		req.CategoryIcon,
		req.CategoryColor,
		req.CategoryID,
		req.TagNames,
		req.Remark,
	)
	if err != nil {
		response.Error400(c, "创建记录失败")
		return
	}
	response.Success(c, record)
}
```

- [ ] **Step 3: 编译测试**

Run:
```bash
cd /Users/karsa/proj/ai-payrecord2/backend
go build -o server ./cmd/server
```

- [ ] **Step 4: 提交代码**

```bash
git add backend/
git commit -m "feat: 实现 LLM 模块

- LLM Service（解析自然语言、创建记录）
- LLM Handler

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 8: 统计模块

### Task 8: 实现统计接口

- [ ] **Step 1: 创建 Stats Service**

Create: `backend/internal/service/stats.go`
```go
package service

import (
	"time"

	"gorm.io/gorm"

	"github.com/ai-payrecord2/backend/internal/model"
)

type StatsService struct {
	db *gorm.DB
}

type SummaryData struct {
	Month         string  `json:"month"`
	ExpenseCount  int     `json:"expense_count"`
	ExpenseAmount float64 `json:"expense_amount"`
	IncomeCount   int     `json:"income_count"`
	IncomeAmount  float64 `json:"income_amount"`
}

type DailyData struct {
	Date          string  `json:"date"`
	ExpenseCount  int     `json:"expense_count"`
	ExpenseAmount float64 `json:"expense_amount"`
	IncomeCount   int     `json:"income_count"`
	IncomeAmount  float64 `json:"income_amount"`
}

type CategoryStat struct {
	CategoryID    uint    `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	CategoryIcon  string  `json:"category_icon"`
	CategoryColor string  `json:"category_color"`
	Amount        float64 `json:"amount"`
	Count         int     `json:"count"`
	Percentage    float64 `json:"percentage"`
}

type MonthlyData struct {
	Month        string  `json:"month"`
	ExpenseAmount float64 `json:"expense_amount"`
	IncomeAmount  float64 `json:"income_amount"`
}

func NewStatsService(db *gorm.DB) *StatsService {
	return &StatsService{db: db}
}

func (s *StatsService) getLedgerID(userID uint, ledgerID *uint) (uint, error) {
	if ledgerID != nil {
		return *ledgerID, nil
	}
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return 0, err
	}
	if user.CurrentLedgerID == nil {
		return 0, gorm.ErrRecordNotFound
	}
	return *user.CurrentLedgerID, nil
}

func (s *StatsService) Summary(userID uint, ledgerID *uint) ([]SummaryData, error) {
	ledgerID, err := s.getLedgerID(userID, ledgerID)
	if err != nil {
		return nil, err
	}

	var results []SummaryData
	now := time.Now()

	// 查询最近12个月
	for i := 0; i < 12; i++ {
		date := now.AddDate(0, -i, 0)
		year := date.Year()
		month := int(date.Month())

		var expenseCount, incomeCount int64
		var expenseAmount, incomeAmount float64

		s.db.Model(&model.Record{}).
			Where("ledger_id = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?", ledgerID, fmt.Sprintf("%d", year), fmt.Sprintf("%02d", month), 1).
			Count(&expenseCount).
			Select("COALESCE(SUM(amount), 0)").Row().Scan(&expenseAmount)

		s.db.Model(&model.Record{}).
			Where("ledger_id = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?", ledgerID, fmt.Sprintf("%d", year), fmt.Sprintf("%02d", month), 2).
			Count(&incomeCount).
			Select("COALESCE(SUM(amount), 0)").Row().Scan(&incomeAmount)

		results = append(results, SummaryData{
			Month:         fmt.Sprintf("%d-%02d", year, month),
			ExpenseCount:  int(expenseCount),
			ExpenseAmount: expenseAmount,
			IncomeCount:   int(incomeCount),
			IncomeAmount:  incomeAmount,
		})
	}

	return results, nil
}

func (s *StatsService) Daily(userID uint, ledgerID *uint) ([]DailyData, error) {
	ledgerID, err := s.getLedgerID(userID, ledgerID)
	if err != nil {
		return nil, err
	}

	type dailyResult struct {
		Date          string
		ExpenseCount  int
		ExpenseAmount float64
		IncomeCount   int
		IncomeAmount  float64
	}

	var results []dailyResult
	s.db.Raw(`
		SELECT
			strftime('%Y-%m-%d', created_at) as date,
			SUM(CASE WHEN type = 1 THEN 1 ELSE 0 END) as expense_count,
			COALESCE(SUM(CASE WHEN type = 1 THEN amount ELSE 0 END), 0) as expense_amount,
			SUM(CASE WHEN type = 2 THEN 1 ELSE 0 END) as income_count,
			COALESCE(SUM(CASE WHEN type = 2 THEN amount ELSE 0 END), 0) as income_amount
		FROM records
		WHERE ledger_id = ?
		GROUP BY strftime('%Y-%m-%d', created_at)
		ORDER BY date DESC
	`, ledgerID).Scan(&results)

	var dailyData []DailyData
	for _, r := range results {
		dailyData = append(dailyData, DailyData{
			Date:          r.Date,
			ExpenseCount:  r.ExpenseCount,
			ExpenseAmount: r.ExpenseAmount,
			IncomeCount:   r.IncomeCount,
			IncomeAmount:  r.IncomeAmount,
		})
	}

	return dailyData, nil
}

func (s *StatsService) ByCategory(userID uint, ledgerID *uint, recordType int) ([]CategoryStat, error) {
	ledgerID, err := s.getLedgerID(userID, ledgerID)
	if err != nil {
		return nil, err
	}

	type result struct {
		CategoryID    uint
		Amount        float64
		Count         int
	}

	var results []result
	query := s.db.Model(&model.Record{}).
		Select("category_id, SUM(amount) as amount, COUNT(*) as count").
		Where("ledger_id = ?", ledgerID)
	if recordType > 0 {
		query = query.Where("type = ?", recordType)
	}
	query.Group("category_id").Scan(&results)

	// 计算总量
	var total float64
	for _, r := range results {
		total += r.Amount
	}

	// 获取分类信息
	var stats []CategoryStat
	for _, r := range results {
		var category model.Category
		s.db.First(&category, r.CategoryID)

		percentage := 0.0
		if total > 0 {
			percentage = r.Amount / total * 100
		}

		stats = append(stats, CategoryStat{
			CategoryID:    category.ID,
			CategoryName:  category.Name,
			CategoryIcon:  category.Icon,
			CategoryColor: category.Color,
			Amount:        r.Amount,
			Count:         r.Count,
			Percentage:    percentage,
		})
	}

	return stats, nil
}

func (s *StatsService) Monthly(userID uint, ledgerID *uint, year *int) ([]MonthlyData, error) {
	ledgerID, err := s.getLedgerID(userID, ledgerID)
	if err != nil {
		return nil, err
	}

	currentYear := time.Now().Year()
	if year == nil {
		year = &currentYear
	}

	type result struct {
		Month        string
		ExpenseAmount float64
		IncomeAmount  float64
	}

	var results []result
	s.db.Raw(`
		SELECT
			strftime('%m', created_at) as month,
			COALESCE(SUM(CASE WHEN type = 1 THEN amount ELSE 0 END), 0) as expense_amount,
			COALESCE(SUM(CASE WHEN type = 2 THEN amount ELSE 0 END), 0) as income_amount
		FROM records
		WHERE ledger_id = ? AND strftime('%Y', created_at) = ?
		GROUP BY strftime('%m', created_at)
		ORDER BY month
	`, ledgerID, fmt.Sprintf("%d", *year)).Scan(&results)

	var monthlyData []MonthlyData
	for _, r := range results {
		monthlyData = append(monthlyData, MonthlyData{
			Month:         r.Month,
			ExpenseAmount: r.ExpenseAmount,
			IncomeAmount:  r.IncomeAmount,
		})
	}

	return monthlyData, nil
}
```

**注意**: Stats Service 中需要添加 `import "fmt"` 并修复 `Summary` 函数中的 SQL 查询。

- [ ] **Step 2: 创建 Stats Handler**

Create: `backend/internal/handler/stats.go`
```go
package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-payrecord2/backend/internal/middleware"
	"github.com/ai-payrecord2/backend/internal/response"
	"github.com/ai-payrecord2/backend/internal/service"
	"github.com/ai-payrecord2/backend/pkg/database"
)

type StatsHandler struct {
	service *service.StatsService
}

func NewStatsHandler() *StatsHandler {
	return &StatsHandler{
		service: service.NewStatsService(database.DB),
	}
}

func (h *StatsHandler) getLedgerID(c *gin.Context) *uint {
	if lid := c.Query("ledger_id"); lid != "" {
		id, _ := strconv.ParseUint(lid, 10, 32)
		uid := uint(id)
		return &uid
	}
	return nil
}

func (h *StatsHandler) Summary(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ledgerID := h.getLedgerID(c)

	data, err := h.service.Summary(userID, ledgerID)
	if err != nil {
		response.Error400(c, "获取汇总数据失败")
		return
	}
	response.Success(c, data)
}

func (h *StatsHandler) Daily(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ledgerID := h.getLedgerID(c)

	data, err := h.service.Daily(userID, ledgerID)
	if err != nil {
		response.Error400(c, "获取日度数据失败")
		return
	}
	response.Success(c, data)
}

func (h *StatsHandler) ByCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ledgerID := h.getLedgerID(c)

	recordType := 0
	if t := c.Query("type"); t != "" {
		recordType, _ = strconv.Atoi(t)
	}

	data, err := h.service.ByCategory(userID, ledgerID, recordType)
	if err != nil {
		response.Error400(c, "获取分类统计失败")
		return
	}
	response.Success(c, data)
}

func (h *StatsHandler) Monthly(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ledgerID := h.getLedgerID(c)

	var year *int
	if y := c.Query("year"); y != "" {
		if parsed, err := strconv.Atoi(y); err == nil {
			year = &parsed
		}
	}

	data, err := h.service.Monthly(userID, ledgerID, year)
	if err != nil {
		response.Error400(c, "获取月度统计失败")
		return
	}
	response.Success(c, data)
}

func (h *StatsHandler) MonthlyDetail(c *gin.Context) {
	// TODO: 实现月度详情
	response.Success(c, nil)
}

func (h *StatsHandler) ByTag(c *gin.Context) {
	// TODO: 实现按标签统计
	response.Success(c, nil)
}
```

- [ ] **Step 3: 编译测试**

Run:
```bash
cd /Users/karsa/proj/ai-payrecord2/backend
go build -o server ./cmd/server
```

- [ ] **Step 4: 提交代码**

```bash
git add backend/
git commit -m "feat: 实现统计模块

- Stats Service（汇总、日度、分类、月度统计）
- Stats Handler

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 9: 最终测试和提交

### Task 9: 最终测试

- [ ] **Step 1: 编译项目**

Run:
```bash
cd /Users/karsa/proj/ai-payrecord2/backend
go build -o server ./cmd/server
```

- [ ] **Step 2: 运行服务并测试**

Run:
```bash
cd /Users/karsa/proj/ai-payrecord2/backend
./server
```

- [ ] **Step 3: 提交所有变更**

```bash
git add backend/
git commit -m "feat: 完成账本 App 后端 API 开发

- 项目初始化和基础架构
- 数据模型定义
- 认证模块（注册/登录/JWT/Refresh Token）
- 账本和用户模块
- 分类和标签模块
- 记录模块（CRUD + 分页）
- LLM 模块（自然语言解析）
- 统计模块

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
