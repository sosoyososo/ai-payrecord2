package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/response"
	"github.com/karsa/ai-payrecord2/backend/internal/service"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		userService: service.NewUserService(),
	}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	user, err := h.userService.GetProfile(userID)
	if err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "User not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req service.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.userService.UpdateProfile(userID, &req)
	if err != nil {
		if err == service.ErrUserNotFound {
			response.NotFound(c, "User not found")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, user)
}

func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req service.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	err := h.userService.ChangePassword(userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "Password changed successfully", nil)
}
