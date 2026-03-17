package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/response"
	"github.com/karsa/ai-payrecord2/backend/internal/service"
)

type TagHandler struct {
	tagService *service.TagService
}

func NewTagHandler() *TagHandler {
	return &TagHandler{
		tagService: service.NewTagService(),
	}
}

func (h *TagHandler) ListTags(c *gin.Context) {
	userID := middleware.GetUserID(c)

	tags, err := h.tagService.List(userID)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, tags)
}

func (h *TagHandler) GetTag(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tagID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid tag ID")
		return
	}

	tag, err := h.tagService.GetByID(userID, uint(tagID))
	if err != nil {
		if errors.Is(err, service.ErrTagNotFound) {
			response.NotFound(c, "Tag not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, tag)
}

func (h *TagHandler) CreateTag(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req service.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	tag, err := h.tagService.Create(userID, &req)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, tag)
}

func (h *TagHandler) UpdateTag(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tagID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid tag ID")
		return
	}

	var req service.UpdateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	tag, err := h.tagService.Update(userID, uint(tagID), &req)
	if err != nil {
		if errors.Is(err, service.ErrTagNotFound) {
			response.NotFound(c, "Tag not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, tag)
}

func (h *TagHandler) DeleteTag(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tagID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid tag ID")
		return
	}

	err = h.tagService.Delete(userID, uint(tagID))
	if err != nil {
		if errors.Is(err, service.ErrTagNotFound) {
			response.NotFound(c, "Tag not found")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "Tag deleted successfully", nil)
}
