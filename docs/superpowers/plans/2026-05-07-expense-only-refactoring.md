# 只保留支出功能重构 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除预算、收入、转账、结余相关所有功能，将应用简化为纯支出记账工具。

**Architecture:** 后端模型移除 RecordType 和 CategoryType 的 income/transfer 枚举值和 Type 字段；简化 Stats 服务移除收入/结余计算；前端移除类型选择器、收入/结余展示、BudgetPage 及相关路由/导航/i18n；重建 SQLite 数据库。

**Tech Stack:** Go/Gin/GORM, React/TypeScript/Tailwind, SQLite

---

## 文件变更清单

### 后端 (Backend)
| 文件 | 操作 |
|------|------|
| `backend/internal/model/record.go` | 修改：删除 income/transfer 类型和 Type 字段 |
| `backend/internal/model/category.go` | 修改：删除 income/transfer 类型和 Type 字段 |
| `backend/internal/service/record.go` | 修改：删除 Type 字段引用 |
| `backend/internal/service/category.go` | 修改：删除 Type 字段引用 |
| `backend/internal/service/stats.go` | 修改：删除 income/balance 字段和查询 |
| `backend/internal/service/llm.go` | 修改：删除 Type 字段和 isIncome 逻辑 |
| `backend/internal/service/llm_client.go` | 修改：简化 Prompt，删除 type 描述 |
| `backend/internal/handler/record.go` | 修改：删除 type 查询参数 |
| `backend/internal/handler/category.go` | 修改：删除 type 查询参数和 CategoryType 引用 |
| `backend/internal/handler/stats.go` | 修改：删除 RecordType 引用 |

### 前端 (Frontend)
| 文件 | 操作 |
|------|------|
| `frontend/src/types/index.ts` | 修改：简化 RecordType/CategoryType，删除 income/balance 字段 |
| `frontend/src/components/RecordForm.tsx` | 修改：删除类型选择器，简化 props |
| `frontend/src/pages/AddRecordPage.tsx` | 修改：简化 RecordForm 传参 |
| `frontend/src/pages/EditRecordPage.tsx` | 修改：简化 RecordForm 传参 |
| `frontend/src/pages/HomePage.tsx` | 修改：删除收入/结余卡片 |
| `frontend/src/pages/StatsPage.tsx` | 修改：删除收入/结余图表 |
| `frontend/src/pages/CategoryPage.tsx` | 修改：删除收入分类区域 |
| `frontend/src/pages/ExportPage.tsx` | 修改：简化类型标签 |
| `frontend/src/pages/SettingsPage.tsx` | 修改：删除预算设置链接 |
| `frontend/src/pages/BudgetPage.tsx` | **删除** |
| `frontend/src/App.tsx` | 修改：删除 BudgetPage 路由 |
| `frontend/src/config/navigation.ts` | 修改：删除 budget 导航项 |
| `frontend/src/i18n/locales/en.json` | 修改：删除 income/budget/balance 翻译 |
| `frontend/src/i18n/locales/zh.json` | 修改：删除 income/budget/balance 翻译 |

### 文档
| 文件 | 操作 |
|------|------|
| `docs/superpowers/test-cases/ui-test-cases.md` | 修改：删除 Budget 测试，更新相关用例 |
| `docs/superpowers/test-cases/api-test-cases.md` | 修改：更新 Stats 测试用例 |

---

### Task 1: 后端 — 简化 Record 模型

**Files:**
- Modify: `backend/internal/model/record.go`

- [ ] **删除 income/transfer 类型和 Type 字段**

```go
package model

import (
	"time"

	"gorm.io/gorm"
)

// 删除 RecordType 类型和所有常量 — 所有记录都是支出，无需区分类型

type Record struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	UserID      uint           `gorm:"index;not null" json:"user_id"`
	LedgerID    uint           `gorm:"index;not null" json:"ledger_id"`
	CategoryID  uint           `gorm:"index;not null" json:"category_id"`
	Amount      float64        `gorm:"type:decimal(12,2);not null" json:"amount"`
	// 删除 Type 字段 — 不再区分支出/收入/转账
	Date        time.Time      `gorm:"index;not null" json:"date"`
	Note        string         `gorm:"type:text" json:"note"`
	ImageURL    string         `gorm:"size:255" json:"image_url"`
	Location    string         `gorm:"size:100" json:"location"`
	Source      string         `gorm:"size:50" json:"source"`
	Status      int            `gorm:"default:1" json:"status"`
	Ledger      *Ledger        `gorm:"foreignKey:LedgerID" json:"ledger,omitempty"`
	Category    *Category      `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Tags        []Tag          `gorm:"many2many:record_tags;" json:"tags,omitempty"`
}

func (Record) TableName() string {
	return "records"
}
```

---

### Task 2: 后端 — 简化 Category 模型

**Files:**
- Modify: `backend/internal/model/category.go`

- [ ] **删除 income/transfer 类型和 Type 字段**

```go
package model

import (
	"time"

	"gorm.io/gorm"
)

