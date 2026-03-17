package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/response"
	"github.com/karsa/ai-payrecord2/backend/internal/service"
)

type LedgerHandler struct {
	ledgerService *service.LedgerService
}

func NewLedgerHandler() *LedgerHandler {
	return &LedgerHandler{
		ledgerService: service.NewLedgerService(),
	}
}

func (h *LedgerHandler) ListLedgers(c *gin.Context) {
	userID := middleware.GetUserID(c)

	ledgers, err := h.ledgerService.List(userID)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, ledgers)
}

func (h *LedgerHandler) GetLedger(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ledgerID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid ledger ID")
		return
	}

	ledger, err := h.ledgerService.GetByID(userID, uint(ledgerID))
	if err != nil {
		if errors.Is(err, service.ErrLedgerNotFound) {
			response.NotFound(c, "Ledger not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, ledger)
}

func (h *LedgerHandler) CreateLedger(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req service.CreateLedgerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	ledger, err := h.ledgerService.Create(userID, &req)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, ledger)
}

func (h *LedgerHandler) UpdateLedger(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ledgerID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid ledger ID")
		return
	}

	var req service.UpdateLedgerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	ledger, err := h.ledgerService.Update(userID, uint(ledgerID), &req)
	if err != nil {
		if errors.Is(err, service.ErrLedgerNotFound) {
			response.NotFound(c, "Ledger not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, ledger)
}

func (h *LedgerHandler) DeleteLedger(c *gin.Context) {
	userID := middleware.GetUserID(c)
	ledgerID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid ledger ID")
		return
	}

	err = h.ledgerService.Delete(userID, uint(ledgerID))
	if err != nil {
		if errors.Is(err, service.ErrLedgerNotFound) {
			response.NotFound(c, "Ledger not found")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "Ledger deleted successfully", nil)
}

func (h *LedgerHandler) GetCurrentLedger(c *gin.Context) {
	userID := middleware.GetUserID(c)

	ledger, err := h.ledgerService.GetDefault(userID)
	if err != nil {
		if errors.Is(err, service.ErrLedgerNotFound) {
			response.NotFound(c, "No ledger found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, ledger)
}

func (h *LedgerHandler) SetCurrentLedger(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		LedgerID uint `json:"ledger_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	err := h.ledgerService.SetDefault(userID, req.LedgerID)
	if err != nil {
		if errors.Is(err, service.ErrLedgerNotFound) {
			response.NotFound(c, "Ledger not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "Default ledger updated successfully", nil)
}
