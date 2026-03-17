     1→# 账本 App 后端实现计划
     2→
     3→> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.
     4→
     5→**Goal:** 实现账本 App 后端 API 服务（Golang + Gin + Gorm + SQLite + JWT）
     6→
     7→**Architecture:** 采用分层架构 - handler 层处理请求、service 层处理业务逻辑、model 层定义数据模型
     8→
     9→**Tech Stack:** Golang, Gin, Gorm, SQLite, JWT (golang-jwt)
    10→
    11→---
    12→
    13→## 项目结构
    14→
    15→```
    16→backend/
    17→├── cmd/
    18→│   └── server/
    19→│       └── main.go           # 入口文件
    20→├── internal/
    21→│   ├── config/
    22→│   │   └── config.go         # 配置加载
    23→│   ├── model/
    24→│   │   ├── user.go           # 用户模型
    25→│   │   ├── ledger.go         # 账本模型
    26→│   │   ├── category.go       # 分类模型
    27→│   │   ├── tag.go            # 标签模型
    28→│   │   ├── record.go         # 记录模型
    29→│   │   └── token.go          # Token 模型
    30→│   ├── handler/
    31→│   │   ├── auth.go           # 认证接口
    32→│   │   ├── user.go           # 用户接口
    33→│   │   ├── ledger.go         # 账本接口
    34→│   │   ├── category.go       # 分类接口
    35→│   │   ├── tag.go            # 标签接口
    36→│   │   ├── record.go         # 记录接口
    37→│   │   ├── llm.go            # LLM 接口
    38→│   │   └── stats.go          # 统计接口
    39→│   ├── service/
    40→│   │   ├── auth.go           # 认证服务
    41→│   │   ├── ledger.go         # 账本服务
    42→│   │   ├── category.go       # 分类服务
    43→│   │   ├── tag.go            # 标签服务
    44→│   │   ├── record.go         # 记录服务
    45→│   │   ├── llm.go           # LLM 服务
    46→│   │   └── stats.go          # 统计服务
    47→│   ├── middleware/
    48→│   │   └── auth.go           # JWT 中间件
    49→│   └── response/
    50→│       └── response.go        # 统一响应格式
    51→├── pkg/
    52→│   ├── database/
    53→│   │   └── database.go       # 数据库连接
    54→│   └── utils/
    55→│       └── bcrypt.go         # 密码工具
    56→├── go.mod
    57→├── go.sum
    58→└── .env                      # 环境变量配置
    59→```
    60→
    61→---
    62→
    63→## Chunk 1: 项目初始化与基础架构
    64→
    65→### Task 1: 初始化 Go Module 和依赖
    66→
    67→- [ ] **Step 1: 创建 backend 目录并初始化 go.mod**
    68→
    69→Run:
    70→```bash
    71→mkdir -p /Users/karsa/proj/ai-payrecord2/backend/cmd/server
    72→mkdir -p /Users/karsa/proj/ai-payrecord2/backend/internal/{config,model,handler,service,middleware,response}
    73→mkdir -p /Users/karsa/proj/ai-payrecord2/backend/pkg/{database,utils}
    74→cd /Users/karsa/proj/ai-payrecord2/backend
    75→go mod init github.com/ai-payrecord2/backend
    76→```
    77→
    78→- [ ] **Step 2: 安装依赖**
    79→
    80→Run:
    81→```bash
    82→go get github.com/gin-gonic/gin
    83→go get gorm.io/gorm
    84→go get gorm.io/driver/sqlite
    85→go get github.com/golang-jwt/jwt/v5
    86→go get golang.org/x/crypto/bcrypt
    87→go get github.com/joho/godotenv
    88→```
    89→
    90→- [ ] **Step 3: 创建 .env 配置文件**
    91→
    92→Create: `backend/.env`
    93→```env
    94→PORT=8080
    95→DB_PATH=./data/ledger.db
    96→JWT_SECRET=your-secret-key-change-in-production
    97→JWT_EXPIRE_HOURS=168
    98→REFRESH_TOKEN_EXPIRE_HOURS=720
    99→LLM_API_KEY=
   100→LLM_API_BASE=https://api.openai.com/v1
   101→LLM_MODEL=gpt-3.5-turbo
   102→```
   103→
   104→- [ ] **Step 4: 创建 config.go**
   105→
   106→Create: `backend/internal/config/config.go`
   107→```go
   108→package config
   109→
   110→import (
   111→	"os"
   112→	"strconv"
   113→	"time"
   114→
   115→	"github.com/joho/godotenv"
   116→)
   117→
   118→type Config struct {
   119→	Port                     int
   120→	DBPath                   string
   121→	JWTSecret                string
   122→	JWTExpireHours           time.Duration
   123→	RefreshTokenExpireHours  time.Duration
   124→	LLMAPIKey                string
   125→	LLMAPIBase               string
   126→	LLMModel                 string
   127→}
   128→
   129→var AppConfig *Config
   130→
   131→func Load() {
   132→	godotenv.Load()
   133→
   134→	expireHours, _ := strconv.Atoi(getEnv("JWT_EXPIRE_HOURS", "168"))
   135→	refreshExpireHours, _ := strconv.Atoi(getEnv("REFRESH_TOKEN_EXPIRE_HOURS", "720"))
   136→	port, _ := strconv.Atoi(getEnv("PORT", "8080"))
   137→
   138→	AppConfig = &Config{
   139→		Port:                    port,
   140→		DBPath:                  getEnv("DB_PATH", "./data/ledger.db"),
   141→		JWTSecret:               getEnv("JWT_SECRET", "default-secret"),
   142→		JWTExpireHours:          time.Duration(expireHours) * time.Hour,
   143→		RefreshTokenExpireHours: time.Duration(refreshExpireHours) * time.Hour,
   144→		LLMAPIKey:               getEnv("LLM_API_KEY", ""),
   145→		LLMAPIBase:              getEnv("LLM_API_BASE", "https://api.openai.com/v1"),
   146→		LLMModel:                getEnv("LLM_MODEL", "gpt-3.5-turbo"),
   147→	}
   148→}
   149→
   150→func getEnv(key, defaultValue string) string {
   151→	if value := os.Getenv(key); value != "" {
   152→		return value
   153→	}
   154→	return defaultValue
   155→}
   156→```
   157→
   158→- [ ] **Step 5: 创建数据库连接**
   159→
   160→Create: `backend/pkg/database/database.go`
   161→```go
   162→package database
   163→
   164→import (
   165→	"log"
   166→	"os"
   167→	"path/filepath"
   168→
   169→	"gorm.io/driver/sqlite"
   170→	"gorm.io/gorm"
   171→
   172→	"github.com/ai-payrecord2/backend/internal/model"
   173→)
   174→
   175→var DB *gorm.DB
   176→
   177→func Init(dbPath string) {
   178→	// 确保目录存在
   179→	dir := filepath.Dir(dbPath)
   180→	if err := os.MkdirAll(dir, 0755); err != nil {
   181→		log.Fatalf("Failed to create database directory: %v", err)
   182→	}
   183→
   184→	var err error
   185→	DB, err = sqlite.Open(dbPath)
   186→	if err != nil {
   187→		log.Fatalf("Failed to connect database: %v", err)
   188→	}
   189→
   190→	// 自动迁移
   191→	err = DB.AutoMigrate(
   192→		&model.User{},
   193→		&model.Ledger{},
   194→		&model.Category{},
   195→		&model.Tag{},
   196→		&model.Record{},
   197→		&model.RecordTag{},
   198→		&model.RefreshToken{},
   199→	)
   200→	if err != nil {
   201→		log.Fatalf("Failed to migrate database: %v", err)
   202→	}
   203→
   204→	log.Println("Database connected and migrated successfully")
   205→}
   206→```
   207→
   208→- [ ] **Step 6: 创建统一响应格式**
   209→
   210→Create: `backend/internal/response/response.go`
   211→```go
   212→package response
   213→
   214→import "github.com/gin-gonic/gin"
   215→
   216→type Response struct {
   217→	Code    int         `json:"code"`
   218→	Message string      `json:"message"`
   219→	Data    interface{} `json:"data,omitempty"`
   220→}
   221→
   222→func Success(c *gin.Context, data interface{}) {
   223→	c.JSON(200, Response{
   224→		Code:    0,
   225→		Message: "success",
   226→		Data:    data,
   227→	})
   228→}
   229→
   230→func Error(c *gin.Context, code int, message string) {
   231→	c.JSON(200, Response{
   232→		Code:    code,
   233→		Message: message,
   234→	})
   235→}
   236→
   237→func Error401(c *gin.Context, message string) {
   238→	Error(c, 401, message)
   239→}
   240→
   241→func Error400(c *gin.Context, message string) {
   242→	Error(c, 400, message)
   243→}
   244→
   245→func Error500(c *gin.Context, message string) {
   246→	Error(c, 500, message)
   247→}
   248→```
   249→
   250→- [ ] **Step 7: 创建 main.go**
   251→
   252→Create: `backend/cmd/server/main.go`
   253→```go
   254→package main
   255→
   256→import (
   257→	"log"
   258→
   259→	"github.com/ai-payrecord2/backend/internal/config"
   260→	"github.com/ai-payrecord2/backend/internal/handler"
   261→	"github.com/ai-payrecord2/backend/pkg/database"
   262→	"github.com/gin-gonic/gin"
   263→)
   264→
   265→func main() {
   266→	// 加载配置
   267→	config.Load()
   268→
   269→	// 初始化数据库
   270→	database.Init(config.AppConfig.DBPath)
   271→
   272→	// 初始化路由
   273→	r := gin.Default()
   274→
   275→	// 注册路由
   276→	api := r.Group("/api/v1")
   277→	{
   278→		authHandler := handler.NewAuthHandler()
   279→		auth := api.Group("/auth")
   280→		{
   281→			auth.POST("/register", authHandler.Register)
   282→			auth.POST("/login", authHandler.Login)
   283→			auth.POST("/refresh", authHandler.Refresh)
   284→			auth.POST("/logout", authHandler.Logout)
   285→		}
   286→
   287→		// 需要认证的路由
   288→		userHandler := handler.NewUserHandler()
   289→		ledgerHandler := handler.NewLedgerHandler()
   290→		categoryHandler := handler.NewCategoryHandler()
   291→		tagHandler := handler.NewTagHandler()
   292→		recordHandler := handler.NewRecordHandler()
   293→		llmHandler := handler.NewLLMHandler()
   294→		statsHandler := handler.NewStatsHandler()
   295→
   296→		protected := api.Group("")
   297→		protected.Use(handler.AuthMiddleware())
   298→		{
   299→			// 用户
   300→			protected.GET("/user/profile", userHandler.Profile)
   301→
   302→			// 账本
   303→			protected.GET("/ledgers", ledgerHandler.List)
   304→			protected.GET("/ledgers/current", ledgerHandler.Current)
   305→			protected.POST("/ledgers", ledgerHandler.Create)
   306→			protected.PUT("/ledgers/:id", ledgerHandler.Update)
   307→			protected.DELETE("/ledgers/:id", ledgerHandler.Delete)
   308→			protected.POST("/ledgers/:id/switch", ledgerHandler.Switch)
   309→
   310→			// 分类
   311→			protected.GET("/categories", categoryHandler.List)
   312→			protected.POST("/categories", categoryHandler.Create)
   313→			protected.PUT("/categories/:id", categoryHandler.Update)
   314→			protected.DELETE("/categories/:id", categoryHandler.Delete)
   315→
   316→			// 标签
   317→			protected.GET("/tags", tagHandler.List)
   318→			protected.POST("/tags", tagHandler.Create)
   319→			protected.PUT("/tags/:id", tagHandler.Update)
   320→			protected.DELETE("/tags/:id", tagHandler.Delete)
   321→
   322→			// 记录
   323→			protected.GET("/records", recordHandler.List)
   324→			protected.GET("/records/:id", recordHandler.Get)
   325→			protected.POST("/records", recordHandler.Create)
   326→			protected.PUT("/records/:id", recordHandler.Update)
   327→			protected.DELETE("/records/:id", recordHandler.Delete)
   328→
   329→			// LLM
   330→			protected.GET("/llm/categories", llmHandler.Categories)
   331→			protected.POST("/llm/parse", llmHandler.Parse)
   332→			protected.POST("/llm/records", llmHandler.CreateRecord)
   333→
   334→			// 统计
   335→			protected.GET("/stats/summary", statsHandler.Summary)
   336→			protected.GET("/stats/by-category", statsHandler.ByCategory)
   337→			protected.GET("/stats/by-tag", statsHandler.ByTag)
   338→			protected.GET("/stats/monthly", statsHandler.Monthly)
   339→			protected.GET("/stats/daily", statsHandler.Daily)
   340→			protected.GET("/stats/monthly-detail", statsHandler.MonthlyDetail)
   341→		}
   342→	}
   343→
   344→	// 启动服务
   345→	log.Printf("Server starting on port %d", config.AppConfig.Port)
   346→	r.Run()
   347→}
   348→```
   349→
   350→- [ ] **Step 8: 提交代码**
   351→
   352→```bash
   353→cd /Users/karsa/proj/ai-payrecord2
   354→git add backend/
   355→git commit -m "feat: 初始化后端项目结构
   356→
   357→- 添加 Go module 和依赖
   358→- 创建配置加载模块
   359→- 创建数据库连接和自动迁移
   360→- 创建统一响应格式
   361→- 创建 main.go 入口文件
   362→
   363→Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
   364→```
   365→
   366→---
   367→
   368→## Chunk 2: 数据模型定义
   369→
   370→### Task 2: 创建数据模型
   371→
   372→- [ ] **Step 1: 创建 User 模型**
   373→
   374→Create: `backend/internal/model/user.go`
   375→```go
   376→package model
   377→
   378→import "time"
   379→
   380→type User struct {
   381→	ID              uint      `gorm:"primaryKey" json:"id"`
   382→	Username        string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
   383→	PasswordHash    string    `gorm:"size:255;not null" json:"-"`
   384→	CurrentLedgerID *uint    `json:"current_ledger_id,omitempty"`
   385→	CreatedAt       time.Time `json:"created_at"`
   386→	UpdatedAt       time.Time `json:"updated_at"`
   387→}
   388→```
   389→
   390→- [ ] **Step 2: 创建 Ledger 模型**
   391→
   392→Create: `backend/internal/model/ledger.go`
   393→```go
   394→package model
   395→
   396→import "time"
   397→
   398→type Ledger struct {
   399→	ID        uint      `gorm:"primaryKey" json:"id"`
   400→	UserID    uint      `gorm:"index;not null" json:"user_id"`
   401→	Name      string    `gorm:"size:100;not null" json:"name"`
   402→	CreatedAt time.Time `json:"created_at"`
   403→	UpdatedAt time.Time `json:"updated_at"`
   404→}
   405→```
   406→
   407→- [ ] **Step 3: 创建 Category 模型**
   408→
   409→Create: `backend/internal/model/category.go`
   410→```go
   411→package model
   412→
   413→import "time"
   414→
   415→type Category struct {
   416→	ID        uint      `gorm:"primaryKey" json:"id"`
   417→	UserID    *uint     `gorm:"index" json:"user_id"` // NULL 表示系统预置
   418→	Name      string    `gorm:"size:50;not null" json:"name"`
   419→	Icon      string    `gorm:"size:10" json:"icon"`
   420→	Color     string    `gorm:"size:20" json:"color"`
   421→	Type      int       `gorm:"type:tinyint;not null;default:1" json:"type"` // 1=支出, 2=收入
   422→	IsSystem  bool      `gorm:"not null;default:false" json:"is_system"`
   423→	CreatedAt time.Time `json:"created_at"`
   424→}
   425→```
   426→
   427→- [ ] **Step 4: 创建 Tag 模型**
   428→
   429→Create: `backend/internal/model/tag.go`
   430→```go
   431→package model
   432→
   433→import "time"
   434→
   435→type Tag struct {
   436→	ID        uint      `gorm:"primaryKey" json:"id"`
   437→	UserID    *uint     `gorm:"index" json:"user_id"` // NULL 表示系统预置
   438→	Name      string    `gorm:"size:20;not null" json:"name"`
   439→	Color     string    `gorm:"size:20" json:"color"`
   440→	IsSystem  bool      `gorm:"not null;default:false" json:"is_system"`
   441→	CreatedAt time.Time `json:"created_at"`
   442→}
   443→```
   444→
   445→- [ ] **Step 5: 创建 Record 模型**
   446→
   447→Create: `backend/internal/model/record.go`
   448→```go
   449→package model
   450→
   451→import "time"
   452→
   453→type Record struct {
   454→	ID         uint      `gorm:"primaryKey" json:"id"`
   455→	LedgerID   uint      `gorm:"index;not null" json:"ledger_id"`
   456→	CategoryID uint      `gorm:"index;not null" json:"category_id"`
   457→	Amount     float64   `gorm:"type:decimal(12,2);not null" json:"amount"`
   458→	Type       int       `gorm:"type:tinyint;not null" json:"type"` // 1=支出, 2=收入
   459→	Remark     string    `gorm:"size:500" json:"remark"`
   460→	CreatedAt  time.Time `gorm:"index" json:"created_at"`
   461→}
   462→```
   463→
   464→- [ ] **Step 6: 创建 RecordTag 关联模型**
   465→
   466→Create: `backend/internal/model/record_tag.go`
   467→```go
   468→package model
   469→
   470→type RecordTag struct {
   471→	RecordID uint `gorm:"primaryKey" json:"record_id"`
   472→	TagID    uint `gorm:"primaryKey" json:"tag_id"`
   473→}
   474→```
   475→
   476→- [ ] **Step 7: 创建 RefreshToken 模型**
   477→
   478→Create: `backend/internal/model/token.go`
   479→```go
   480→package model
   481→
   482→import "time"
   483→
   484→type RefreshToken struct {
   485→	ID        uint      `gorm:"primaryKey" json:"id"`
   486→	UserID    uint      `gorm:"index;not null" json:"user_id"`
   487→	Token     string    `gorm:"size:255;not null" json:"-"`
   488→	ExpiresAt time.Time `json:"expires_at"`
   489→	CreatedAt time.Time `json:"created_at"`
   490→}
   491→```
   492→
   493→- [ ] **Step 8: 提交代码**
   494→
   495→```bash
   496→git add backend/internal/model/
   497→git commit -m "feat: 添加数据模型定义
   498→
   499→- User 用户模型
   500→- Ledger 账本模型
   501→- Category 分类模型（含 type 字段）
   502→- Tag 标签模型
   503→- Record 记录模型
   504→- RecordTag 记录-标签关联
   505→- RefreshToken 刷新令牌模型
   506→
   507→Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
   508→```
   509→
   510→---
   511→
   512→## Chunk 3: 认证模块
   513→
   514→### Task 3: 实现认证服务
   515→
   516→- [ ] **Step 1: 创建密码工具**
   517→
   518→Create: `backend/pkg/utils/bcrypt.go`
   519→```go
   520→package utils
   521→
   522→import "golang.org/x/crypto/bcrypt"
   523→
   524→func HashPassword(password string) (string, error) {
   525→	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
   526→	return string(bytes), err
   527→}
   528→
   529→func CheckPassword(password, hash string) bool {
   530→	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
   531→	return err == nil
   532→}
   533→```
   534→
   535→- [ ] **Step 2: 创建 JWT 中间件**
   536→
   537→Create: `backend/internal/middleware/auth.go`
   538→```go
   539→package middleware
   540→
   541→import (
   542→	"net/http"
   543→	"strings"
   544→
   545→	"github.com/gin-gonic/gin"
   546→	"github.com/golang-jwt/jwt/v5"
   547→
   548→	"github.com/ai-payrecord2/backend/internal/config"
   549→	"github.com/ai-payrecord2/backend/internal/response"
   550→)
   551→
   552→type Claims struct {
   553→	UserID uint `json:"user_id"`
   554→	jwt.RegisteredClaims
   555→}
   556→
   557→func AuthMiddleware() gin.HandlerFunc {
   558→	return func(c *gin.Context) {
   559→		authHeader := c.GetHeader("Authorization")
   560→		if authHeader == "" {
   561→			response.Error401(c, "Authorization header required")
   562→			c.Abort()
   563→			return
   564→		}
   565→
   566→		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
   567→		if tokenString == authHeader {
   568→			response.Error401(c, "Invalid authorization format")
   569→			c.Abort()
   570→			return
   571→		}
   572→
   573→		claims := &Claims{}
   574→		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
   575→			return []byte(config.AppConfig.JWTSecret), nil
   576→		})
   577→
   578→		if err != nil || !token.Valid {
   579→			response.Error401(c, "Invalid token")
   580→			c.Abort()
   581→			return
   582→		}
   583→
   584→		c.Set("user_id", claims.UserID)
   585→		c.Next()
   586→	}
   587→}
   588→
   589→func GetUserID(c *gin.Context) uint {
   590→	userID, exists := c.Get("user_id")
   591→	if !exists {
   592→		return 0
   593→	}
   594→	return userID.(uint)
   595→}
   596→```
   597→
   598→- [ ] **Step 3: 创建 Auth Service**
   599→
   600→Create: `backend/internal/service/auth.go`
   601→```go
   602→package service
   603→
   604→import (
   605→	"errors"
   606→	"time"
   607→
   608→	"github.com/golang-jwt/jwt/v5"
   609→	"gorm.io/gorm"
   610→
   611→	"github.com/ai-payrecord2/backend/internal/config"
   612→	"github.com/ai-payrecord2/backend/internal/model"
   613→	"github.com/ai-payrecord2/backend/pkg/utils"
   614→)
   615→
   616→type AuthService struct {
   617→	db *gorm.DB
   618→}
   619→
   620→func NewAuthService(db *gorm.DB) *AuthService {
   621→	return &AuthService{db: db}
   622→}
   623→
   624→func (s *AuthService) Register(username, password string) (*model.User, error) {
   625→	// 检查用户名是否已存在
   626→	var count int64
   627→	s.db.Model(&model.User{}).Where("username = ?", username).Count(&count)
   628→	if count > 0 {
   629→		return nil, errors.New("用户名已存在")
   630→	}
   631→
   632→	// 加密密码
   633→	hash, err := utils.HashPassword(password)
   634→	if err != nil {
   635→		return nil, err
   636→	}
   637→
   638→	// 创建用户
   639→	user := &model.User{
   640→		Username:     username,
   641→		PasswordHash: hash,
   642→	}
   643→	if err := s.db.Create(user).Error; err != nil {
   644→		return nil, err
   645→	}
   646→
   647→	// 创建默认账本
   648→	ledger := &model.Ledger{
   649→		UserID: user.ID,
   650→		Name:   "默认账本",
   651→	}
   652→	s.db.Create(ledger)
   653→
   654→	// 更新用户的当前账本
   655→	s.db.Model(user).Update("current_ledger_id", ledger.ID)
   656→
   657→	// 创建预置分类
   658→	s.createDefaultCategories(user.ID)
   659→
   660→	// 创建预置标签
   661→	s.createDefaultTags(user.ID)
   662→
   663→	return user, nil
   664→}
   665→
   666→func (s *AuthService) Login(username, password string) (*model.User, string, string, error) {
   667→	var user model.User
   668→	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
   669→		if errors.Is(err, gorm.ErrRecordNotFound) {
   670→			return nil, "", "", errors.New("用户名或密码错误")
   671→		}
   672→		return nil, "", "", err
   673→	}
   674→
   675→	if !utils.CheckPassword(password, user.PasswordHash) {
   676→		return nil, "", "", errors.New("用户名或密码错误")
   677→	}
   678→
   679→	// 生成 JWT Token
   680→	accessToken, err := s.generateJWT(user.ID)
   681→	if err != nil {
   682→		return nil, "", "", err
   683→	}
   684→
   685→	// 生成 Refresh Token
   686→	refreshToken, err := s.generateRefreshToken(user.ID)
   687→	if err != nil {
   688→		return nil, "", "", err
   689→	}
   690→
   691→	return &user, accessToken, refreshToken, nil
   692→}
   693→
   694→func (s *AuthService) Refresh(refreshToken string) (string, string, error) {
   695→	// 查找 refresh token
   696→	var token model.RefreshToken
   697→	if err := s.db.Where("token = ? AND expires_at > ?", refreshToken, time.Now()).First(&token).Error; err != nil {
   698→		if errors.Is(err, gorm.ErrRecordNotFound) {
   699→			return "", "", errors.New("Invalid refresh token")
   700→		}
   701→		return "", "", err
   702→	}
   703→
   704→	// 删除旧的 refresh token
   705→	s.db.Delete(&token)
   706→
   707→	// 生成新的 tokens
   708→	userID := token.UserID
   709→	accessToken, err := s.generateJWT(userID)
   710→	if err != nil {
   711→		return "", "", err
   712→	}
   713→
   714→	newRefreshToken, err := s.generateRefreshToken(userID)
   715→	if err != nil {
   716→		return "", "", err
   717→	}
   718→
   719→	return accessToken, newRefreshToken, nil
   720→}
   721→
   722→func (s *AuthService) Logout(userID uint, refreshToken string) error {
   723→	// 删除对应的 refresh token
   724→	return s.db.Where("user_id = ? AND token = ?", userID, refreshToken).Delete(&model.RefreshToken{}).Error
   725→}
   726→
   727→func (s *AuthService) generateJWT(userID uint) (string, error) {
   728→	claims := &Claims{
   729→		UserID: userID,
   730→		RegisteredClaims: jwt.RegisteredClaims{
   731→			ExpiresAt: jwt.NewNumericDate(time.Now().Add(config.AppConfig.JWTExpireHours)),
   732→			IssuedAt:  jwt.NewNumericDate(time.Now()),
   733→		},
   734→	}
   735→	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
   736→	return token.SignedString([]byte(config.AppConfig.JWTSecret))
   737→}
   738→
   739→func (s *AuthService) generateRefreshToken(userID uint) (string, error) {
   740→	claims := jwt.RegisteredClaims{
   741→		ExpiresAt: jwt.NewNumericDate(time.Now().Add(config.AppConfig.RefreshTokenExpireHours)),
   742→		IssuedAt:  jwt.NewNumericDate(time.Now()),
   743→	}
   744→	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
   745→	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
   746→	if err != nil {
   747→		return "", err
   748→	}
   749→
   750→	// 存储 refresh token
   751→	rt := &model.RefreshToken{
   752→		UserID:    userID,
   753→		Token:     tokenString,
   754→		ExpiresAt: time.Now().Add(config.AppConfig.RefreshTokenExpireHours),
   755→	}
   756→	s.db.Create(rt)
   757→
   758→	return tokenString, nil
   759→}
   760→
   761→func (s *AuthService) createDefaultCategories(userID uint) {
   762→	categories := []model.Category{
   763→		{UserID: &userID, Name: "餐饮", Icon: "🍜", Color: "#FF6B6B", Type: 1, IsSystem: true},
   764→		{UserID: &userID, Name: "交通", Icon: "🚗", Color: "#4ECDC4", Type: 1, IsSystem: true},
   765→		{UserID: &userID, Name: "购物", Icon: "🛍️", Color: "#45B7D1", Type: 1, IsSystem: true},
   766→		{UserID: &userID, Name: "居住", Icon: "🏠", Color: "#96CEB4", Type: 1, IsSystem: true},
   767→		{UserID: &userID, Name: "教育", Icon: "📚", Color: "#FFEAA7", Type: 1, IsSystem: true},
   768→		{UserID: &userID, Name: "医疗", Icon: "💊", Color: "#DDA0DD", Type: 1, IsSystem: true},
   769→		{UserID: &userID, Name: "娱乐", Icon: "🎮", Color: "#98D8C8", Type: 1, IsSystem: true},
   770→		{UserID: &userID, Name: "人情", Icon: "🎁", Color: "#F7DC6F", Type: 1, IsSystem: true},
   771→		{UserID: &userID, Name: "投资", Icon: "📈", Color: "#BB8FCE", Type: 1, IsSystem: true},
   772→		{UserID: &userID, Name: "通讯", Icon: "📱", Color: "#85C1E9", Type: 1, IsSystem: true},
   773→		{UserID: &userID, Name: "日用", Icon: "📦", Color: "#F8B500", Type: 1, IsSystem: true},
   774→		{UserID: &userID, Name: "其他", Icon: "➖", Color: "#95A5A6", Type: 1, IsSystem: true},
   775→		{UserID: &userID, Name: "工资", Icon: "💰", Color: "#2ECC71", Type: 2, IsSystem: true},
   776→		{UserID: &userID, Name: "奖金", Icon: "🎉", Color: "#1ABC9C", Type: 2, IsSystem: true},
   777→	}
   778→	for _, c := range categories {
   779→		s.db.Create(&c)
   780→	}
   781→}
   782→
   783→func (s *AuthService) createDefaultTags(userID uint) {
   784→	tags := []model.Tag{
   785→		{UserID: &userID, Name: "重要", Color: "#E74C3C", IsSystem: true},
   786→		{UserID: &userID, Name: "报销", Color: "#3498DB", IsSystem: true},
   787→		{UserID: &userID, Name: "定期", Color: "#27AE60", IsSystem: true},
   788→		{UserID: &userID, Name: "人情", Color: "#E91E63", IsSystem: true},
   789→		{UserID: &userID, Name: "刚需", Color: "#F39C12", IsSystem: true},
   790→	}
   791→	for _, t := range tags {
   792→		s.db.Create(&t)
   793→	}
   794→}
   795→```
   796→
   797→- [ ] **Step 4: 创建 Auth Handler**
   798→
   799→Create: `backend/internal/handler/auth.go`
   800→```go
   801→package handler
   802→
   803→import (
   804→	"net/http"
   805→
   806→	"github.com/gin-gonic/gin"
   807→
   808→	"github.com/ai-payrecord2/backend/internal/middleware"
   809→	"github.com/ai-payrecord2/backend/internal/response"
   810→	"github.com/ai-payrecord2/backend/internal/service"
   811→	"github.com/ai-payrecord2/backend/pkg/database"
   812→)
   813→
   814→type AuthHandler struct {
   815→	service *service.AuthService
   816→}
   817→
   818→func NewAuthHandler() *AuthHandler {
   819→	return &AuthHandler{
   820→		service: service.NewAuthService(database.DB),
   821→	}
   822→}
   823→
   824→type RegisterRequest struct {
   825→	Username string `json:"username" binding:"required,min=3,max=50"`
   826→	Password string `json:"password" binding:"required,min=6"`
   827→}
   828→
   829→type LoginRequest struct {
   830→	Username string `json:"username" binding:"required"`
   831→	Password string `json:"password" binding:"required"`
   832→}
   833→
   834→type RefreshRequest struct {
   835→	RefreshToken string `json:"refresh_token" binding:"required"`
   836→}
   837→
   838→type LogoutRequest struct {
   839→	RefreshToken string `json:"refresh_token" binding:"required"`
   840→}
   841→
   842→func (h *AuthHandler) Register(c *gin.Context) {
   843→	var req RegisterRequest
   844→	if err := c.ShouldBindJSON(&req); err != nil {
   845→		response.Error400(c, "请求参数错误: "+err.Error())
   846→		return
   847→	}
   848→
   849→	user, err := h.service.Register(req.Username, req.Password)
   850→	if err != nil {
   851→		response.Error400(c, err.Error())
   852→		return
   853→	}
   854→
   855→	response.Success(c, gin.H{
   856→		"user": gin.H{
   857→			"id":       user.ID,
   858→			"username": user.Username,
   859→		},
   860→	})
   861→}
   862→
   863→func (h *AuthHandler) Login(c *gin.Context) {
   864→	var req LoginRequest
   865→	if err := c.ShouldBindJSON(&req); err != nil {
   866→		response.Error400(c, "请求参数错误: "+err.Error())
   867→		return
   868→	}
   869→
   870→	user, accessToken, refreshToken, err := h.service.Login(req.Username, req.Password)
   871→	if err != nil {
   872→		response.Error401(c, err.Error())
   873→		return
   874→	}
   875→
   876→	response.Success(c, gin.H{
   877→		"user": gin.H{
   878→			"id":                user.ID,
   879→			"username":          user.Username,
   880→			"current_ledger_id": user.CurrentLedgerID,
   881→		},
   882→		"access_token":  accessToken,
   883→		"refresh_token": refreshToken,
   884→	})
   885→}
   886→
   887→func (h *AuthHandler) Refresh(c *gin.Context) {
   888→	var req RefreshRequest
   889→	if err := c.ShouldBindJSON(&req); err != nil {
   890→		response.Error400(c, "请求参数错误: "+err.Error())
   891→		return
   892→	}
   893→
   894→	accessToken, refreshToken, err := h.service.Refresh(req.RefreshToken)
   895→	if err != nil {
   896→		response.Error401(c, err.Error())
   897→		return
   898→	}
   899→
   900→	response.Success(c, gin.H{
   901→		"access_token":  accessToken,
   902→		"refresh_token": refreshToken,
   903→	})
   904→}
   905→
   906→func (h *AuthHandler) Logout(c *gin.Context) {
   907→	var req LogoutRequest
   908→	if err := c.ShouldBindJSON(&req); err != nil {
   909→		response.Error400(c, "请求参数错误: "+err.Error())
   910→		return
   911→	}
   912→
   913→	userID := middleware.GetUserID(c)
   914→	if err := h.service.Logout(userID, req.RefreshToken); err != nil {
   915→		response.Error500(c, "登出失败")
   916→		return
   917→	}
   918→
   919→	response.Success(c, nil)
   920→}
   921→
   922→func AuthMiddleware() gin.HandlerFunc {
   923→	return middleware.AuthMiddleware()
   924→}
   925→```
   926→
   927→- [ ] **Step 5: 测试编译**
   928→
   929→Run:
   930→```bash
   931→cd /Users/karsa/proj/ai-payrecord2/backend
   932→go build -o server ./cmd/server
   933→```
   934→
   935→- [ ] **Step 6: 提交代码**
   936→
   937→```bash
   938→git add backend/
   939→git commit -m "feat: 实现认证模块
   940→
   941→- 添加密码加密工具
   942→- 实现 JWT 中间件
   943→- 实现 Auth Service（注册、登录、刷新token、登出）
   944→- 实现 Auth Handler
   945→- 用户注册时创建默认账本和预置数据
   946→
   947→Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
   948→```
   949→
   950→---
   951→
   952→## Chunk 4: 账本和用户模块
   953→
   954→### Task 4: 实现账本和用户接口
   955→
   956→- [ ] **Step 1: 创建 User Service**
   957→
   958→Create: `backend/internal/service/user.go`
   959→```go
   960→package service
   961→
   962→import (
   963→	"gorm.io/gorm"
   964→
   965→	"github.com/ai-payrecord2/backend/internal/model"
   966→)
   967→
   968→type UserService struct {
   969→	db *gorm.DB
   970→}
   971→
   972→func NewUserService(db *gorm.DB) *UserService {
   973→	return &UserService{db: db}
   974→}
   975→
   976→func (s *UserService) GetProfile(userID uint) (*model.User, error) {
   977→	var user model.User
   978→	if err := s.db.First(&user, userID).Error; err != nil {
   979→		return nil, err
   980→	}
   981→	return &user, nil
   982→}
   983→```
   984→
   985→- [ ] **Step 2: 创建 User Handler**
   986→
   987→Create: `backend/internal/handler/user.go`
   988→```go
   989→package handler
   990→
   991→import (
   992→	"github.com/gin-gonic/gin"
   993→
   994→	"github.com/ai-payrecord2/backend/internal/middleware"
   995→	"github.com/ai-payrecord2/backend/internal/response"
   996→	"github.com/ai-payrecord2/backend/internal/service"
   997→	"github.com/ai-payrecord2/backend/pkg/database"
   998→)
   999→
  1000→type UserHandler struct {
  1001→	service *service.UserService
  1002→}
  1003→
  1004→func NewUserHandler() *UserHandler {
  1005→	return &UserHandler{
  1006→		service: service.NewUserService(database.DB),
  1007→	}
  1008→}
  1009→
  1010→func (h *UserHandler) Profile(c *gin.Context) {
  1011→	userID := middleware.GetUserID(c)
  1012→	user, err := h.service.GetProfile(userID)
  1013→	if err != nil {
  1014→		response.Error400(c, "获取用户信息失败")
  1015→		return
  1016→	}
  1017→
  1018→	response.Success(c, gin.H{
  1019→		"id":                user.ID,
  1020→		"username":          user.Username,
  1021→		"current_ledger_id": user.CurrentLedgerID,
  1022→	})
  1023→}
  1024→```
  1025→
  1026→- [ ] **Step 3: 创建 Ledger Service**
  1027→
  1028→Create: `backend/internal/service/ledger.go`
  1029→```go
  1030→package service
  1031→
  1032→import (
  1033→	"errors"
  1034→
  1035→	"gorm.io/gorm"
  1036→
  1037→	"github.com/ai-payrecord2/backend/internal/model"
  1038→)
  1039→
  1040→type LedgerService struct {
  1041→	db *gorm.DB
  1042→}
  1043→
  1044→func NewLedgerService(db *gorm.DB) *LedgerService {
  1045→	return &LedgerService{db: db}
  1046→}
  1047→
  1048→func (s *LedgerService) List(userID uint) ([]model.Ledger, error) {
  1049→	var ledgers []model.Ledger
  1050→	err := s.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&ledgers).Error
  1051→	return ledgers, err
  1052→}
  1053→
  1054→func (s *LedgerService) Get(userID, id uint) (*model.Ledger, error) {
  1055→	var ledger model.Ledger
  1056→	err := s.db.Where("id = ? AND user_id = ?", id, userID).First(&ledger).Error
  1057→	if err != nil {
  1058→		return nil, err
  1059→	}
  1060→	return &ledger, nil
  1061→}
  1062→
  1063→func (s *LedgerService) Current(userID uint) (*model.Ledger, error) {
  1064→	var user model.User
  1065→	if err := s.db.First(&user, userID).Error; err != nil {
  1066→		return nil, err
  1067→	}
  1068→	if user.CurrentLedgerID == nil {
  1069→		return nil, errors.New("no current ledger")
  1070→	}
  1071→	return s.Get(userID, *user.CurrentLedgerID)
  1072→}
  1073→
  1074→func (s *LedgerService) Create(userID uint, name string) (*model.Ledger, error) {
  1075→	ledger := &model.Ledger{
  1076→		UserID: userID,
  1077→		Name:   name,
  1078→	}
  1079→	err := s.db.Create(ledger).Error
  1080→	return ledger, err
  1081→}
  1082→
  1083→func (s *LedgerService) Update(userID, id uint, name string) (*model.Ledger, error) {
  1084→	ledger, err := s.Get(userID, id)
  1085→	if err != nil {
  1086→		return nil, err
  1087→	}
  1088→	ledger.Name = name
  1089→	err = s.db.Save(ledger).Error
  1090→	return ledger, err
  1091→}
  1092→
  1093→func (s *LedgerService) Delete(userID, id uint) error {
  1094→	// 删除账本下的所有记录
  1095→	s.db.Where("ledger_id = ?", id).Delete(&model.Record{})
  1096→	return s.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Ledger{}).Error
  1097→}
  1098→
  1099→func (s *LedgerService) Switch(userID, id uint) (*model.Ledger, error) {
  1100→	// 验证账本存在且属于用户
  1101→	_, err := s.Get(userID, id)
  1102→	if err != nil {
  1103→		return nil, err
  1104→	}
  1105→
  1106→	// 更新用户的当前账本
  1107→	err = s.db.Model(&model.User{}).Where("id = ?", userID).Update("current_ledger_id", id).Error
  1108→	if err != nil {
  1109→		return nil, err
  1110→	}
  1111→
  1112→	return s.Get(userID, id)
  1113→}
  1114→```
  1115→
  1116→- [ ] **Step 4: 创建 Ledger Handler**
  1117→
  1118→Create: `backend/internal/handler/ledger.go`
  1119→```go
  1120→package handler
  1121→
  1122→import (
  1123→	"strconv"
  1124→
  1125→	"github.com/gin-gonic/gin"
  1126→
  1127→	"github.com/ai-payrecord2/backend/internal/middleware"
  1128→	"github.com/ai-payrecord2/backend/internal/response"
  1129→	"github.com/ai-payrecord2/backend/internal/service"
  1130→	"github.com/ai-payrecord2/backend/pkg/database"
  1131→)
  1132→
  1133→type LedgerHandler struct {
  1134→	service *service.LedgerService
  1135→}
  1136→
  1137→func NewLedgerHandler() *LedgerHandler {
  1138→	return &LedgerHandler{
  1139→		service: service.NewLedgerService(database.DB),
  1140→	}
  1141→}
  1142→
  1143→type CreateLedgerRequest struct {
  1144→	Name string `json:"name" binding:"required,min=1,max=100"`
  1145→}
  1146→
  1147→type UpdateLedgerRequest struct {
  1148→	Name string `json:"name" binding:"required,min=1,max=100"`
  1149→}
  1150→
  1151→func (h *LedgerHandler) List(c *gin.Context) {
  1152→	userID := middleware.GetUserID(c)
  1153→	ledgers, err := h.service.List(userID)
  1154→	if err != nil {
  1155→		response.Error400(c, "获取账本列表失败")
  1156→		return
  1157→	}
  1158→	response.Success(c, ledgers)
  1159→}
  1160→
  1161→func (h *LedgerHandler) Current(c *gin.Context) {
  1162→	userID := middleware.GetUserID(c)
  1163→	ledger, err := h.service.Current(userID)
  1164→	if err != nil {
  1165→		response.Error400(c, "获取当前账本失败")
  1166→		return
  1167→	}
  1168→	response.Success(c, ledger)
  1169→}
  1170→
  1171→func (h *LedgerHandler) Create(c *gin.Context) {
  1172→	userID := middleware.GetUserID(c)
  1173→	var req CreateLedgerRequest
  1174→	if err := c.ShouldBindJSON(&req); err != nil {
  1175→		response.Error400(c, "请求参数错误")
  1176→		return
  1177→	}
  1178→
  1179→	ledger, err := h.service.Create(userID, req.Name)
  1180→	if err != nil {
  1181→		response.Error400(c, "创建账本失败")
  1182→		return
  1183→	}
  1184→	response.Success(c, ledger)
  1185→}
  1186→
  1187→func (h *LedgerHandler) Update(c *gin.Context) {
  1188→	userID := middleware.GetUserID(c)
  1189→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1190→
  1191→	var req UpdateLedgerRequest
  1192→	if err := c.ShouldBindJSON(&req); err != nil {
  1193→		response.Error400(c, "请求参数错误")
  1194→		return
  1195→	}
  1196→
  1197→	ledger, err := h.service.Update(userID, uint(id), req.Name)
  1198→	if err != nil {
  1199→		response.Error400(c, "更新账本失败")
  1200→		return
  1201→	}
  1202→	response.Success(c, ledger)
  1203→}
  1204→
  1205→func (h *LedgerHandler) Delete(c *gin.Context) {
  1206→	userID := middleware.GetUserID(c)
  1207→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1208→
  1209→	if err := h.service.Delete(userID, uint(id)); err != nil {
  1210→		response.Error400(c, "删除账本失败")
  1211→		return
  1212→	}
  1213→	response.Success(c, nil)
  1214→}
  1215→
  1216→func (h *LedgerHandler) Switch(c *gin.Context) {
  1217→	userID := middleware.GetUserID(c)
  1218→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1219→
  1220→	ledger, err := h.service.Switch(userID, uint(id))
  1221→	if err != nil {
  1222→		response.Error400(c, "切换账本失败")
  1223→		return
  1224→	}
  1225→	response.Success(c, ledger)
  1226→}
  1227→```
  1228→
  1229→- [ ] **Step 5: 编译测试**
  1230→
  1231→Run:
  1232→```bash
  1233→cd /Users/karsa/proj/ai-payrecord2/backend
  1234→go build -o server ./cmd/server
  1235→```
  1236→
  1237→- [ ] **Step 6: 提交代码**
  1238→
  1239→```bash
  1240→git add backend/
  1241→git commit -m "feat: 实现账本和用户模块
  1242→
  1243→- User Service 和 Handler
  1244→- Ledger Service 和 Handler
  1245→- 账本 CRUD 和切换功能
  1246→
  1247→Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
  1248→```
  1249→
  1250→---
  1251→
  1252→## Chunk 5: 分类和标签模块
  1253→
  1254→### Task 5: 实现分类和标签接口
  1255→
  1256→- [ ] **Step 1: 创建 Category Service**
  1257→
  1258→Create: `backend/internal/service/category.go`
  1259→```go
  1260→package service
  1261→
  1262→import (
  1263→	"errors"
  1264→
  1265→	"gorm.io/gorm"
  1266→
  1267→	"github.com/ai-payrecord2/backend/internal/model"
  1268→)
  1269→
  1270→type CategoryService struct {
  1271→	db *gorm.DB
  1272→}
  1273→
  1274→func NewCategoryService(db *gorm.DB) *CategoryService {
  1275→	return &CategoryService{db: db}
  1276→}
  1277→
  1278→func (s *CategoryService) List(userID uint) ([]model.Category, error) {
  1279→	var categories []model.Category
  1280→	err := s.db.Where("user_id = ? OR user_id IS NULL", userID).Order("type, id").Find(&categories).Error
  1281→	return categories, err
  1282→}
  1283→
  1284→func (s *CategoryService) Get(userID, id uint) (*model.Category, error) {
  1285→	var category model.Category
  1286→	err := s.db.Where("(user_id = ? OR user_id IS NULL) AND id = ?", userID, id).First(&category).Error
  1287→	if err != nil {
  1288→		return nil, err
  1289→	}
  1290→	return &category, nil
  1291→}
  1292→
  1293→func (s *CategoryService) Create(userID uint, name, icon, color string, categoryType int) (*model.Category, error) {
  1294→	category := &model.Category{
  1295→		UserID: &userID,
  1296→		Name:   name,
  1297→		Icon:   icon,
  1298→		Color:  color,
  1299→		Type:   categoryType,
  1300→	}
  1301→	err := s.db.Create(category).Error
  1302→	return category, err
  1303→}
  1304→
  1305→func (s *CategoryService) Update(userID, id uint, name, icon, color string) (*model.Category, error) {
  1306→	category, err := s.Get(userID, id)
  1307→	if err != nil {
  1308→		return nil, err
  1309→	}
  1310→	if category.IsSystem {
  1311→		return nil, errors.New("cannot update system category")
  1312→	}
  1313→	if category.UserID == nil || *category.UserID != userID {
  1314→		return nil, errors.New("cannot update other user's category")
  1315→	}
  1316→
  1317→	category.Name = name
  1318→	category.Icon = icon
  1319→	category.Color = color
  1320→	err = s.db.Save(category).Error
  1321→	return category, err
  1322→}
  1323→
  1324→func (s *CategoryService) Delete(userID, id uint) error {
  1325→	category, err := s.Get(userID, id)
  1326→	if err != nil {
  1327→		return err
  1328→	}
  1329→	if category.IsSystem {
  1330→		return errors.New("cannot delete system category")
  1331→	}
  1332→	if category.UserID == nil || *category.UserID != userID {
  1333→		return errors.New("cannot delete other user's category")
  1334→	}
  1335→
  1336→	// 检查是否有记录使用该分类
  1337→	var count int64
  1338→	s.db.Model(&model.Record{}).Where("category_id = ?", id).Count(&count)
  1339→	if count > 0 {
  1340→		return errors.New("该分类下有记录，无法删除")
  1341→	}
  1342→
  1343→	return s.db.Delete(category).Error
  1344→}
  1345→```
  1346→
  1347→- [ ] **Step 2: 创建 Category Handler**
  1348→
  1349→Create: `backend/internal/handler/category.go`
  1350→```go
  1351→package handler
  1352→
  1353→import (
  1354→	"strconv"
  1355→
  1356→	"github.com/gin-gonic/gin"
  1357→
  1358→	"github.com/ai-payrecord2/backend/internal/middleware"
  1359→	"github.com/ai-payrecord2/backend/internal/response"
  1360→	"github.com/ai-payrecord2/backend/internal/service"
  1361→	"github.com/ai-payrecord2/backend/pkg/database"
  1362→)
  1363→
  1364→type CategoryHandler struct {
  1365→	service *service.CategoryService
  1366→}
  1367→
  1368→func NewCategoryHandler() *CategoryHandler {
  1369→	return &CategoryHandler{
  1370→		service: service.NewCategoryService(database.DB),
  1371→	}
  1372→}
  1373→
  1374→type CreateCategoryRequest struct {
  1375→	Name     string `json:"name" binding:"required,min=1,max=50"`
  1376→	Icon     string `json:"icon" binding:"required,max=10"`
  1377→	Color    string `json:"color" binding:"required,max=20"`
  1378→	Type     int    `json:"type" binding:"required,oneof=1 2"`
  1379→}
  1380→
  1381→type UpdateCategoryRequest struct {
  1382→	Name  string `json:"name" binding:"required,min=1,max=50"`
  1383→	Icon  string `json:"icon" binding:"required,max=10"`
  1384→	Color string `json:"color" binding:"required,max=20"`
  1385→}
  1386→
  1387→func (h *CategoryHandler) List(c *gin.Context) {
  1388→	userID := middleware.GetUserID(c)
  1389→	categories, err := h.service.List(userID)
  1390→	if err != nil {
  1391→		response.Error400(c, "获取分类列表失败")
  1392→		return
  1393→	}
  1394→	response.Success(c, categories)
  1395→}
  1396→
  1397→func (h *CategoryHandler) Create(c *gin.Context) {
  1398→	userID := middleware.GetUserID(c)
  1399→	var req CreateCategoryRequest
  1400→	if err := c.ShouldBindJSON(&req); err != nil {
  1401→		response.Error400(c, "请求参数错误")
  1402→		return
  1403→	}
  1404→
  1405→	category, err := h.service.Create(userID, req.Name, req.Icon, req.Color, req.Type)
  1406→	if err != nil {
  1407→		response.Error400(c, "创建分类失败")
  1408→		return
  1409→	}
  1410→	response.Success(c, category)
  1411→}
  1412→
  1413→func (h *CategoryHandler) Update(c *gin.Context) {
  1414→	userID := middleware.GetUserID(c)
  1415→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1416→
  1417→	var req UpdateCategoryRequest
  1418→	if err := c.ShouldBindJSON(&req); err != nil {
  1419→		response.Error400(c, "请求参数错误")
  1420→		return
  1421→	}
  1422→
  1423→	category, err := h.service.Update(userID, uint(id), req.Name, req.Icon, req.Color)
  1424→	if err != nil {
  1425→		response.Error400(c, err.Error())
  1426→		return
  1427→	}
  1428→	response.Success(c, category)
  1429→}
  1430→
  1431→func (h *CategoryHandler) Delete(c *gin.Context) {
  1432→	userID := middleware.GetUserID(c)
  1433→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1434→
  1435→	if err := h.service.Delete(userID, uint(id)); err != nil {
  1436→		response.Error400(c, err.Error())
  1437→		return
  1438→	}
  1439→	response.Success(c, nil)
  1440→}
  1441→```
  1442→
  1443→- [ ] **Step 3: 创建 Tag Service**
  1444→
  1445→Create: `backend/internal/service/tag.go`
  1446→```go
  1447→package service
  1448→
  1449→import (
  1450→	"errors"
  1451→
  1452→	"gorm.io/gorm"
  1453→
  1454→	"github.com/ai-payrecord2/backend/internal/model"
  1455→)
  1456→
  1457→type TagService struct {
  1458→	db *gorm.DB
  1459→}
  1460→
  1461→func NewTagService(db *gorm.DB) *TagService {
  1462→	return &TagService{db: db}
  1463→}
  1464→
  1465→func (s *TagService) List(userID uint) ([]model.Tag, error) {
  1466→	var tags []model.Tag
  1467→	err := s.db.Where("user_id = ? OR user_id IS NULL", userID).Find(&tags).Error
  1468→	return tags, err
  1469→}
  1470→
  1471→func (s *TagService) Get(userID, id uint) (*model.Tag, error) {
  1472→	var tag model.Tag
  1473→	err := s.db.Where("(user_id = ? OR user_id IS NULL) AND id = ?", userID, id).First(&tag).Error
  1474→	if err != nil {
  1475→		return nil, err
  1476→	}
  1477→	return &tag, nil
  1478→}
  1479→
  1480→func (s *TagService) Create(userID uint, name, color string) (*model.Tag, error) {
  1481→	tag := &model.Tag{
  1482→		UserID: &userID,
  1483→		Name:   name,
  1484→		Color:  color,
  1485→	}
  1486→	err := s.db.Create(tag).Error
  1487→	return tag, err
  1488→}
  1489→
  1490→func (s *TagService) Update(userID, id uint, name, color string) (*model.Tag, error) {
  1491→	tag, err := s.Get(userID, id)
  1492→	if err != nil {
  1493→		return nil, err
  1494→	}
  1495→	if tag.IsSystem {
  1496→		return nil, errors.New("cannot update system tag")
  1497→	}
  1498→	if tag.UserID == nil || *tag.UserID != userID {
  1499→		return nil, errors.New("cannot update other user's tag")
  1500→	}
  1501→
  1502→	tag.Name = name
  1503→	tag.Color = color
  1504→	err = s.db.Save(tag).Error
  1505→	return tag, err
  1506→}
  1507→
  1508→func (s *TagService) Delete(userID, id uint) error {
  1509→	tag, err := s.Get(userID, id)
  1510→	if err != nil {
  1511→		return err
  1512→	}
  1513→	if tag.IsSystem {
  1514→		return errors.New("cannot delete system tag")
  1515→	}
  1516→	if tag.UserID == nil || *tag.UserID != userID {
  1517→		return errors.New("cannot delete other user's tag")
  1518→	}
  1519→
  1520→	// 删除标签关联
  1521→	s.db.Where("tag_id = ?", id).Delete(&model.RecordTag{})
  1522→
  1523→	return s.db.Delete(tag).Error
  1524→}
  1525→```
  1526→
  1527→- [ ] **Step 4: 创建 Tag Handler**
  1528→
  1529→Create: `backend/internal/handler/tag.go`
  1530→```go
  1531→package handler
  1532→
  1533→import (
  1534→	"strconv"
  1535→
  1536→	"github.com/gin-gonic/gin"
  1537→
  1538→	"github.com/ai-payrecord2/backend/internal/middleware"
  1539→	"github.com/ai-payrecord2/backend/internal/response"
  1540→	"github.com/ai-payrecord2/backend/internal/service"
  1541→	"github.com/ai-payrecord2/backend/pkg/database"
  1542→)
  1543→
  1544→type TagHandler struct {
  1545→	service *service.TagService
  1546→}
  1547→
  1548→func NewTagHandler() *TagHandler {
  1549→	return &TagHandler{
  1550→		service: service.NewTagService(database.DB),
  1551→	}
  1552→}
  1553→
  1554→type CreateTagRequest struct {
  1555→	Name  string `json:"name" binding:"required,min=1,max=20"`
  1556→	Color string `json:"color" binding:"required,max=20"`
  1557→}
  1558→
  1559→type UpdateTagRequest struct {
  1560→	Name  string `json:"name" binding:"required,min=1,max=20"`
  1561→	Color string `json:"color" binding:"required,max=20"`
  1562→}
  1563→
  1564→func (h *TagHandler) List(c *gin.Context) {
  1565→	userID := middleware.GetUserID(c)
  1566→	tags, err := h.service.List(userID)
  1567→	if err != nil {
  1568→		response.Error400(c, "获取标签列表失败")
  1569→		return
  1570→	}
  1571→	response.Success(c, tags)
  1572→}
  1573→
  1574→func (h *TagHandler) Create(c *gin.Context) {
  1575→	userID := middleware.GetUserID(c)
  1576→	var req CreateTagRequest
  1577→	if err := c.ShouldBindJSON(&req); err != nil {
  1578→		response.Error400(c, "请求参数错误")
  1579→		return
  1580→	}
  1581→
  1582→	tag, err := h.service.Create(userID, req.Name, req.Color)
  1583→	if err != nil {
  1584→		response.Error400(c, "创建标签失败")
  1585→		return
  1586→	}
  1587→	response.Success(c, tag)
  1588→}
  1589→
  1590→func (h *TagHandler) Update(c *gin.Context) {
  1591→	userID := middleware.GetUserID(c)
  1592→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1593→
  1594→	var req UpdateTagRequest
  1595→	if err := c.ShouldBindJSON(&req); err != nil {
  1596→		response.Error400(c, "请求参数错误")
  1597→		return
  1598→	}
  1599→
  1600→	tag, err := h.service.Update(userID, uint(id), req.Name, req.Color)
  1601→	if err != nil {
  1602→		response.Error400(c, err.Error())
  1603→		return
  1604→	}
  1605→	response.Success(c, tag)
  1606→}
  1607→
  1608→func (h *TagHandler) Delete(c *gin.Context) {
  1609→	userID := middleware.GetUserID(c)
  1610→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1611→
  1612→	if err := h.service.Delete(userID, uint(id)); err != nil {
  1613→		response.Error400(c, err.Error())
  1614→		return
  1615→	}
  1616→	response.Success(c, nil)
  1617→}
  1618→```
  1619→
  1620→- [ ] **Step 5: 编译测试**
  1621→
  1622→Run:
  1623→```bash
  1624→cd /Users/karsa/proj/ai-payrecord2/backend
  1625→go build -o server ./cmd/server
  1626→```
  1627→
  1628→- [ ] **Step 6: 提交代码**
  1629→
  1630→```bash
  1631→git add backend/
  1632→git commit -m "feat: 实现分类和标签模块
  1633→
  1634→- Category Service 和 Handler
  1635→- Tag Service 和 Handler
  1636→- 分类/标签 CRUD 功能
  1637→
  1638→Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
  1639→```
  1640→
  1641→---
  1642→
  1643→## Chunk 6: 记录模块
  1644→
  1645→### Task 6: 实现记录 CRUD 接口
  1646→
  1647→- [ ] **Step 1: 创建 Record Service**
  1648→
  1649→Create: `backend/internal/service/record.go`
  1650→```go
  1651→package service
  1652→
  1653→import (
  1654→	"strconv"
  1655→
  1656→	"gorm.io/gorm"
  1657→
  1658→	"github.com/ai-payrecord2/backend/internal/model"
  1659→)
  1660→
  1661→type RecordService struct {
  1662→	db *gorm.DB
  1663→}
  1664→
  1665→func NewRecordService(db *gorm.DB) *RecordService {
  1666→	return &RecordService{db: db}
  1667→}
  1668→
  1669→type RecordWithDetails struct {
  1670→	model.Record
  1671→	CategoryName  string      `json:"category_name"`
  1672→	CategoryIcon  string      `json:"category_icon"`
  1673→	CategoryColor string      `json:"category_color"`
  1674→	Tags          []model.Tag `json:"tags"`
  1675→}
  1676→
  1677→func (s *RecordService) List(userID uint, ledgerID *uint, cursor uint, limit int) ([]RecordWithDetails, uint, bool, error) {
  1678→	if limit <= 0 {
  1679→		limit = 20
  1680→	}
  1681→	if limit > 100 {
  1682→		limit = 100
  1683→	}
  1684→
  1685→	// 获取用户的当前账本
  1686→	var currentLedgerID uint
  1687→	if ledgerID != nil {
  1688→		currentLedgerID = *ledgerID
  1689→	} else {
  1690→		var user model.User
  1691→		if err := s.db.First(&user, userID).Error; err != nil {
  1692→			return nil, 0, false, err
  1693→		}
  1694→		if user.CurrentLedgerID == nil {
  1695→			return nil, 0, false, nil
  1696→		}
  1697→		currentLedgerID = *user.CurrentLedgerID
  1698→	}
  1699→
  1700→	// 查询记录
  1701→	query := s.db.Where("ledger_id = ?", currentLedgerID)
  1702→	if cursor > 0 {
  1703→		query = query.Where("id < ?", cursor)
  1704→	}
  1705→	query = query.Order("created_at DESC, id DESC").Limit(limit + 1)
  1706→
  1707→	var records []model.Record
  1708→	if err := query.Find(&records).Error; err != nil {
  1709→		return nil, 0, false, err
  1710→	}
  1711→
  1712→	hasMore := len(records) > limit
  1713→	if hasMore {
  1714→		records = records[:limit]
  1715→	}
  1716→
  1717→	// 获取详情
  1718→	var result []RecordWithDetails
  1719→	var lastID uint
  1720→	for _, r := range records {
  1721→		lastID = r.ID
  1722→
  1723→		var category model.Category
  1724→		s.db.First(&category, r.CategoryID)
  1725→
  1726→		var tags []model.Tag
  1727→		s.db.Joins("JOIN record_tags ON record_tags.tag_id = tags.id").
  1728→			Where("record_tags.record_id = ?", r.ID).Find(&tags)
  1729→
  1730→		result = append(result, RecordWithDetails{
  1731→			Record:         r,
  1732→			CategoryName:   category.Name,
  1733→			CategoryIcon:   category.Icon,
  1734→			CategoryColor:  category.Color,
  1735→			Tags:           tags,
  1736→		})
  1737→	}
  1738→
  1739→	return result, lastID, hasMore, nil
  1740→}
  1741→
  1742→func (s *RecordService) Get(userID, id uint) (*RecordWithDetails, error) {
  1743→	var record model.Record
  1744→	if err := s.db.Where("id = ?", id).First(&record).Error; err != nil {
  1745→		return nil, err
  1746→	}
  1747→
  1748→	// 验证账本属于用户
  1749→	var ledger model.Ledger
  1750→	if err := s.db.Where("id = ? AND user_id = ?", record.LedgerID, userID).First(&ledger).Error; err != nil {
  1751→		return nil, err
  1752→	}
  1753→
  1754→	var category model.Category
  1755→	s.db.First(&category, record.CategoryID)
  1756→
  1757→	var tags []model.Tag
  1758→	s.db.Joins("JOIN record_tags ON record_tags.tag_id = tags.id").
  1759→		Where("record_tags.record_id = ?", record.ID).Find(&tags)
  1760→
  1761→	return &RecordWithDetails{
  1762→		Record:         record,
  1763→		CategoryName:   category.Name,
  1764→		CategoryIcon:   category.Icon,
  1765→		CategoryColor:  category.Color,
  1766→		Tags:           tags,
  1767→	}, nil
  1768→}
  1769→
  1770→func (s *RecordService) Create(userID uint, ledgerID *uint, categoryID uint, amount float64, recordType int, remark string, tagIDs []uint) (*RecordWithDetails, error) {
  1771→	// 获取账本
  1772→	var currentLedgerID uint
  1773→	if ledgerID != nil {
  1774→		currentLedgerID = *ledgerID
  1775→	} else {
  1776→		var user model.User
  1777→		if err := s.db.First(&user, userID).Error; err != nil {
  1778→			return nil, err
  1779→		}
  1780→		if user.CurrentLedgerID == nil {
  1781→			return nil, gorm.ErrRecordNotFound
  1782→		}
  1783→		currentLedgerID = *user.CurrentLedgerID
  1784→	}
  1785→
  1786→	// 验证分类存在
  1787→	var category model.Category
  1788→	if err := s.db.First(&category, categoryID).Error; err != nil {
  1789→		return nil, err
  1790→	}
  1791→
  1792→	record := &model.Record{
  1793→		LedgerID:   currentLedgerID,
  1794→		CategoryID: categoryID,
  1795→		Amount:     amount,
  1796→		Type:       recordType,
  1797→		Remark:     remark,
  1798→	}
  1799→	if err := s.db.Create(record).Error; err != nil {
  1800→		return nil, err
  1801→	}
  1802→
  1803→	// 添加标签关联
  1804→	for _, tagID := range tagIDs {
  1805→		s.db.Create(&model.RecordTag{RecordID: record.ID, TagID: tagID})
  1806→	}
  1807→
  1808→	return s.Get(userID, record.ID)
  1809→}
  1810→
  1811→func (s *RecordService) Update(userID, id uint, categoryID uint, amount float64, recordType int, remark string, tagIDs []uint) (*RecordWithDetails, error) {
  1812→	record, err := s.Get(userID, id)
  1813→	if err != nil {
  1814→		return nil, err
  1815→	}
  1816→
  1817→	record.CategoryID = categoryID
  1818→	record.Amount = amount
  1819→	record.Type = recordType
  1820→	record.Remark = remark
  1821→
  1822→	if err := s.db.Save(&record.Record).Error; err != nil {
  1823→		return nil, err
  1824→	}
  1825→
  1826→	// 更新标签关联
  1827→	s.db.Where("record_id = ?", id).Delete(&model.RecordTag{})
  1828→	for _, tagID := range tagIDs {
  1829→		s.db.Create(&model.RecordTag{RecordID: id, TagID: tagID})
  1830→	}
  1831→
  1832→	return s.Get(userID, id)
  1833→}
  1834→
  1835→func (s *RecordService) Delete(userID, id uint) error {
  1836→	_, err := s.Get(userID, id)
  1837→	if err != nil {
  1838→		return err
  1839→	}
  1840→
  1841→	s.db.Where("record_id = ?", id).Delete(&model.RecordTag{})
  1842→	return s.db.Delete(&model.Record{}, id).Error
  1843→}
  1844→
  1845→func ParseCursor(cursorStr string) uint {
  1846→	if cursorStr == "" {
  1847→		return 0
  1848→	}
  1849→	cursor, _ := strconv.ParseUint(cursorStr, 10, 32)
  1850→	return uint(cursor)
  1851→}
  1852→```
  1853→
  1854→- [ ] **Step 2: 创建 Record Handler**
  1855→
  1856→Create: `backend/internal/handler/record.go`
  1857→```go
  1858→package handler
  1859→
  1860→import (
  1861→	"strconv"
  1862→
  1863→	"github.com/gin-gonic/gin"
  1864→
  1865→	"github.com/ai-payrecord2/backend/internal/middleware"
  1866→	"github.com/ai-payrecord2/backend/internal/response"
  1867→	"github.com/ai-payrecord2/backend/internal/service"
  1868→	"github.com/ai-payrecord2/backend/pkg/database"
  1869→)
  1870→
  1871→type RecordHandler struct {
  1872→	service *service.RecordService
  1873→}
  1874→
  1875→func NewRecordHandler() *RecordHandler {
  1876→	return &RecordHandler{
  1877→		service: service.NewRecordService(database.DB),
  1878→	}
  1879→}
  1880→
  1881→type CreateRecordRequest struct {
  1882→	CategoryID uint    `json:"category_id" binding:"required"`
  1883→	Amount     float64 `json:"amount" binding:"required"`
  1884→	Type       int     `json:"type" binding:"required,oneof=1 2"`
  1885→	Remark     string  `json:"remark"`
  1886→	TagIDs     []uint  `json:"tag_ids"`
  1887→}
  1888→
  1889→type UpdateRecordRequest struct {
  1890→	CategoryID uint    `json:"category_id" binding:"required"`
  1891→	Amount     float64 `json:"amount" binding:"required"`
  1892→	Type       int     `json:"type" binding:"required,oneof=1 2"`
  1893→	Remark     string  `json:"remark"`
  1894→	TagIDs     []uint  `json:"tag_ids"`
  1895→}
  1896→
  1897→type PaginationResponse struct {
  1898→	NextCursor uint `json:"next_cursor"`
  1899→	HasMore    bool `json:"has_more"`
  1900→}
  1901→
  1902→func (h *RecordHandler) List(c *gin.Context) {
  1903→	userID := middleware.GetUserID(c)
  1904→
  1905→	var ledgerID *uint
  1906→	if lid := c.Query("ledger_id"); lid != "" {
  1907→		id, _ := strconv.ParseUint(lid, 10, 32)
  1908→		uid := uint(id)
  1909→		ledgerID = &uid
  1910→	}
  1911→
  1912→	cursor := service.ParseCursor(c.Query("cursor"))
  1913→	limit := 20
  1914→	if l := c.Query("limit"); l != "" {
  1915→		if parsed, err := strconv.Atoi(l); err == nil {
  1916→			limit = parsed
  1917→		}
  1918→	}
  1919→
  1920→	records, lastID, hasMore, err := h.service.List(userID, ledgerID, cursor, limit)
  1921→	if err != nil {
  1922→		response.Error400(c, "获取记录列表失败")
  1923→		return
  1924→	}
  1925→
  1926→	response.Success(c, gin.H{
  1927→		"data":       records,
  1928→		"pagination": PaginationResponse{NextCursor: lastID, HasMore: hasMore},
  1929→	})
  1930→}
  1931→
  1932→func (h *RecordHandler) Get(c *gin.Context) {
  1933→	userID := middleware.GetUserID(c)
  1934→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1935→
  1936→	record, err := h.service.Get(userID, uint(id))
  1937→	if err != nil {
  1938→		response.Error400(c, "获取记录失败")
  1939→		return
  1940→	}
  1941→	response.Success(c, record)
  1942→}
  1943→
  1944→func (h *RecordHandler) Create(c *gin.Context) {
  1945→	userID := middleware.GetUserID(c)
  1946→
  1947→	var req CreateRecordRequest
  1948→	if err := c.ShouldBindJSON(&req); err != nil {
  1949→		response.Error400(c, "请求参数错误")
  1950→		return
  1951→	}
  1952→
  1953→	record, err := h.service.Create(userID, nil, req.CategoryID, req.Amount, req.Type, req.Remark, req.TagIDs)
  1954→	if err != nil {
  1955→		response.Error400(c, "创建记录失败")
  1956→		return
  1957→	}
  1958→	response.Success(c, record)
  1959→}
  1960→
  1961→func (h *RecordHandler) Update(c *gin.Context) {
  1962→	userID := middleware.GetUserID(c)
  1963→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1964→
  1965→	var req UpdateRecordRequest
  1966→	if err := c.ShouldBindJSON(&req); err != nil {
  1967→		response.Error400(c, "请求参数错误")
  1968→		return
  1969→	}
  1970→
  1971→	record, err := h.service.Update(userID, uint(id), req.CategoryID, req.Amount, req.Type, req.Remark, req.TagIDs)
  1972→	if err != nil {
  1973→		response.Error400(c, "更新记录失败")
  1974→		return
  1975→	}
  1976→	response.Success(c, record)
  1977→}
  1978→
  1979→func (h *RecordHandler) Delete(c *gin.Context) {
  1980→	userID := middleware.GetUserID(c)
  1981→	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
  1982→
  1983→	if err := h.service.Delete(userID, uint(id)); err != nil {
  1984→		response.Error400(c, "删除记录失败")
  1985→		return
  1986→	}
  1987→	response.Success(c, nil)
  1988→}
  1989→```
  1990→
  1991→- [ ] **Step 3: 编译测试**
  1992→
  1993→Run:
  1994→```bash
  1995→cd /Users/karsa/proj/ai-payrecord2/backend
  1996→go build -o server ./cmd/server
  1997→```
  1998→
  1999→- [ ] **Step 4: 提交代码**
  2000→
  2001→```bash
  2002→git add backend/
  2003→git commit -m "feat: 实现记录模块
  2004→
  2005→- Record Service 和 Handler
  2006→- 记录 CRUD 和分页功能
  2007→
  2008→Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
  2009→```
  2010→
  2011→---
  2012→
  2013→## Chunk 7: LLM 模块
  2014→
  2015→### Task 7: 实现 LLM 智能添加记录
  2016→
  2017→- [ ] **Step 1: 创建 LLM Service**
  2018→
  2019→Create: `backend/internal/service/llm.go`
  2020→```go
  2021→package service
  2022→
  2023→import (
  2024→	"bytes"
  2025→	"encoding/json"
  2026→	"fmt"
  2027→	"io"
  2028→	"net/http"
  2029→
  2030→	"gorm.io/gorm"
  2031→
  2032→	"github.com/ai-payrecord2/backend/internal/config"
  2033→	"github.com/ai-payrecord2/backend/internal/model"
  2034→)
  2035→
  2036→type LLMService struct {
  2037→	db *gorm.DB
  2038→}
  2039→
  2040→type LLMCategory struct {
  2041→	Name     string `json:"name"`
  2042→	Icon     string `json:"icon"`
  2043→	Color    string `json:"color"`
  2044→	IsNew    bool   `json:"is_new"`
  2045→}
  2046→
  2047→type LLMResponse struct {
  2048→	Amount    float64       `json:"amount"`
  2049→	Type     int           `json:"type"`
  2050→	Category LLMCategory    `json:"category"`
  2051→	Tags     []string      `json:"tags"`
  2052→	Remark   string        `json:"remark"`
  2053→}
  2054→
  2055→func NewLLMService(db *gorm.DB) *LLMService {
  2056→	return &LLMService{db: db}
  2057→}
  2058→
  2059→func (s *LLMService) GetCategories(userID uint) ([]model.Category, error) {
  2060→	var categories []model.Category
  2061→	err := s.db.Where("user_id = ? OR user_id IS NULL", userID).Find(&categories).Error
  2062→	return categories, err
  2063→}
  2064→
  2065→func (s *LLMService) Parse(userID uint, text string) (*LLMResponse, bool, error) {
  2066→	// 获取用户分类
  2067→	categories, err := s.GetCategories(userID)
  2068→	if err != nil {
  2069→		return nil, false, err
  2070→	}
  2071→
  2072→	// 构建 prompt
  2073→	categoryList := ""
  2074→	for _, c := range categories {
  2075→		categoryList += fmt.Sprintf("- %s (%s)\n", c.Name, c.Icon)
  2076→	}
  2077→
  2078→	prompt := fmt.Sprintf(`你是一个记账助手，请从用户的自然语言描述中提取记账信息。
  2079→
  2080→用户的分类列表：
  2081→%s
  2082→
  2083→请从以下文本中提取记账信息，返回JSON格式：
  2084→{
  2085→  "amount": 金额（数字）,
  2086→  "type": 1表示支出，2表示收入,
  2087→  "category": 匹配的分类名称（如果无法匹配，返回一个新的分类名称）,
  2088→  "tags": 匹配的标签列表（可选）,
  2089→  "remark": 备注（可选）
  2090→}
  2091→
  2092→用户输入：%s
  2093→
  2094→只返回JSON，不要其他内容。`, categoryList, text)
  2095→
  2096→	// 调用 LLM API
  2097→	reqBody, _ := json.Marshal(map[string]interface{}{
  2098→		"model": config.AppConfig.LLMModel,
  2099→		"messages": []map[string]string{
  2100→			{"role": "system", "content": "你是一个专业的记账助手，擅长从自然语言中提取财务信息。"},
  2101→			{"role": "user", "content": prompt},
  2102→		},
  2103→		"temperature": 0.3,
  2104→		"max_tokens": 500,
  2105→	})
  2106→
  2107→	req, _ := http.NewRequest("POST", config.AppConfig.LLMAPIBase+"/chat/completions", bytes.NewBuffer(reqBody))
  2108→	req.Header.Set("Content-Type", "application/json")
  2109→	req.Header.Set("Authorization", "Bearer "+config.AppConfig.LLMAPIKey)
  2110→
  2111→	client := &http.Client{}
  2112→	resp, err := client.Do(req)
  2113→	if err != nil {
  2114→		return nil, false, fmt.Errorf("LLM API 调用失败: %v", err)
  2115→	}
  2116→	defer resp.Body.Close()
  2117→
  2118→	body, _ := io.ReadAll(resp.Body)
  2119→	var result map[string]interface{}
  2120→	json.Unmarshal(body, &result)
  2121→
  2122→	// 解析响应
  2123→	choices := result["choices"].([]interface{})
  2124→	message := choices[0].(map[string]interface{})["message"].(map[string]interface{})
  2125→	content := message["content"].(string)
  2126→
  2127→	// 清理 JSON 响应（去除可能的 markdown 代码块）
  2128→	content = bytes.TrimPrefix([]byte(content), []byte("```json"))
  2129→	content = bytes.TrimSuffix(content, []byte("```"))
  2130→	content = bytes.TrimSpace(content)
  2131→
  2132→	var llmResp LLMResponse
  2133→	if err := json.Unmarshal(content, &llmResp); err != nil {
  2134→		return nil, false, fmt.Errorf("解析 LLM 响应失败: %v", err)
  2135→	}
  2136→
  2137→	// 检查是否是新分类
  2138→	isNew := true
  2139→	for _, c := range categories {
  2140→		if c.Name == llmResp.Category.Name {
  2141→			llmResp.Category.Icon = c.Icon
  2142→			llmResp.Category.Color = c.Color
  2143→			isNew = false
  2144→			break
  2145→		}
  2146→	}
  2147→	llmResp.Category.IsNew = isNew
  2148→
  2149→	return &llmResp, isNew, nil
  2150→}
  2151→
  2152→func (s *LLMService) CreateWithLLM(userID uint, amount float64, recordType int, categoryName, categoryIcon, categoryColor string, categoryID *uint, tagNames []string, remark string) (*model.Record, error) {
  2153→	// 获取账本
  2154→	var user model.User
  2155→	if err := s.db.First(&user, userID).Error; err != nil {
  2156→		return nil, err
  2157→	}
  2158→	if user.CurrentLedgerID == nil {
  2159→		return nil, gorm.ErrRecordNotFound
  2160→	}
  2161→
  2162→	var catID uint
  2163→	if categoryID != nil {
  2164→		catID = *categoryID
  2165→	} else {
  2166→		// 创建新分类
  2167→		cat := model.Category{
  2168→			UserID: &userID,
  2169→			Name:   categoryName,
  2170→			Icon:   categoryIcon,
  2171→			Color:  categoryColor,
  2172→			Type:   recordType,
  2173→		}
  2174→		s.db.Create(&cat)
  2175→		catID = cat.ID
  2176→	}
  2177→
  2178→	// 查找或创建标签
  2179→	var tagIDs []uint
  2180→	for _, tagName := range tagNames {
  2181→		var tag model.Tag
  2182→		if err := s.db.Where("user_id = ? AND name = ?", userID, tagName).First(&tag).Error; err == nil {
  2183→			tagIDs = append(tagIDs, tag.ID)
  2184→		}
  2185→	}
  2186→
  2187→	// 创建记录
  2188→	record := &model.Record{
  2189→		LedgerID:   *user.CurrentLedgerID,
  2190→		CategoryID: catID,
  2191→		Amount:     amount,
  2192→		Type:       recordType,
  2193→		Remark:     remark,
  2194→	}
  2195→	if err := s.db.Create(record).Error; err != nil {
  2196→		return nil, err
  2197→	}
  2198→
  2199→	// 添加标签关联
  2200→	for _, tagID := range tagIDs {
  2201→		s.db.Create(&model.RecordTag{RecordID: record.ID, TagID: tagID})
  2202→	}
  2203→
  2204→	return record, nil
  2205→}
  2206→```
  2207→
  2208→- [ ] **Step 2: 创建 LLM Handler**
  2209→
  2210→Create: `backend/internal/handler/llm.go`
  2211→```go
  2212→package handler
  2213→
  2214→import (
  2215→	"github.com/gin-gonic/gin"
  2216→
  2217→	"github.com/ai-payrecord2/backend/internal/middleware"
  2218→	"github.com/ai-payrecord2/backend/internal/response"
  2219→	"github.com/ai-payrecord2/backend/internal/service"
  2220→	"github.com/ai-payrecord2/backend/pkg/database"
  2221→)
  2222→
  2223→type LLMHandler struct {
  2224→	service *service.LLMService
  2225→}
  2226→
  2227→func NewLLMHandler() *LLMHandler {
  2228→	return &LLMHandler{
  2229→		service: service.NewLLMService(database.DB),
  2230→	}
  2231→}
  2232→
  2233→func (h *LLMHandler) Categories(c *gin.Context) {
  2234→	userID := middleware.GetUserID(c)
  2235→	categories, err := h.service.GetCategories(userID)
  2236→	if err != nil {
  2237→		response.Error400(c, "获取分类列表失败")
  2238→		return
  2239→	}
  2240→	response.Success(c, categories)
  2241→}
  2242→
  2243→type ParseRequest struct {
  2244→	Text string `json:"text" binding:"required"`
  2245→}
  2246→
  2247→func (h *LLMHandler) Parse(c *gin.Context) {
  2248→	userID := middleware.GetUserID(c)
  2249→	var req ParseRequest
  2250→	if err := c.ShouldBindJSON(&req); err != nil {
  2251→		response.Error400(c, "请求参数错误")
  2252→		return
  2253→	}
  2254→
  2255→	result, isNew, err := h.service.Parse(userID, req.Text)
  2256→	if err != nil {
  2257→		response.Error400(c, "解析失败: "+err.Error())
  2258→		return
  2259→	}
  2260→
  2261→	response.Success(c, gin.H{
  2262→		"data":                   result,
  2263→		"needs_category_confirm": isNew,
  2264→	})
  2265→}
  2266→
  2267→type CreateRecordWithLLMRequest struct {
  2268→	Amount         float64  `json:"amount" binding:"required"`
  2269→	Type           int      `json:"type" binding:"required,oneof=1 2"`
  2270→	CategoryID     *uint    `json:"category_id"`
  2271→	CategoryName   string   `json:"category_name"`
  2272→	CategoryIcon   string   `json:"category_icon"`
  2273→	CategoryColor  string   `json:"category_color"`
  2274→	TagNames       []string `json:"tag_names"`
  2275→	Remark         string   `json:"remark"`
  2276→}
  2277→
  2278→func (h *LLMHandler) CreateRecord(c *gin.Context) {
  2279→	userID := middleware.GetUserID(c)
  2280→	var req CreateRecordWithLLMRequest
  2281→	if err := c.ShouldBindJSON(&req); err != nil {
  2282→		response.Error400(c, "请求参数错误")
  2283→		return
  2284→	}
  2285→
  2286→	record, err := h.service.CreateWithLLM(
  2287→		userID,
  2288→		req.Amount,
  2289→		req.Type,
  2290→		req.CategoryName,
  2291→		req.CategoryIcon,
  2292→		req.CategoryColor,
  2293→		req.CategoryID,
  2294→		req.TagNames,
  2295→		req.Remark,
  2296→	)
  2297→	if err != nil {
  2298→		response.Error400(c, "创建记录失败")
  2299→		return
  2300→	}
  2301→	response.Success(c, record)
  2302→}
  2303→```
  2304→
  2305→- [ ] **Step 3: 编译测试**
  2306→
  2307→Run:
  2308→```bash
  2309→cd /Users/karsa/proj/ai-payrecord2/backend
  2310→go build -o server ./cmd/server
  2311→```
  2312→
  2313→- [ ] **Step 4: 提交代码**
  2314→
  2315→```bash
  2316→git add backend/
  2317→git commit -m "feat: 实现 LLM 模块
  2318→
  2319→- LLM Service（解析自然语言、创建记录）
  2320→- LLM Handler
  2321→
  2322→Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
  2323→```
  2324→
  2325→---
  2326→
  2327→## Chunk 8: 统计模块
  2328→
  2329→### Task 8: 实现统计接口
  2330→
  2331→- [ ] **Step 1: 创建 Stats Service**
  2332→
  2333→Create: `backend/internal/service/stats.go`
  2334→```go
  2335→package service
  2336→
  2337→import (
  2338→	"time"
  2339→
  2340→	"gorm.io/gorm"
  2341→
  2342→	"github.com/ai-payrecord2/backend/internal/model"
  2343→)
  2344→
  2345→type StatsService struct {
  2346→	db *gorm.DB
  2347→}
  2348→
  2349→type SummaryData struct {
  2350→	Month         string  `json:"month"`
  2351→	ExpenseCount  int     `json:"expense_count"`
  2352→	ExpenseAmount float64 `json:"expense_amount"`
  2353→	IncomeCount   int     `json:"income_count"`
  2354→	IncomeAmount  float64 `json:"income_amount"`
  2355→}
  2356→
  2357→type DailyData struct {
  2358→	Date          string  `json:"date"`
  2359→	ExpenseCount  int     `json:"expense_count"`
  2360→	ExpenseAmount float64 `json:"expense_amount"`
  2361→	IncomeCount   int     `json:"income_count"`
  2362→	IncomeAmount  float64 `json:"income_amount"`
  2363→}
  2364→
  2365→type CategoryStat struct {
  2366→	CategoryID    uint    `json:"category_id"`
  2367→	CategoryName  string  `json:"category_name"`
  2368→	CategoryIcon  string  `json:"category_icon"`
  2369→	CategoryColor string  `json:"category_color"`
  2370→	Amount        float64 `json:"amount"`
  2371→	Count         int     `json:"count"`
  2372→	Percentage    float64 `json:"percentage"`
  2373→}
  2374→
  2375→type MonthlyData struct {
  2376→	Month        string  `json:"month"`
  2377→	ExpenseAmount float64 `json:"expense_amount"`
  2378→	IncomeAmount  float64 `json:"income_amount"`
  2379→}
  2380→
  2381→func NewStatsService(db *gorm.DB) *StatsService {
  2382→	return &StatsService{db: db}
  2383→}
  2384→
  2385→func (s *StatsService) getLedgerID(userID uint, ledgerID *uint) (uint, error) {
  2386→	if ledgerID != nil {
  2387→		return *ledgerID, nil
  2388→	}
  2389→	var user model.User
  2390→	if err := s.db.First(&user, userID).Error; err != nil {
  2391→		return 0, err
  2392→	}
  2393→	if user.CurrentLedgerID == nil {
  2394→		return 0, gorm.ErrRecordNotFound
  2395→	}
  2396→	return *user.CurrentLedgerID, nil
  2397→}
  2398→
  2399→func (s *StatsService) Summary(userID uint, ledgerID *uint) ([]SummaryData, error) {
  2400→	ledgerID, err := s.getLedgerID(userID, ledgerID)
  2401→	if err != nil {
  2402→		return nil, err
  2403→	}
  2404→
  2405→	var results []SummaryData
  2406→	now := time.Now()
  2407→
  2408→	// 查询最近12个月
  2409→	for i := 0; i < 12; i++ {
  2410→		date := now.AddDate(0, -i, 0)
  2411→		year := date.Year()
  2412→		month := int(date.Month())
  2413→
  2414→		var expenseCount, incomeCount int64
  2415→		var expenseAmount, incomeAmount float64
  2416→
  2417→		s.db.Model(&model.Record{}).
  2418→			Where("ledger_id = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?", ledgerID, fmt.Sprintf("%d", year), fmt.Sprintf("%02d", month), 1).
  2419→			Count(&expenseCount).
  2420→			Select("COALESCE(SUM(amount), 0)").Row().Scan(&expenseAmount)
  2421→
  2422→		s.db.Model(&model.Record{}).
  2423→			Where("ledger_id = ? AND strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?", ledgerID, fmt.Sprintf("%d", year), fmt.Sprintf("%02d", month), 2).
  2424→			Count(&incomeCount).
  2425→			Select("COALESCE(SUM(amount), 0)").Row().Scan(&incomeAmount)
  2426→
  2427→		results = append(results, SummaryData{
  2428→			Month:         fmt.Sprintf("%d-%02d", year, month),
  2429→			ExpenseCount:  int(expenseCount),
  2430→			ExpenseAmount: expenseAmount,
  2431→			IncomeCount:   int(incomeCount),
  2432→			IncomeAmount:  incomeAmount,
  2433→		})
  2434→	}
  2435→
  2436→	return results, nil
  2437→}
  2438→
  2439→func (s *StatsService) Daily(userID uint, ledgerID *uint) ([]DailyData, error) {
  2440→	ledgerID, err := s.getLedgerID(userID, ledgerID)
  2441→	if err != nil {
  2442→		return nil, err
  2443→	}
  2444→
  2445→	type dailyResult struct {
  2446→		Date          string
  2447→		ExpenseCount  int
  2448→		ExpenseAmount float64
  2449→		IncomeCount   int
  2450→		IncomeAmount  float64
  2451→	}
  2452→
  2453→	var results []dailyResult
  2454→	s.db.Raw(`
  2455→		SELECT
  2456→			strftime('%Y-%m-%d', created_at) as date,
  2457→			SUM(CASE WHEN type = 1 THEN 1 ELSE 0 END) as expense_count,
  2458→			COALESCE(SUM(CASE WHEN type = 1 THEN amount ELSE 0 END), 0) as expense_amount,
  2459→			SUM(CASE WHEN type = 2 THEN 1 ELSE 0 END) as income_count,
  2460→			COALESCE(SUM(CASE WHEN type = 2 THEN amount ELSE 0 END), 0) as income_amount
  2461→		FROM records
  2462→		WHERE ledger_id = ?
  2463→		GROUP BY strftime('%Y-%m-%d', created_at)
  2464→		ORDER BY date DESC
  2465→	`, ledgerID).Scan(&results)
  2466→
  2467→	var dailyData []DailyData
  2468→	for _, r := range results {
  2469→		dailyData = append(dailyData, DailyData{
  2470→			Date:          r.Date,
  2471→			ExpenseCount:  r.ExpenseCount,
  2472→			ExpenseAmount: r.ExpenseAmount,
  2473→			IncomeCount:   r.IncomeCount,
  2474→			IncomeAmount:  r.IncomeAmount,
  2475→		})
  2476→	}
  2477→
  2478→	return dailyData, nil
  2479→}
  2480→
  2481→func (s *StatsService) ByCategory(userID uint, ledgerID *uint, recordType int) ([]CategoryStat, error) {
  2482→	ledgerID, err := s.getLedgerID(userID, ledgerID)
  2483→	if err != nil {
  2484→		return nil, err
  2485→	}
  2486→
  2487→	type result struct {
  2488→		CategoryID    uint
  2489→		Amount        float64
  2490→		Count         int
  2491→	}
  2492→
  2493→	var results []result
  2494→	query := s.db.Model(&model.Record{}).
  2495→		Select("category_id, SUM(amount) as amount, COUNT(*) as count").
  2496→		Where("ledger_id = ?", ledgerID)
  2497→	if recordType > 0 {
  2498→		query = query.Where("type = ?", recordType)
  2499→	}
  2500→	query.Group("category_id").Scan(&results)
  2501→
  2502→	// 计算总量
  2503→	var total float64
  2504→	for _, r := range results {
  2505→		total += r.Amount
  2506→	}
  2507→
  2508→	// 获取分类信息
  2509→	var stats []CategoryStat
  2510→	for _, r := range results {
  2511→		var category model.Category
  2512→		s.db.First(&category, r.CategoryID)
  2513→
  2514→		percentage := 0.0
  2515→		if total > 0 {
  2516→			percentage = r.Amount / total * 100
  2517→		}
  2518→
  2519→		stats = append(stats, CategoryStat{
  2520→			CategoryID:    category.ID,
  2521→			CategoryName:  category.Name,
  2522→			CategoryIcon:  category.Icon,
  2523→			CategoryColor: category.Color,
  2524→			Amount:        r.Amount,
  2525→			Count:         r.Count,
  2526→			Percentage:    percentage,
  2527→		})
  2528→	}
  2529→
  2530→	return stats, nil
  2531→}
  2532→
  2533→func (s *StatsService) Monthly(userID uint, ledgerID *uint, year *int) ([]MonthlyData, error) {
  2534→	ledgerID, err := s.getLedgerID(userID, ledgerID)
  2535→	if err != nil {
  2536→		return nil, err
  2537→	}
  2538→
  2539→	currentYear := time.Now().Year()
  2540→	if year == nil {
  2541→		year = &currentYear
  2542→	}
  2543→
  2544→	type result struct {
  2545→		Month        string
  2546→		ExpenseAmount float64
  2547→		IncomeAmount  float64
  2548→	}
  2549→
  2550→	var results []result
  2551→	s.db.Raw(`
  2552→		SELECT
  2553→			strftime('%m', created_at) as month,
  2554→			COALESCE(SUM(CASE WHEN type = 1 THEN amount ELSE 0 END), 0) as expense_amount,
  2555→			COALESCE(SUM(CASE WHEN type = 2 THEN amount ELSE 0 END), 0) as income_amount
  2556→		FROM records
  2557→		WHERE ledger_id = ? AND strftime('%Y', created_at) = ?
  2558→		GROUP BY strftime('%m', created_at)
  2559→		ORDER BY month
  2560→	`, ledgerID, fmt.Sprintf("%d", *year)).Scan(&results)
  2561→
  2562→	var monthlyData []MonthlyData
  2563→	for _, r := range results {
  2564→		monthlyData = append(monthlyData, MonthlyData{
  2565→			Month:         r.Month,
  2566→			ExpenseAmount: r.ExpenseAmount,
  2567→			IncomeAmount:  r.IncomeAmount,
  2568→		})
  2569→	}
  2570→
  2571→	return monthlyData, nil
  2572→}
  2573→```
  2574→
  2575→**注意**: Stats Service 中需要添加 `import "fmt"` 并修复 `Summary` 函数中的 SQL 查询。
  2576→
  2577→- [ ] **Step 2: 创建 Stats Handler**
  2578→
  2579→Create: `backend/internal/handler/stats.go`
  2580→```go
  2581→package handler
  2582→
  2583→import (
  2584→	"strconv"
  2585→
  2586→	"github.com/gin-gonic/gin"
  2587→
  2588→	"github.com/ai-payrecord2/backend/internal/middleware"
  2589→	"github.com/ai-payrecord2/backend/internal/response"
  2590→	"github.com/ai-payrecord2/backend/internal/service"
  2591→	"github.com/ai-payrecord2/backend/pkg/database"
  2592→)
  2593→
  2594→type StatsHandler struct {
  2595→	service *service.StatsService
  2596→}
  2597→
  2598→func NewStatsHandler() *StatsHandler {
  2599→	return &StatsHandler{
  2600→		service: service.NewStatsService(database.DB),
  2601→	}
  2602→}
  2603→
  2604→func (h *StatsHandler) getLedgerID(c *gin.Context) *uint {
  2605→	if lid := c.Query("ledger_id"); lid != "" {
  2606→		id, _ := strconv.ParseUint(lid, 10, 32)
  2607→		uid := uint(id)
  2608→		return &uid
  2609→	}
  2610→	return nil
  2611→}
  2612→
  2613→func (h *StatsHandler) Summary(c *gin.Context) {
  2614→	userID := middleware.GetUserID(c)
  2615→	ledgerID := h.getLedgerID(c)
  2616→
  2617→	data, err := h.service.Summary(userID, ledgerID)
  2618→	if err != nil {
  2619→		response.Error400(c, "获取汇总数据失败")
  2620→		return
  2621→	}
  2622→	response.Success(c, data)
  2623→}
  2624→
  2625→func (h *StatsHandler) Daily(c *gin.Context) {
  2626→	userID := middleware.GetUserID(c)
  2627→	ledgerID := h.getLedgerID(c)
  2628→
  2629→	data, err := h.service.Daily(userID, ledgerID)
  2630→	if err != nil {
  2631→		response.Error400(c, "获取日度数据失败")
  2632→		return
  2633→	}
  2634→	response.Success(c, data)
  2635→}
  2636→
  2637→func (h *StatsHandler) ByCategory(c *gin.Context) {
  2638→	userID := middleware.GetUserID(c)
  2639→	ledgerID := h.getLedgerID(c)
  2640→
  2641→	recordType := 0
  2642→	if t := c.Query("type"); t != "" {
  2643→		recordType, _ = strconv.Atoi(t)
  2644→	}
  2645→
  2646→	data, err := h.service.ByCategory(userID, ledgerID, recordType)
  2647→	if err != nil {
  2648→		response.Error400(c, "获取分类统计失败")
  2649→		return
  2650→	}
  2651→	response.Success(c, data)
  2652→}
  2653→
  2654→func (h *StatsHandler) Monthly(c *gin.Context) {
  2655→	userID := middleware.GetUserID(c)
  2656→	ledgerID := h.getLedgerID(c)
  2657→
  2658→	var year *int
  2659→	if y := c.Query("year"); y != "" {
  2660→		if parsed, err := strconv.Atoi(y); err == nil {
  2661→			year = &parsed
  2662→		}
  2663→	}
  2664→
  2665→	data, err := h.service.Monthly(userID, ledgerID, year)
  2666→	if err != nil {
  2667→		response.Error400(c, "获取月度统计失败")
  2668→		return
  2669→	}
  2670→	response.Success(c, data)
  2671→}
  2672→
  2673→func (h *StatsHandler) MonthlyDetail(c *gin.Context) {
  2674→	// TODO: 实现月度详情
  2675→	response.Success(c, nil)
  2676→}
  2677→
  2678→func (h *StatsHandler) ByTag(c *gin.Context) {
  2679→	// TODO: 实现按标签统计
  2680→	response.Success(c, nil)
  2681→}
  2682→```
  2683→
  2684→- [ ] **Step 3: 编译测试**
  2685→
  2686→Run:
  2687→```bash
  2688→cd /Users/karsa/proj/ai-payrecord2/backend
  2689→go build -o server ./cmd/server
  2690→```
  2691→
  2692→- [ ] **Step 4: 提交代码**
  2693→
  2694→```bash
  2695→git add backend/
  2696→git commit -m "feat: 实现统计模块
  2697→
  2698→- Stats Service（汇总、日度、分类、月度统计）
  2699→- Stats Handler
  2700→
  2701→Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
  2702→```
  2703→
  2704→---
  2705→
  2706→## Chunk 9: 最终测试和提交
  2707→
  2708→### Task 9: 最终测试
  2709→
  2710→- [ ] **Step 1: 编译项目**
  2711→
  2712→Run:
  2713→```bash
  2714→cd /Users/karsa/proj/ai-payrecord2/backend
  2715→go build -o server ./cmd/server
  2716→```
  2717→
  2718→- [ ] **Step 2: 运行服务并测试**
  2719→
  2720→Run:
  2721→```bash
  2722→cd /Users/karsa/proj/ai-payrecord2/backend
  2723→./server
  2724→```
  2725→
  2726→- [ ] **Step 3: 提交所有变更**
  2727→
  2728→```bash
  2729→git add backend/
  2730→git commit -m "feat: 完成账本 App 后端 API 开发
  2731→
  2732→- 项目初始化和基础架构
  2733→- 数据模型定义
  2734→- 认证模块（注册/登录/JWT/Refresh Token）
  2735→- 账本和用户模块
  2736→- 分类和标签模块
  2737→- 记录模块（CRUD + 分页）
  2738→- LLM 模块（自然语言解析）
  2739→- 统计模块
  2740→
  2741→Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
  2742→```
  2743→

<system-reminder>
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
</system-reminder>