// 删除 CategoryType 类型和所有常量 — 所有分类都是支出分类

type Category struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	Name      string         `gorm:"size:50;not null" json:"name"`
	Icon      string         `gorm:"size:50" json:"icon"`
	Color     string         `gorm:"size:20" json:"color"`
	// 删除 Type 字段 — 不再区分收入/支出/转账分类
	IsSystem  bool           `gorm:"default:false" json:"is_system"`
	SortOrder int            `gorm:"default:0" json:"sort_order"`
	Status    int            `gorm:"default:1" json:"status"`
	Records   []Record       `gorm:"foreignKey:CategoryID" json:"records,omitempty"`
}

func (Category) TableName() string {
	return "categories"
}
```

---

### Task 3: 后端 — 简化 Record Service

**Files:**
- Modify: `backend/internal/service/record.go`

- [ ] **从 CreateRecordRequest、UpdateRecordRequest、RecordListQuery 中删除 Type 字段**

```go
package service

import (
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

var (
	ErrRecordNotFound = errors.New("record not found")
)

type CreateRecordRequest struct {
	LedgerID   uint      `json:"ledger_id"`
	CategoryID uint      `json:"category_id" binding:"required"`
	Amount     float64   `json:"amount" binding:"required,gt=0"`
	// 删除 Type 字段 — 所有记录都是支出
	Date       time.Time `json:"date" binding:"required"`
	Note       string    `json:"note"`
	ImageURL   string    `json:"image_url"`
	Location   string    `json:"location"`
	Source     string    `json:"source"`
	TagIDs     []uint    `json:"tag_ids"`
}

type UpdateRecordRequest struct {
	CategoryID uint      `json:"category_id"`
	Amount     float64   `json:"amount"`
	// 删除 Type 字段 — 所有记录都是支出
	Date       *time.Time `json:"date"`
	Note       string    `json:"note"`
	ImageURL   string    `json:"image_url"`
	Location   string    `json:"location"`
	Source     string    `json:"source"`
	Status     int       `json:"status"`
	TagIDs     []uint    `json:"tag_ids"`
}

type RecordListQuery struct {
	LedgerID  uint
	StartDate *time.Time
	EndDate   *time.Time
	// 删除 Type 字段
	Page      int
	PageSize  int
}

type RecordService struct{}

func NewRecordService() *RecordService {
	return &RecordService{}
}

func (s *RecordService) List(userID uint, query RecordListQuery) ([]model.Record, int64, error) {
	db := database.GetDB()

	q := db.Where("user_id = ? AND status = 1", userID)

	if query.LedgerID > 0 {
		q = q.Where("ledger_id = ?", query.LedgerID)
	}

	if query.StartDate != nil {
		q = q.Where("date >= ?", query.StartDate)
	}

	if query.EndDate != nil {
		q = q.Where("date <= ?", query.EndDate)
	}

	// 删除 Type 过滤

	var total int64
	if err := q.Model(&model.Record{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if query.Page < 1 {
		query.Page = 1
	}
	if query.PageSize < 1 {
		query.PageSize = 20
	}
	if query.PageSize > 100 {
		query.PageSize = 100
	}

	offset := (query.Page - 1) * query.PageSize

	var records []model.Record
	if err := q.Preload("Category").Preload("Tags").Order("date DESC, id DESC").Offset(offset).Limit(query.PageSize).Find(&records).Error; err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

func (s *RecordService) GetByID(userID, recordID uint) (*model.Record, error) {
	db := database.GetDB()

	var record model.Record
	if err := db.Preload("Category").Preload("Tags").Where("id = ? AND user_id = ? AND status = 1", recordID, userID).First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	return &record, nil
}

func (s *RecordService) Create(userID uint, req *CreateRecordRequest) (*model.Record, error) {
	db := database.GetDB()

	ledgerID := req.LedgerID
	if ledgerID == 0 {
		var ledger model.Ledger
		if err := db.Where("user_id = ? AND is_default = ?", userID, true).First(&ledger).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("no default ledger found")
			}
			return nil, err
		}
		ledgerID = ledger.ID
	}

	var ledger model.Ledger
	if err := db.Where("id = ? AND user_id = ?", ledgerID, userID).First(&ledger).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("ledger not found")
		}
		return nil, err
	}

	var category model.Category
	if err := db.Where("id = ? AND user_id = ? AND status = 1", req.CategoryID, userID).First(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("category not found")
		}
		return nil, err
	}

	record := &model.Record{
		UserID:     userID,
		LedgerID:   ledgerID,
		CategoryID: req.CategoryID,
		Amount:     req.Amount,
		// 删除 Type 赋值
		Date:       req.Date,
		Note:       req.Note,
		ImageURL:   req.ImageURL,
		Location:   req.Location,
		Source:     req.Source,
		Status:     1,
	}

	tx := db.Begin()

	if err := tx.Create(record).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if len(req.TagIDs) > 0 {
		var tags []model.Tag
		if err := tx.Where("id IN ? AND user_id = ?", req.TagIDs, userID).Find(&tags).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
		if err := tx.Model(record).Association("Tags").Append(&tags); err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	tx.Commit()

	db.Preload("Category").Preload("Tags").First(&record, record.ID)

	return record, nil
}

