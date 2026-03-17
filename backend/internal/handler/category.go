package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/internal/response"
	"github.com/karsa/ai-payrecord2/backend/internal/service"
)

type CategoryHandler struct {
	categoryService *service.CategoryService
}

func NewCategoryHandler() *CategoryHandler {
	return &CategoryHandler{
		categoryService: service.NewCategoryService(),
	}
}

func (h *CategoryHandler) ListCategories(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse type query param
	var categoryType *model.CategoryType
	if typeStr := c.Query("type"); typeStr != "" {
		typeInt, err := strconv.Atoi(typeStr)
		if err == nil {
			ct := model.CategoryType(typeInt)
			categoryType = &ct
		}
	}

	categories, err := h.categoryService.List(userID, categoryType)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, categories)
}

func (h *CategoryHandler) GetCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	categoryID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid category ID")
		return
	}

	category, err := h.categoryService.GetByID(userID, uint(categoryID))
	if err != nil {
		if errors.Is(err, service.ErrCategoryNotFound) {
			response.NotFound(c, "Category not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, category)
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req service.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	category, err := h.categoryService.Create(userID, &req)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, category)
}

func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	categoryID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid category ID")
		return
	}

	var req service.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	category, err := h.categoryService.Update(userID, uint(categoryID), &req)
	if err != nil {
		if errors.Is(err, service.ErrCategoryNotFound) {
			response.NotFound(c, "Category not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, category)
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	categoryID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid category ID")
		return
	}

	err = h.categoryService.Delete(userID, uint(categoryID))
	if err != nil {
		if errors.Is(err, service.ErrCategoryNotFound) {
			response.NotFound(c, "Category not found")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "Category deleted successfully", nil)
}
