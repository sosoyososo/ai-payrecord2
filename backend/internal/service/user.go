package service

import (
	"errors"

	"gorm.io/gorm"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
	"github.com/karsa/ai-payrecord2/backend/pkg/utils"
)

type UpdateProfileRequest struct {
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

type UserService struct{}

func NewUserService() *UserService {
	return &UserService{}
}

func (s *UserService) GetProfile(userID uint) (*model.User, error) {
	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

func (s *UserService) UpdateProfile(userID uint, req *UpdateProfileRequest) (*model.User, error) {
	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.Nickname != "" {
		updates["nickname"] = req.Nickname
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
	}

	if len(updates) > 0 {
		if err := db.Model(&user).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	db.First(&user, userID)
	return &user, nil
}

func (s *UserService) ChangePassword(userID uint, req *ChangePasswordRequest) error {
	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return err
	}

	// Verify old password
	if !utils.CheckPassword(req.OldPassword, user.Password) {
		return errors.New("incorrect old password")
	}

	// Hash new password
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	return db.Model(&user).Update("password", hashedPassword).Error
}
