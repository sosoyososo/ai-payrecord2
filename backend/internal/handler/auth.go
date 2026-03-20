package handler

import (
	"errors"
	"log"

	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/config"
	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/response"
	"github.com/karsa/ai-payrecord2/backend/internal/service"
)

type AuthHandler struct {
	authService  *service.AuthService
	tokenSvc     *service.TokenService
	emailService *service.EmailService
}

func NewAuthHandler() *AuthHandler {
	tokenSvc, err := service.NewTokenService(config.AppConfig.TokenEncryptionKey)
	if err != nil {
		log.Fatalf("Failed to initialize TokenService: %v", err)
	}
	return &AuthHandler{
		authService:  service.NewAuthService(),
		tokenSvc:    tokenSvc,
		emailService: service.NewEmailService(tokenSvc),
	}
}

// Request types for new endpoints
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Code        string `json:"code" binding:"required,len=8"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

type VerifyEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required,len=8"`
}

type SendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
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

	// Send verification email
	user, err := h.authService.GetUserByEmail(req.Email)
	if err == nil {
		h.emailService.SendEmailVerification(user.ID, user.Email, user.Nickname)
	}

	response.SuccessWithMessage(c, "Verification email sent. Please check your inbox.", resp)
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
		// Check for email not verified error
		if err.Error() == "please verify your email before logging in" {
			response.BadRequest(c, "please verify your email before logging in")
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

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// Find user
	user, err := h.authService.GetUserByEmail(req.Email)
	if err != nil {
		// Return generic message to prevent user enumeration
		response.SuccessWithMessage(c, "If the email exists, a reset code has been sent.", nil)
		return
	}

	_, err = h.emailService.SendPasswordResetEmail(user.ID, user.Email, user.Nickname)
	if err != nil {
		response.InternalServerError(c, "Failed to send email")
		return
	}

	response.SuccessWithMessage(c, "If the email exists, a reset code has been sent.", nil)
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// Get user
	user, err := h.authService.GetUserByEmail(req.Email)
	if err != nil {
		response.BadRequest(c, "Invalid code")
		return
	}

	// Validate token
	token, err := h.tokenSvc.Validate(user.ID, service.TokenTypePasswordReset, req.Code)
	if err != nil {
		switch err {
		case service.ErrTokenNotFound, service.ErrTokenInvalid:
			response.BadRequest(c, "Invalid code")
		case service.ErrTokenExpired:
			response.BadRequest(c, "Code has expired")
		case service.ErrTokenUsed:
			response.BadRequest(c, "Code has already been used")
		default:
			response.InternalServerError(c, err.Error())
		}
		return
	}

	// Update password
	if err := h.authService.UpdatePassword(user.ID, req.NewPassword); err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	// Mark token as used
	h.tokenSvc.MarkUsed(token.ID)

	response.SuccessWithMessage(c, "Password has been reset successfully.", nil)
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.authService.GetUserByEmail(req.Email)
	if err != nil {
		response.BadRequest(c, "Invalid code")
		return
	}

	token, err := h.tokenSvc.Validate(user.ID, service.TokenTypeEmailVerification, req.Code)
	if err != nil {
		response.BadRequest(c, "Invalid code")
		return
	}

	if err := h.authService.MarkEmailVerified(user.ID); err != nil {
		response.InternalServerError(c, err.Error())
		return
	}

	h.tokenSvc.MarkUsed(token.ID)

	response.SuccessWithMessage(c, "Email verified successfully.", nil)
}

func (h *AuthHandler) SendVerification(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req SendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	user, err := h.authService.GetUserByEmail(req.Email)
	if err != nil {
		response.BadRequest(c, "User not found")
		return
	}

	// Verify the user making request matches the email
	if user.ID != userID {
		response.BadRequest(c, "Unauthorized")
		return
	}

	_, err = h.emailService.SendEmailVerification(user.ID, user.Email, user.Nickname)
	if err != nil {
		response.InternalServerError(c, "Failed to send email")
		return
	}

	response.SuccessWithMessage(c, "Verification email sent.", nil)
}
