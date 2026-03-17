package handler

import (
	"errors"

	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/response"
	"github.com/karsa/ai-payrecord2/backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService: service.NewAuthService(),
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	resp, err := h.authService.Register(&req)
	if err != nil {
		if errors.Is(err, service.ErrUserExists) {
			response.BadRequest(c, "User already exists")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, resp)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	resp, err := h.authService.Login(&req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCreds) {
			response.BadRequest(c, "Invalid email or password")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, resp)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req service.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	resp, err := h.authService.Refresh(&req)
	if err != nil {
		if errors.Is(err, service.ErrTokenInvalid) || errors.Is(err, service.ErrTokenExpired) {
			response.Unauthorized(c, "Invalid or expired refresh token")
			return
		}
		response.InternalServerError(c, err.Error())
		return
	}

	response.Success(c, resp)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Get refresh token from body
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	c.ShouldBindJSON(&req)

	err := h.authService.Logout(userID, req.RefreshToken)
	if err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	response.SuccessWithMessage(c, "Logged out successfully", nil)
}