func (s *RecordService) Update(userID, recordID uint, req *UpdateRecordRequest) (*model.Record, error) {
	db := database.GetDB()

	var record model.Record
	if err := db.Where("id = ? AND user_id = ? AND status = 1", recordID, userID).First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	if req.CategoryID > 0 && req.CategoryID != record.CategoryID {
		var category model.Category
		if err := db.Where("id = ? AND user_id = ? AND status = 1", req.CategoryID, userID).First(&category).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("category not found")
			}
			return nil, err
		}
	}

	tx := db.Begin()

	updates := map[string]interface{}{}
	if req.CategoryID > 0 {
		updates["category_id"] = req.CategoryID
	}
	if req.Amount > 0 {
		updates["amount"] = req.Amount
	}
	// 删除 Type 更新
	if req.Date != nil {
		updates["date"] = req.Date
	}
	if req.Note != "" {
		updates["note"] = req.Note
	}
	if req.ImageURL != "" {
		updates["image_url"] = req.ImageURL
	}
	if req.Location != "" {
		updates["location"] = req.Location
	}
	if req.Source != "" {
		updates["source"] = req.Source
	}
	if req.Status != 0 {
		updates["status"] = req.Status
	}

	if len(updates) > 0 {
		if err := tx.Model(&record).Updates(updates).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if req.TagIDs != nil {
		if err := tx.Model(&record).Association("Tags").Clear(); err != nil {
			tx.Rollback()
			return nil, err
		}

		if len(req.TagIDs) > 0 {
			var tags []model.Tag
			if err := tx.Where("id IN ? AND user_id = ?", req.TagIDs, userID).Find(&tags).Error; err != nil {
				tx.Rollback()
				return nil, err
			}
			if err := tx.Model(&record).Association("Tags").Append(&tags); err != nil {
				tx.Rollback()
				return nil, err
			}
		}
	}

	tx.Commit()

	db.Preload("Category").Preload("Tags").First(&record, recordID)

	return &record, nil
}

func (s *RecordService) Delete(userID, recordID uint) error {
	db := database.GetDB()

	var record model.Record
	if err := db.Where("id = ? AND user_id = ? AND status = 1", recordID, userID).First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRecordNotFound
		}
		return err
	}

	return db.Model(&record).Update("status", 0).Error
}
```

---

### Task 4: 后端 — 简化 Category Service

**Files:**
- Modify: `backend/internal/service/category.go`

- [ ] **删除 CreateCategoryRequest 中的 Type 字段，删除 List 方法的 type 过滤参数**

Changes:
1. `CreateCategoryRequest` — 删除 `Type model.CategoryType` 字段和 `binding:"required"`
2. `List(userID uint, categoryType *model.CategoryType)` → `List(userID uint) ([]model.Category, error)` — 删除 type 参数、删除 WHERE type 过滤
3. `Create()` — 删除 `Type: req.Type` 赋值
4. `GetCategories()` in LLM — 注意 Order 从 `"type, name"` 改为只 `"name"`

具体修改：

```go
// CreateCategoryRequest — 删除 Type 字段
type CreateCategoryRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=50"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}
```

```go
// List 方法 — 删除 categoryType 参数
func (s *CategoryService) List(userID uint) ([]model.Category, error) {
	db := database.GetDB()

	var categories []model.Category
	if err := db.Where("user_id = ? AND status = 1", userID).
		Order("is_system DESC, sort_order ASC, id ASC").
		Find(&categories).Error; err != nil {
		return nil, err
	}

	return categories, nil
}
```

```go
// Create 方法 — 删除 Type 赋值
record := &model.Category{
	UserID:    userID,
	Name:      req.Name,
	Icon:      req.Icon,
	Color:     req.Color,
	IsSystem:  false,
	SortOrder: 0,
	Status:    1,
}
```

---

### Task 5: 后端 — 简化 Stats Service（核心改动）

**Files:**
- Modify: `backend/internal/service/stats.go`

- [ ] **删除 income/balance 字段和所有相关查询**

```go
package service

