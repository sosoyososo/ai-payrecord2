package handler

import (
	"errors"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/internal/response"
	"github.com/karsa/ai-payrecord2/backend/internal/service"
)

type RecordHandler struct {
	recordService *service.RecordService
}

func NewRecordHandler() *RecordHandler {
	return &RecordHandler{
		recordService: service.NewRecordService(),
	}
}

func (h *RecordHandler) ListRecords(c *gin.Context) {
	userID := middleware.GetUserID(c)

	query := service.RecordListQuery{
		Page:     1,
		PageSize: 20,
	}

	// Parse query params
	if ledgerID := c.Query("ledger_id"); ledgerID != "" {
		if id, err := strconv.ParseUint(ledgerID, 10, 32); err == nil {
			query.LedgerID = uint(id)
		}
	}

	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			query.StartDate = &t
		}
	}

	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			query.EndDate = &t
		}
	}

	if recordType := c.Query("type"); recordType != "" {
		if t, err := strconv.Atoi(recordType); err == nil {
			rt := model.RecordType(t)
			query.Type = &rt
		}
	}

	if page := c.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			query.Page = p
		}
	}

	if pageSize := c.Query("page_size"); pageSize != "" {
		if ps, err := strconv.Atoi(pageSize); err == nil && ps > 0 {
			query.PageSize = ps
		}
	}

	records, total, err := h.recordService.List(userID, query)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.PageSuccess(c, total, query.Page, query.PageSize, records)
}

func (h *RecordHandler) GetRecord(c *gin.Context) {
	userID := middleware.GetUserID(c)
	recordID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid record ID")
		return
	}

	record, err := h.recordService.GetByID(userID, uint(recordID))
	if err != nil {
		if errors.Is(err, service.ErrRecordNotFound) {
			response.NotFound(c, "Record not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, record)
}

func (h *RecordHandler) CreateRecord(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req service.CreateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	record, err := h.recordService.Create(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, record)
}

func (h *RecordHandler) UpdateRecord(c *gin.Context) {
	userID := middleware.GetUserID(c)
	recordID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid record ID")
		return
	}

	var req service.UpdateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	record, err := h.recordService.Update(userID, uint(recordID), &req)
	if err != nil {
		if errors.Is(err, service.ErrRecordNotFound) {
			response.NotFound(c, "Record not found")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, record)
}

func (h *RecordHandler) DeleteRecord(c *gin.Context) {
	userID := middleware.GetUserID(c)
	recordID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid record ID")
		return
	}

	err = h.recordService.Delete(userID, uint(recordID))
	if err != nil {
		if errors.Is(err, service.ErrRecordNotFound) {
			response.NotFound(c, "Record not found")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "Record deleted successfully", nil)
}
