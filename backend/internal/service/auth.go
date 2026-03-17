package service

import (
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/karsa/ai-payrecord2/backend/internal/config"
	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
	"github.com/karsa/ai-payrecord2/backend/pkg/utils"
)

var (
	ErrUserExists     = errors.New("user already exists")
	ErrInvalidCreds  = errors.New("invalid credentials")
	ErrUserNotFound  = errors.New("user not found")
	ErrTokenInvalid  = errors.New("invalid token")
	ErrTokenExpired  = errors.New("token expired")
)

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         *model.User `json:"user"`
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	ExpiresIn    int64       `json:"expires_in"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

func (s *AuthService) Register(req *RegisterRequest) (*AuthResponse, error) {
	db := database.GetDB()

	// Check if user exists
	var count int64
	db.Model(&model.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 {
		return nil, ErrUserExists
	}

	db.Model(&model.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		return nil, errors.New("username already exists")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &model.User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
		Nickname: req.Nickname,
		Status:   1,
	}

	if err := db.Create(user).Error; err != nil {
		return nil, err
	}

	// Create default ledger for user
	ledger := &model.Ledger{
		UserID:    user.ID,
		Name:      "默认账本",
		Icon:      "wallet",
		Color:     "#4CAF50",
		IsDefault: true,
		Status:    1,
	}
	if err := db.Create(ledger).Error; err != nil {
		return nil, err
	}

	// Seed default categories for user
	s.seedDefaultCategories(db, user.ID)

	// Seed default tags for user
	s.seedDefaultTags(db, user.ID)

	// Generate tokens
	accessToken, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	refreshToken, _, err := s.generateRefreshToken(db, user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(config.AppConfig.JWTExpiryHours * 3600),
	}, nil
}

func (s *AuthService) Login(req *LoginRequest) (*AuthResponse, error) {
	db := database.GetDB()

	// Find user
	var user model.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCreds
		}
		return nil, err
	}

	// Check password
	if !utils.CheckPassword(req.Password, user.Password) {
		return nil, ErrInvalidCreds
	}

	// Check user status
	if user.Status != 1 {
		return nil, errors.New("user account is disabled")
	}

	// Generate tokens
	accessToken, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	refreshToken, _, err := s.generateRefreshToken(db, user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(config.AppConfig.JWTExpiryHours * 3600),
	}, nil
}

func (s *AuthService) Refresh(req *RefreshRequest) (*AuthResponse, error) {
	db := database.GetDB()

	// Find refresh token
	var token model.RefreshToken
	if err := db.Where("token = ? AND status = 1", req.RefreshToken).First(&token).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTokenInvalid
		}
		return nil, err
	}

	// Check if token expired
	if time.Now().After(token.ExpiresAt) {
		return nil, ErrTokenExpired
	}

	// Find user
	var user model.User
	if err := db.First(&user, token.UserID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	// Revoke old refresh token
	db.Model(&token).Update("status", 0)

	// Generate new tokens
	accessToken, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	newRefreshToken, _, err := s.generateRefreshToken(db, user.ID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         &user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(config.AppConfig.JWTExpiryHours * 3600),
	}, nil
}

func (s *AuthService) Logout(userID uint, refreshToken string) error {
	db := database.GetDB()

	// Revoke refresh token
	if refreshToken != "" {
		db.Model(&model.RefreshToken{}).
			Where("user_id = ? AND token = ?", userID, refreshToken).
			Update("status", 0)
	}

	return nil
}

func (s *AuthService) generateRefreshToken(db *gorm.DB, userID uint) (string, time.Time, error) {
	token := middleware.GenerateRefreshTokenString()
	expiresAt := time.Now().Add(30 * 24 * time.Hour) // 30 days

	refreshToken := &model.RefreshToken{
		UserID:    userID,
		Token:     token,
		ExpiresAt: expiresAt,
		Status:    1,
	}

	if err := db.Create(refreshToken).Error; err != nil {
		return "", time.Time{}, err
	}

	return token, expiresAt, nil
}

func (s *AuthService) seedDefaultCategories(db *gorm.DB, userID uint) {
	// Expense categories
	expenseCategories := []struct {
		Name string
		Icon string
		Color string
	}{
		{"餐饮", "restaurant", "#FF5722"},
		{"交通", "directions_car", "#2196F3"},
		{"购物", "shopping_bag", "#E91E63"},
		{"娱乐", "movie", "#9C27B0"},
		{"住房", "home", "#795548"},
		{"医疗", "local_hospital", "#F44336"},
		{"教育", "school", "#00BCD4"},
		{"通讯", "phone", "#607D8B"},
		{"其他", "more_horiz", "#9E9E9E"},
	}

	// Income categories
	incomeCategories := []struct {
		Name string
		Icon string
		Color string
	}{
		{"工资", "work", "#4CAF50"},
		{"奖金", "card_giftcard", "#8BC34A"},
		{"投资", "trending_up", "#CDDC39"},
		{"其他收入", "attach_money", "#FFEB3B"},
	}

	for _, cat := range expenseCategories {
		db.Create(&model.Category{
			UserID:   userID,
			Name:     cat.Name,
			Icon:     cat.Icon,
			Color:    cat.Color,
			Type:     model.CategoryTypeExpense,
			IsSystem: true,
			Status:   1,
		})
	}

	for _, cat := range incomeCategories {
		db.Create(&model.Category{
			UserID:   userID,
			Name:     cat.Name,
			Icon:     cat.Icon,
			Color:    cat.Color,
			Type:     model.CategoryTypeIncome,
			IsSystem: true,
			Status:   1,
		})
	}
}

func (s *AuthService) seedDefaultTags(db *gorm.DB, userID uint) {
	tags := []struct {
		Name  string
		Color string
	}{
		{"必须", "#F44336"},
		{"可选", "#2196F3"},
		{"紧急", "#FF9800"},
		{"待办", "#9C27B0"},
		{"常规", "#607D8B"},
	}

	for _, tag := range tags {
		db.Create(&model.Tag{
			UserID:   userID,
			Name:     tag.Name,
			Color:    tag.Color,
			IsSystem: true,
			Status:   1,
		})
	}
}