import (
	"strconv"
	"time"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

type CategoryStats struct {
	CategoryID    uint    `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	CategoryIcon  string  `json:"category_icon"`
	CategoryColor string `json:"category_color"`
	TotalAmount   float64 `json:"total_amount"`
	Count         int64   `json:"count"`
	Percentage    float64 `json:"percentage"`
}

type MonthlyStats struct {
	Month        string  `json:"month"`
	Expense      float64 `json:"expense"`
	ExpenseCount int64   `json:"expense_count"`
	// 删除 Income / IncomeCount
}

type DailyStats struct {
	Date         string  `json:"date"`
	Expense      float64 `json:"expense"`
	ExpenseCount int64   `json:"expense_count"`
	// 删除 Income / IncomeCount
}

type TagStats struct {
	TagID       uint    `json:"tag_id"`
	TagName     string  `json:"tag_name"`
	TagColor    string  `json:"tag_color"`
	TotalAmount float64 `json:"total_amount"`
	Count       int64   `json:"count"`
}

type SummaryStats struct {
	TotalExpense float64        `json:"total_expense"`
	ExpenseCount int64          `json:"expense_count"`
	// 删除 TotalIncome / IncomeCount / Balance
	MonthlyStats []MonthlyStats `json:"monthly_stats"`
}

type StatsService struct{}

func NewStatsService() *StatsService {
	return &StatsService{}
}

func (s *StatsService) GetSummary(userID uint, ledgerID *uint, year int) (*SummaryStats, error) {
	db := database.GetDB()

	startDate := time.Date(year, 1, 1, 0, 0, 0, 0, time.Local)
	endDate := time.Date(year, 12, 31, 23, 59, 59, 0, time.Local)

	query := db.Model(&model.Record{}).Where("user_id = ? AND date >= ? AND date <= ? AND status = 1", userID, startDate, endDate)
	if ledgerID != nil && *ledgerID > 0 {
		query = query.Where("ledger_id = ?", *ledgerID)
	}

	ledgerFilter := ""
	var ledgerFilterArgs []interface{}
	if ledgerID != nil && *ledgerID > 0 {
		ledgerFilter = " AND ledger_id = ?"
		ledgerFilterArgs = []interface{}{*ledgerID}
	}

	// 只查询总支出（删除收入查询）
	var totalExpense float64
	db.Model(&model.Record{}).Select("COALESCE(SUM(amount), 0)").
		Where("user_id = ? AND date >= ? AND date <= ? AND status = 1"+ledgerFilter, append([]interface{}{userID, startDate, endDate}, ledgerFilterArgs...)...).
		Scan(&totalExpense)

	// 只查询支出笔数（删除收入笔数查询）
	var expenseCount int64
	db.Model(&model.Record{}).Where("user_id = ? AND date >= ? AND date <= ? AND status = 1"+ledgerFilter, append([]interface{}{userID, startDate, endDate}, ledgerFilterArgs...)...).Count(&expenseCount)

	monthlyStats := s.getMonthlyStats(userID, ledgerID, year)

	return &SummaryStats{
		TotalExpense: totalExpense,
		ExpenseCount: expenseCount,
		MonthlyStats: monthlyStats,
	}, nil
}

func (s *StatsService) getMonthlyStats(userID uint, ledgerID *uint, year int) []MonthlyStats {
	db := database.GetDB()

	var results []struct {
		Month int
		Total float64
		Count int64
	}

	query := db.Model(&model.Record{}).
		Select("strftime('%m', date) as month, SUM(amount) as total, COUNT(*) as count").
		Where("user_id = ? AND strftime('%Y', date) = ? AND status = 1", userID, strconv.Itoa(year)).
		Group("strftime('%m', date)")

	if ledgerID != nil && *ledgerID > 0 {
		query = query.Where("ledger_id = ?", *ledgerID)
	}

	query.Scan(&results)

	monthly := make([]MonthlyStats, 12)
	for i := 0; i < 12; i++ {
		monthly[i].Month = time.Month(i + 1).String()
	}

	for _, r := range results {
		monthIdx := r.Month - 1
		if monthIdx >= 0 && monthIdx < 12 {
			monthly[monthIdx].Expense = r.Total
			monthly[monthIdx].ExpenseCount = r.Count
		}
	}

	return monthly
}

func (s *StatsService) GetDailyStats(userID uint, ledgerID *uint, startDate, endDate time.Time) ([]DailyStats, error) {
	db := database.GetDB()

	query := db.Model(&model.Record{}).
		Select("date(date) as date, SUM(amount) as total, COUNT(*) as count").
		Where("user_id = ? AND date >= ? AND date <= ? AND status = 1", userID, startDate, endDate).
		Group("date(date)")

	if ledgerID != nil && *ledgerID > 0 {
		query = query.Where("ledger_id = ?", *ledgerID)
	}

	var results []struct {
		Date  string
		Total float64
		Count int64
	}

	query.Scan(&results)

	dailyMap := make(map[string]*DailyStats)
	for _, r := range results {
		dailyMap[r.Date] = &DailyStats{
			Date:         r.Date,
			Expense:      r.Total,
			ExpenseCount: r.Count,
		}
	}

	daily := make([]DailyStats, 0, len(dailyMap))
	for _, v := range dailyMap {
		daily = append(daily, *v)
	}

	return daily, nil
}

// GetCategoryStats 删除 recordType 参数，因为只查支出
func (s *StatsService) GetCategoryStats(userID uint, ledgerID *uint, startDate, endDate time.Time) ([]CategoryStats, error) {
	db := database.GetDB()

	query := db.Model(&model.Record{}).
		Select("records.category_id, categories.name as category_name, categories.icon as category_icon, categories.color as category_color, SUM(records.amount) as total_amount, COUNT(*) as count").
		Joins("JOIN categories ON records.category_id = categories.id").
		Where("records.user_id = ? AND records.date >= ? AND records.date <= ? AND records.status = 1", userID, startDate, endDate).
		Group("records.category_id, categories.name, categories.icon, categories.color")

	if ledgerID != nil && *ledgerID > 0 {
		query = query.Where("records.ledger_id = ?", *ledgerID)
	}

	// 删除 recordType 过滤

	var results []struct {
		CategoryID    uint
		CategoryName  string
		CategoryIcon  string
		CategoryColor string
		TotalAmount   float64
		Count         int64
	}

	query.Scan(&results)

	var total float64
	for _, r := range results {
		total += r.TotalAmount
	}

	categoryStats := make([]CategoryStats, len(results))
	for i, r := range results {
		percentage := float64(0)
		if total > 0 {
			percentage = (r.TotalAmount / total) * 100
		}
		categoryStats[i] = CategoryStats{
			CategoryID:    r.CategoryID,
			CategoryName:  r.CategoryName,
			CategoryIcon:  r.CategoryIcon,
			CategoryColor: r.CategoryColor,
			TotalAmount:   r.TotalAmount,
			Count:         r.Count,
			Percentage:    percentage,
		}
	}

	return categoryStats, nil
}

// GetMonthlyDetail 删除 recordType 参数
func (s *StatsService) GetMonthlyDetail(userID uint, ledgerID *uint, year, month int) ([]CategoryStats, error) {
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	endDate := startDate.AddDate(0, 1, -1)

	return s.GetCategoryStats(userID, ledgerID, startDate, endDate)
}

func (s *StatsService) GetTagStats(userID uint, ledgerID *uint, startDate, endDate time.Time) ([]TagStats, error) {
	// 不变 — TagStats 没有 income/balance 相关逻辑
	db := database.GetDB()

	query := db.Model(&model.Record{}).
		Select("tags.id as tag_id, tags.name as tag_name, tags.color as tag_color, SUM(records.amount) as total_amount, COUNT(*) as count").
		Joins("JOIN record_tags ON records.id = record_tags.record_id").
		Joins("JOIN tags ON record_tags.tag_id = tags.id").
		Where("records.user_id = ? AND records.date >= ? AND records.date <= ? AND records.status = 1", userID, startDate, endDate).
		Group("tags.id, tags.name, tags.color")

	if ledgerID != nil && *ledgerID > 0 {
		query = query.Where("records.ledger_id = ?", *ledgerID)
	}

	var results []struct {
		TagID       uint
		TagName     string
		TagColor    string
		TotalAmount float64
		Count       int64
	}

	query.Scan(&results)

	tagStats := make([]TagStats, len(results))
	for i, r := range results {
		tagStats[i] = TagStats{
			TagID:       r.TagID,
			TagName:     r.TagName,
			TagColor:    r.TagColor,
			TotalAmount: r.TotalAmount,
			Count:       r.Count,
		}
	}

	return tagStats, nil
}
```

---

### Task 6: 后端 — 简化 Stats Handler

**Files:**
- Modify: `backend/internal/handler/stats.go`

- [ ] **删除 RecordType 引用，简化 GetCategoryStats**

主要改动：
1. 删除 `"github.com/karsa/ai-payrecord2/backend/internal/model"` 导入（如果不再使用）
2. `GetCategoryStats` — 删除 `type` 查询参数解析和 `recordType` 变量
3. 传参从 `GetCategoryStats(..., recordType)` 变为不需要 type

```go
// GetCategoryStats handler 中删除 type 参数解析
func (h *StatsHandler) GetCategoryStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	startDate := time.Now().AddDate(0, 0, -30)
	endDate := time.Now()

	if startDateStr := c.Query("start_date"); startDateStr != "" {
		if t, err := time.Parse("2006-01-02", startDateStr); err == nil {
			startDate = t
		}
	}

	if endDateStr := c.Query("end_date"); endDateStr != "" {
		if t, err := time.Parse("2006-01-02", endDateStr); err == nil {
			endDate = t
		}
	}

	var ledgerID *uint
	if ledgerIDStr := c.Query("ledger_id"); ledgerIDStr != "" {
		if id, err := strconv.ParseUint(ledgerIDStr, 10, 32); err == nil {
			uid := uint(id)
			if uid > 0 {
				ledgerID = &uid
			}
		}
	}

	// 删除 type 参数解析

	stats, err := h.statsService.GetCategoryStats(userID, ledgerID, startDate, endDate)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, stats)
}
```

如果 model 包不再被 stats handler 使用，删除 import。

---

### Task 7: 后端 — 简化 Category Handler

**Files:**
- Modify: `backend/internal/handler/category.go`

- [ ] **删除 ListCategories 中的 type 查询参数**

```go
func (h *CategoryHandler) ListCategories(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 删除 type 查询参数解析

	categories, err := h.categoryService.List(userID)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, categories)
}
```

同时需检查是否还需导入 `"github.com/karsa/ai-payrecord2/backend/internal/model"`。如果不使用了，删除该导入。

---

### Task 8: 后端 — 简化 Record Handler

**Files:**
- Modify: `backend/internal/handler/record.go`

- [ ] **删除 ListRecords 中的 type 查询参数**

```go
// 在 ListRecords 中删除这一段:
if recordType := c.Query("type"); recordType != "" {
    if t, err := strconv.Atoi(recordType); err == nil {
        rt := model.RecordType(t)
        query.Type = &rt
    }
}
```

同时删除 `"github.com/karsa/ai-payrecord2/backend/internal/model"` 导入（如果不再使用），删除 `strconv` 导入（如果不再使用）。

---

### Task 9: 后端 — 简化 LLM 服务

**Files:**
- Modify: `backend/internal/service/llm.go`
- Modify: `backend/internal/service/llm_client.go`

- [ ] **从 LLMParsedRecord 和 LLMStructuredRecord 中删除 Type 字段**

llm.go 改动：

1. `LLMParsedRecord` — 删除 `Type model.RecordType` 字段
2. `LLMStructuredRecord` — 删除 `Type model.RecordType` 字段
3. `LLMCategorySuggestion` — 删除 `Type int` 字段
4. `ruleBasedParse()` — 删除 `result.Type = model.RecordTypeExpense` 初始化和 `isIncome()` 检查
5. `isIncome()` 方法 — 整个删除
6. `suggestCategories()` — 从每个 suggestion 中删除 `Type: 2`
7. `ConfirmRecord()` — 删除 `Type: req.Type`、删除 `model.CategoryType(req.Type)` 传参
8. `GetCategories()` — `Order("type, name")` → `Order("name")`

llm_client.go 改动：

1. `GetUserCategories()` — `Order("type, name")` → `Order("name")`，删除 `cat.Type` 判断
2. `ParseWithLLM()` — 简化 Prompt，删除 `"type": 1或2 (1=支出, 2=收入)` 和 type 相关字段描述
3. `categoryContext` — 简化，直接列出分类名不需要标注类型

具体 Prompt 修改：

```go
// 简化的 categoryContext — 不再按类型分组
var categoryContext strings.Builder
categoryContext.WriteString("用户已有的分类:\n")
for _, cat := range categories {
	categoryContext.WriteString(fmt.Sprintf("- ID:%d %s\n", cat.ID, cat.Name))
}
```

```go
// 简化的 systemPrompt — 删除 type 相关内容
systemPrompt := `你是一个记账助手。用户会输入自然语言描述消费，你需要提取结构化信息。

` + categoryContext.String() + `

请根据用户输入和已有分类，提取结构化信息。如果用户提到的分类不在已有分类中，请设置 category_id 为 0，并用 category_name 记录用户提到的分类名。

只返回JSON格式，不要包含其他文字。格式如下：
{
  "amount": 金额数字,
  "category_id": 分类ID数字,
  "category_name": "分类名称",
  "date": "日期YYYY-MM-DD格式",
  "note": "备注文字",
  "tags": ["标签数组"],
  "suggested_categories": [],
  "new_category_name": "如果提到新分类则填写，否则为空"
}`
```

---

### Task 10: 后端 — 删除数据库文件

**Files:**
- Delete: `backend/data/app.db`
- Delete: `backend/data/ledger.db`

- [ ] **删除 SQLite 数据库文件**

```bash
rm -f backend/data/app.db backend/data/ledger.db
```

---

### Task 11: 前端 — 简化类型定义

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **简化 RecordType、CategoryType、SummaryStats、MonthlyStats**

具体的 TypeScript 改动：

```ts
// Category 不再需要 type 字段
export interface Category {
  id: number
  user_id: number
  name: string
  icon?: string
  color?: string
  // 删除 type: CategoryType
  is_system: boolean
  sort_order: number
  status: number
  created_at: string
  updated_at: string
}

// 删除 CategoryType 类型 — 所有分类都是支出

// Record 不再需要 type 字段
export interface Record {
  id: number
  user_id: number
  ledger_id: number
  category_id: number
  amount: number
  // 删除 type: RecordType
  date: string
  note?: string
  image_url?: string
  location?: string
  source?: string
  status: number
  category?: Category
  tags?: Tag[]
  created_at: string
  updated_at: string
}

// 删除 RecordType 类型 — 所有记录都是支出

export interface SummaryStats {
  // 删除 total_income / income_count / balance
  total_expense: number
  expense_count: number
  monthly_stats: MonthlyStats[]
}

export interface MonthlyStats {
  month: string
  // 删除 income / income_count
  expense: number
  expense_count: number
}
```

---

### Task 12: 前端 — 简化 RecordForm 组件

**Files:**
- Modify: `frontend/src/components/RecordForm.tsx`

- [ ] **删除支出/收入类型选择器，简化 props**

接口改动：
- 删除 `type` 和 `onTypeChange` props
- 删除 `income`、`expenseAmount`、`incomeAmount` 翻译
- 分类直接显示所有（不再按 type 过滤）

```tsx
interface RecordFormProps {
  amount: string
  onAmountChange: (amount: string) => void
  date: string
  onDateChange: (date: string) => void
  categoryId: number | null
  onCategoryChange: (categoryId: number) => void
  tagIds: number[]
  onTagIdsChange: (tagIds: number[]) => void
  note: string
  onNoteChange: (note: string) => void
  categories: Category[]
  tags: Tag[]
  onSubmit: () => void
  isLoading: boolean
  isSubmitDisabled?: boolean
  submitText: string
  translations: {
    expenseAmount: string
    date: string
    category: string
    note: string
    notePlaceholder: string
    tags: string
  }
}

export function RecordForm({
  amount,
  onAmountChange,
  date,
  onDateChange,
  categoryId,
  onCategoryChange,
  tagIds,
  onTagIdsChange,
  note,
  onNoteChange,
  categories,
  tags,
  onSubmit,
  isLoading,
  isSubmitDisabled,
  submitText,
  translations,
}: RecordFormProps) {
  // 不再需要 categoryTypeFilter — 直接显示所有分类
  const filteredCategories = categories

  return (
    <div className="space-y-4">
      {/* 删除 Type Selector 区域 */}

      {/* Amount */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-1">
            {translations.expenseAmount}
          </div>
          <div className="flex items-center gap-1 text-3xl font-bold">
            <span>¥</span>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.00"
              className="text-3xl font-bold border-0 bg-transparent p-0 focus-visible:ring-0"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Date */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-1">{translations.date}</div>
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required
          />
        </CardContent>
      </Card>

      {/* Category — 直接显示所有分类 */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-2">{translations.category}</div>
          <div className="grid grid-cols-4 gap-2">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  categoryId === category.id
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'hover:bg-slate-100'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: category.color || '#666' }}
                >
                  <CategoryIcon icon={category.icon || 'HelpCircle'} size={20} />
                </div>
                <span className="text-xs">{category.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-2">{translations.tags}</div>
          <TagSelector
            tags={tags}
            selectedTagIds={tagIds}
            onChange={onTagIdsChange}
          />
        </CardContent>
      </Card>

      {/* Note */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-1">{translations.note}</div>
          <Input
            placeholder={translations.notePlaceholder}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-lg btn-press"
        disabled={isSubmitDisabled || isLoading || !amount || !categoryId}
        onClick={onSubmit}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Check className="h-5 w-5 mr-2" />
            {submitText}
          </>
        )}
      </Button>
    </div>
  )
}
```

---

### Task 13: 前端 — 简化 AddRecordPage 和 EditRecordPage

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx`
- Modify: `frontend/src/pages/EditRecordPage.tsx`

- [ ] **删除 type 状态和 onTypeChange，简化 translations 传参**

AddRecordPage 改动：
1. 删除 `const [type, setType] = useState<1 | 2>(1)` 状态
2. 删除 `onTypeChange` prop 传参
3. Translations 只传需要的字段，删除 `income`、`incomeAmount`

```tsx
// RecordForm 传参简化：
<RecordForm
  amount={amount}
  onAmountChange={setAmount}
  date={date}
  onDateChange={setDate}
  categoryId={categoryId}
  onCategoryChange={setCategoryId}
  tagIds={tagIds}
  onTagIdsChange={setTagIds}
  note={note}
  onNoteChange={setNote}
  categories={categories}
  tags={tags}
  onSubmit={handleSubmit}
  isLoading={isLoading}
  submitText={t('addRecord.save')}
  translations={{
    expenseAmount: t('addRecord.expenseAmount'),
    date: t('addRecord.date'),
    category: t('addRecord.category'),
    note: t('addRecord.note'),
    notePlaceholder: t('addRecord.notePlaceholder'),
    tags: t('tagSelector.addTags'),
  }}
/>
```

EditRecordPage 同样简化。

---

### Task 14: 前端 — 简化 HomePage

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **删除收入卡片和结余卡片，只保留支出统计**

移除的 JSX 段：
```tsx
{/* 删除收入卡片 */}
<div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
  <div className="text-sm text-muted-foreground">{t('home.income')}</div>
  <div className="text-xl font-bold text-green-600">¥{formatAmount(summary.total_income)}</div>
</div>

{/* 删除结余卡片 */}
<div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
  <div className="text-sm text-muted-foreground">{t('home.balance')}</div>
  <div className={`text-xl font-bold ${summary.balance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
    ¥{formatAmount(summary.balance)}
  </div>
</div>
```

只保留支出统计卡片。

---

### Task 15: 前端 — 简化 StatsPage

**Files:**
- Modify: `frontend/src/pages/StatsPage.tsx`

- [ ] **删除收入卡片、结余卡片、收入折线图/柱状图**

移除内容：
1. 收入统计卡片（类似 HomePage 的 `total_income`）
2. 结余统计卡片（`balance`）
3. LineChart 中 `dataKey="income"` 的 Line 元素
4. BarChart 中 `dataKey="income"` 的 Bar 元素
5. 所有引用 `summary.total_income`、`summary.balance`、`item.income` 的代码

---

### Task 16: 前端 — 简化 CategoryPage

**Files:**
- Modify: `frontend/src/pages/CategoryPage.tsx`

- [ ] **删除收入分类区域，简化分类类型标签**

移除内容：
1. "Income Categories" / "收入分类" 标题区域
2. 收入分类的列表渲染
3. 任何按 `category.type` 过滤分类的逻辑
4. 类型标签上 "Income" / "收入" 的 badge

页面只显示所有分类（不分类型），或者只保留"支出分类"区域。

---

### Task 17: 前端 — 简化 ExportPage 和 SettingsPage

**Files:**
- Modify: `frontend/src/pages/ExportPage.tsx`
- Modify: `frontend/src/pages/SettingsPage.tsx`

- [ ] **ExportPage: 简化记录类型标签**

```tsx
// 原来是:
{r.type === 1 ? t('export.expense') : t('export.income')}
// 改为直接显示支出:
t('export.expense')
```

- [ ] **SettingsPage: 删除预算设置链接**

移除段落：
```tsx
{/* 删除预算设置链接 */}
<Link to="/budget" className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
  <span className="font-medium">{t('settings.budgetSettings')}</span>
  <ChevronRight className="h-5 w-5 text-muted-foreground" />
</Link>
```

---

### Task 18: 前端 — 删除 BudgetPage 和相关路由/导航

**Files:**
- Delete: `frontend/src/pages/BudgetPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/config/navigation.ts`

- [ ] **删除 BudgetPage 文件**

```bash
rm frontend/src/pages/BudgetPage.tsx
```

- [ ] **从 App.tsx 中删除 budget 路由和 lazy import**

删除：
```tsx
const BudgetPage = lazy(() => import('@/pages/BudgetPage'))
```

和
```tsx
<Route path="budget" element={<BudgetPage />} />
```

- [ ] **从 navigation.ts 中删除 budget 导航项**

删除：
```ts
{ path: '/budget', labelKey: 'nav.budget', icon: PiggyBank }
```

---

### Task 19: 前端 — 清理 i18n

**Files:**
- Modify: `frontend/src/i18n/locales/en.json`
- Modify: `frontend/src/i18n/locales/zh.json`

- [ ] **删除 income/budget/balance 相关翻译**

从 en.json 和 zh.json 中删除以下键：

```json
// 删除:
"nav": {
  "budget": "Budget" / "预算"     // 删除这一行
}

"home": {
  "income": "Income" / "收入",      // 删除
  "balance": "Balance" / "结余"     // 删除
}

"addRecord": {
  "income": "Income" / "收入",      // 删除
  "incomeAmount": "Income Amount" / "收入金额"  // 删除
}

"category": {
  "incomeCategory": "Income Categories" / "收入分类"  // 删除
}

"settings": {
  "budgetSettings": "Budget Settings" / "预算设置"  // 删除
}

// 删除整个 budget 区块:
"budget": { ... }    // 整个删除

"export": {
  "income": "Income" / "收入"       // 删除
}
```

---

### Task 20: 更新测试文档

**Files:**
- Modify: `docs/superpowers/test-cases/ui-test-cases.md`
- Modify: `docs/superpowers/test-cases/api-test-cases.md`

- [ ] **UI 测试文档：删除 Budget 测试用例 (Section 9)**

删除整个 Section 9（TC-UI-BUDGET-001, 002, 003）。

删除或更新 TC-UI-CATEGORY-001 中 "Shows income and expense categories" → "Shows categories"。

更新 TC-UI-ADD-002（收入记录测试）— 删除整个用例。

更新 TC-UI-CATEGORY-002 — 删除 "Select type: 支出" 步骤（不再需要选择类型）。

- [ ] **API 测试文档：更新 Stats 测试用例**

更新 TC-API-STATS-001 期望返回的字段（删除 income/balance 字段）。
更新 TC-API-STATS-003 — 删除 `?type=1` 查询参数。
更新 TC-API-RECORD-002 — 删除 `"type": 1` 字段。
更新 TC-API-RECORD-003 — 删除 `"type": 1` 字段。
更新 TC-API-CATEGORY-002 — 删除 `"type": 1` 字段。

---

### Task 21: 端到端验证

- [ ] **编译后端**

```bash
cd backend && go build ./cmd/server/
```

- [ ] **检查编译错误** — 确保没有因类型删除导致的编译错误

- [ ] **编译前端**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **启动后端并测试 API**

```bash
cd backend && go run ./cmd/server/
```

测试：`curl http://localhost:8080/api/v1/stats/summary?year=2026`

- [ ] **启动前端并验证 UI**

```bash
cd frontend && npm run dev
```

浏览器打开 http://localhost:5173 验证。

- [ ] **运行 Hurl API 测试**

```bash
cd backend && hurl --test test-scripts/*.hurl
```

- [ ] **提交代码**

```bash
git add -A
git commit -m "refactor: remove budget, income, transfer, balance features

- Remove BudgetPage and related route/nav/i18n
- Remove income/transfer RecordType and CategoryType
- Remove income/balance from stats API
- Simplify RecordForm to expense-only
- Clean up i18n keys
- Rebuild database

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
