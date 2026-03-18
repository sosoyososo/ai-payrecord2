package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/internal/response"
	"github.com/karsa/ai-payrecord2/backend/internal/service"
)

type StatsHandler struct {
	statsService *service.StatsService
}

func NewStatsHandler() *StatsHandler {
	return &StatsHandler{
		statsService: service.NewStatsService(),
	}
}

func (h *StatsHandler) GetSummary(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse year
	year := time.Now().Year()
	if yearStr := c.Query("year"); yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil {
			year = y
		}
	}

	// Parse ledger_id
	var ledgerID *uint
	if ledgerIDStr := c.Query("ledger_id"); ledgerIDStr != "" {
		if id, err := strconv.ParseUint(ledgerIDStr, 10, 32); err == nil {
			uid := uint(id)
			if uid > 0 {
				ledgerID = &uid
			}
		}
	}

	summary, err := h.statsService.GetSummary(userID, ledgerID, year)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, summary)
}

func (h *StatsHandler) GetDailyStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse dates - support year/month or use defaults
	now := time.Now()
	startDate := now.AddDate(0, 0, -30) // Default: last 30 days
	endDate := now

	// Try to parse year/month
	if yearStr := c.Query("year"); yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			month := now.Month()
			if monthStr := c.Query("month"); monthStr != "" {
				if m, err := strconv.Atoi(monthStr); err == nil && m >= 1 && m <= 12 {
					month = time.Month(m)
				}
			}
			startDate = time.Date(year, month, 1, 0, 0, 0, 0, time.Local)
			endDate = startDate.AddDate(0, 1, -1) // End of month
		}
	} else if startDateStr := c.Query("start_date"); startDateStr != "" {
		if t, err := time.Parse("2006-01-02", startDateStr); err == nil {
			startDate = t
		}
	}

	if endDateStr := c.Query("end_date"); endDateStr != "" {
		if t, err := time.Parse("2006-01-02", endDateStr); err == nil {
			endDate = t
		}
	}

	// Parse ledger_id
	var ledgerID *uint
	if ledgerIDStr := c.Query("ledger_id"); ledgerIDStr != "" {
		if id, err := strconv.ParseUint(ledgerIDStr, 10, 32); err == nil {
			uid := uint(id)
			if uid > 0 {
				ledgerID = &uid
			}
		}
	}

	stats, err := h.statsService.GetDailyStats(userID, ledgerID, startDate, endDate)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, stats)
}

func (h *StatsHandler) GetCategoryStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse dates
	startDate := time.Now().AddDate(0, 0, -30) // Default: last 30 days
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

	// Parse ledger_id
	var ledgerID *uint
	if ledgerIDStr := c.Query("ledger_id"); ledgerIDStr != "" {
		if id, err := strconv.ParseUint(ledgerIDStr, 10, 32); err == nil {
			uid := uint(id)
			if uid > 0 {
				ledgerID = &uid
			}
		}
	}

	// Parse type
	var recordType *model.RecordType
	if typeStr := c.Query("type"); typeStr != "" {
		if t, err := strconv.Atoi(typeStr); err == nil {
			rt := model.RecordType(t)
			recordType = &rt
		}
	}

	stats, err := h.statsService.GetCategoryStats(userID, ledgerID, startDate, endDate, recordType)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, stats)
}

func (h *StatsHandler) GetMonthlyStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse year
	year := time.Now().Year()
	if yearStr := c.Query("year"); yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil {
			year = y
		}
	}

	// Parse ledger_id
	var ledgerID *uint
	if ledgerIDStr := c.Query("ledger_id"); ledgerIDStr != "" {
		if id, err := strconv.ParseUint(ledgerIDStr, 10, 32); err == nil {
			uid := uint(id)
			if uid > 0 {
				ledgerID = &uid
			}
		}
	}

	summary, err := h.statsService.GetSummary(userID, ledgerID, year)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, summary.MonthlyStats)
}

func (h *StatsHandler) GetTagStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse dates
	startDate := time.Now().AddDate(0, 0, -30) // Default: last 30 days
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

	// Parse ledger_id
	var ledgerID *uint
	if ledgerIDStr := c.Query("ledger_id"); ledgerIDStr != "" {
		if id, err := strconv.ParseUint(ledgerIDStr, 10, 32); err == nil {
			uid := uint(id)
			if uid > 0 {
				ledgerID = &uid
			}
		}
	}

	stats, err := h.statsService.GetTagStats(userID, ledgerID, startDate, endDate)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, stats)
}

func (h *StatsHandler) GetMonthlyDetail(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse year and month
	year := time.Now().Year()
	month := int(time.Now().Month())

	if yearStr := c.Query("year"); yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil {
			year = y
		}
	}

	if monthStr := c.Query("month"); monthStr != "" {
		if m, err := strconv.Atoi(monthStr); err == nil && m >= 1 && m <= 12 {
			month = m
		}
	}

	// Parse ledger_id
	var ledgerID *uint
	if ledgerIDStr := c.Query("ledger_id"); ledgerIDStr != "" {
		if id, err := strconv.ParseUint(ledgerIDStr, 10, 32); err == nil {
			uid := uint(id)
			if uid > 0 {
				ledgerID = &uid
			}
		}
	}

	stats, err := h.statsService.GetMonthlyDetail(userID, ledgerID, year, month)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, stats)
}
