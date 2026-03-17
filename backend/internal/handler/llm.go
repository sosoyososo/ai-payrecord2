package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/response"
	"github.com/karsa/ai-payrecord2/backend/internal/service"
)

type LLMHandler struct {
	llmService *service.LLMService
}

func NewLLMHandler() *LLMHandler {
	return &LLMHandler{
		llmService: service.NewLLMService(),
	}
}

func (h *LLMHandler) GetCategories(c *gin.Context) {
	userID := middleware.GetUserID(c)

	categories, err := h.llmService.GetCategories(userID)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, categories)
}

func (h *LLMHandler) ParseNaturalLanguage(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		Text string `json:"text" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.llmService.ParseNaturalLanguage(userID, req.Text)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	if result == nil {
		response.BadRequest(c, "Could not parse the text. Please include an amount (e.g., '花费100元').")
		return
	}

	response.Success(c, result)
}

func (h *LLMHandler) ConfirmRecord(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req service.LLMStructuredRecord
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	record, err := h.llmService.ConfirmRecord(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, record)
}
