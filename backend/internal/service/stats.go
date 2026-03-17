package service

import (
	"time"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

type CategoryStats struct {
	CategoryID   uint    `json:"category_id"`
	CategoryName string  `json:"category_name"`
	CategoryIcon string  `json:"category_icon"`
	CategoryColor string `json:"category_color"`
	TotalAmount  float64 `json:"total_amount"`
	Count        int64   `json:"count"`
	Percentage   float64 `json:"percentage"`
}

type MonthlyStats struct {
	Month      string  `json:"month"`
	Income     float64 `json:"income"`
	Expense    float64 `json:"expense"`
	IncomeCount  int64   `json:"income_count"`
	ExpenseCount int64   `json:"expense_count"`
}

type DailyStats struct {
	Date       string  `json:"date"`
	Income     float64 `json:"income"`
	Expense    float64 `json:"expense"`
	IncomeCount  int64   `json:"income_count"`
	ExpenseCount int64   `json:"expense_count"`
}

type TagStats struct {
	TagID      uint    `json:"tag_id"`
	TagName    string  `json:"tag_name"`
	TagColor   string  `json:"tag_color"`
	TotalAmount float64 `json:"total_amount"`
	Count      int64   `json:"count"`
}

type SummaryStats struct {
	TotalIncome    float64      `json:"total_income"`
	TotalExpense   float64      `json:"total_expense"`
	IncomeCount   int64        `json:"income_count"`
	ExpenseCount   int64        `json:"expense_count"`
	Balance        float64      `json:"balance"`
	MonthlyStats   []MonthlyStats `json:"monthly_stats"`
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

	// Get total income
	var totalIncome float64
	db.Model(&model.Record{}).Select("COALESCE(SUM(amount), 0)").
		Where("user_id = ? AND type = ? AND date >= ? AND date <= ? AND status = 1", userID, model.RecordTypeIncome, startDate, endDate).
		Scan(&totalIncome)

	// Get total expense
	var totalExpense float64
	db.Model(&model.Record{}).Select("COALESCE(SUM(amount), 0)").
		Where("user_id = ? AND type = ? AND date >= ? AND date <= ? AND status = 1", userID, model.RecordTypeExpense, startDate, endDate).
		Scan(&totalExpense)

	// Get counts
	var incomeCount, expenseCount int64
	db.Model(&model.Record{}).Where("user_id = ? AND type = ? AND date >= ? AND date <= ? AND status = 1", userID, model.RecordTypeIncome, startDate, endDate).Count(&incomeCount)
	db.Model(&model.Record{}).Where("user_id = ? AND type = ? AND date >= ? AND date <= ? AND status = 1", userID, model.RecordTypeExpense, startDate, endDate).Count(&expenseCount)

	// Get monthly stats
	monthlyStats := s.getMonthlyStats(userID, ledgerID, year)

	return &SummaryStats{
		TotalIncome:   totalIncome,
		TotalExpense:  totalExpense,
		IncomeCount:   incomeCount,
		ExpenseCount:  expenseCount,
		Balance:       totalIncome - totalExpense,
		MonthlyStats:  monthlyStats,
	}, nil
}

func (s *StatsService) getMonthlyStats(userID uint, ledgerID *uint, year int) []MonthlyStats {
	db := database.GetDB()

	var results []struct {
		Month  int
		Type   int
		Total  float64
		Count  int64
	}

	query := db.Model(&model.Record{}).
		Select("strftime('%m', date) as month, type, SUM(amount) as total, COUNT(*) as count").
		Where("user_id = ? AND strftime('%Y', date) = ? AND status = 1", userID, string(rune(year))).
		Group("strftime('%m', date), type")

	if ledgerID != nil && *ledgerID > 0 {
		query = query.Where("ledger_id = ?", *ledgerID)
	}

	query.Scan(&results)

	// Initialize all 12 months
	monthly := make([]MonthlyStats, 12)
	for i := 0; i < 12; i++ {
		monthly[i].Month = time.Month(i + 1).String()
	}

	// Fill in data
	for _, r := range results {
		monthIdx := r.Month - 1
		if monthIdx >= 0 && monthIdx < 12 {
			if r.Type == int(model.RecordTypeIncome) {
				monthly[monthIdx].Income = r.Total
				monthly[monthIdx].IncomeCount = r.Count
			} else if r.Type == int(model.RecordTypeExpense) {
				monthly[monthIdx].Expense = r.Total
				monthly[monthIdx].ExpenseCount = r.Count
			}
		}
	}

	return monthly
}

func (s *StatsService) GetDailyStats(userID uint, ledgerID *uint, startDate, endDate time.Time) ([]DailyStats, error) {
	db := database.GetDB()

	query := db.Model(&model.Record{}).
		Select("date(date) as date, type, SUM(amount) as total, COUNT(*) as count").
		Where("user_id = ? AND date >= ? AND date <= ? AND status = 1", userID, startDate, endDate).
		Group("date(date), type")

	if ledgerID != nil && *ledgerID > 0 {
		query = query.Where("ledger_id = ?", *ledgerID)
	}

	var results []struct {
		Date  time.Time
		Type  int
		Total float64
		Count int64
	}

	query.Scan(&results)

	// Group by date
	dailyMap := make(map[string]*DailyStats)
	for _, r := range results {
		dateStr := r.Date.Format("2006-01-02")
		if dailyMap[dateStr] == nil {
			dailyMap[dateStr] = &DailyStats{Date: dateStr}
		}
		if r.Type == int(model.RecordTypeIncome) {
			dailyMap[dateStr].Income = r.Total
			dailyMap[dateStr].IncomeCount = r.Count
		} else if r.Type == int(model.RecordTypeExpense) {
			dailyMap[dateStr].Expense = r.Total
			dailyMap[dateStr].ExpenseCount = r.Count
		}
	}

	daily := make([]DailyStats, 0, len(dailyMap))
	for _, v := range dailyMap {
		daily = append(daily, *v)
	}

	return daily, nil
}

func (s *StatsService) GetCategoryStats(userID uint, ledgerID *uint, startDate, endDate time.Time, recordType *model.RecordType) ([]CategoryStats, error) {
	db := database.GetDB()

	query := db.Model(&model.Record{}).
		Select("records.category_id, categories.name as category_name, categories.icon as category_icon, categories.color as category_color, SUM(records.amount) as total_amount, COUNT(*) as count").
		Joins("JOIN categories ON records.category_id = categories.id").
		Where("records.user_id = ? AND records.date >= ? AND records.date <= ? AND records.status = 1", userID, startDate, endDate).
		Group("records.category_id, categories.name, categories.icon, categories.color")

	if ledgerID != nil && *ledgerID > 0 {
		query = query.Where("records.ledger_id = ?", *ledgerID)
	}

	if recordType != nil {
		query = query.Where("records.type = ?", *recordType)
	}

	var results []struct {
		CategoryID    uint
		CategoryName  string
		CategoryIcon  string
		CategoryColor string
		TotalAmount   float64
		Count         int64
	}

	query.Scan(&results)

	// Calculate total for percentage
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

func (s *StatsService) GetMonthlyDetail(userID uint, ledgerID *uint, year, month int) ([]CategoryStats, error) {
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
	endDate := startDate.AddDate(0, 1, -1)

	return s.GetCategoryStats(userID, ledgerID, startDate, endDate, nil)
}

func (s *StatsService) GetTagStats(userID uint, ledgerID *uint, startDate, endDate time.Time) ([]TagStats, error) {
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
		TagID      uint
		TagName    string
		TagColor   string
		TotalAmount float64
		Count      int64
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
