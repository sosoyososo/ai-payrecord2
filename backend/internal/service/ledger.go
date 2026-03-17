package service

import (
	"errors"

	"gorm.io/gorm"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

var (
	ErrLedgerNotFound = errors.New("ledger not found")
	ErrLedgerForbidden = errors.New("no permission to access this ledger")
)

type CreateLedgerRequest struct {
	Name      string `json:"name" binding:"required,min=1,max=50"`
	Icon      string `json:"icon"`
	Color     string `json:"color"`
	IsDefault bool   `json:"is_default"`
}

type UpdateLedgerRequest struct {
	Name      string `json:"name"`
	Icon      string `json:"icon"`
	Color     string `json:"color"`
	SortOrder int    `json:"sort_order"`
	Status    int    `json:"status"`
	IsDefault *bool  `json:"is_default"`
}

type LedgerService struct{}

func NewLedgerService() *LedgerService {
	return &LedgerService{}
}

func (s *LedgerService) List(userID uint) ([]model.Ledger, error) {
	db := database.GetDB()

	var ledgers []model.Ledger
	if err := db.Where("user_id = ? AND status = 1", userID).Order("is_default DESC, sort_order ASC, id ASC").Find(&ledgers).Error; err != nil {
		return nil, err
	}

	return ledgers, nil
}

func (s *LedgerService) GetByID(userID, ledgerID uint) (*model.Ledger, error) {
	db := database.GetDB()

	var ledger model.Ledger
	if err := db.Where("id = ? AND user_id = ?", ledgerID, userID).First(&ledger).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLedgerNotFound
		}
		return nil, err
	}

	return &ledger, nil
}

func (s *LedgerService) Create(userID uint, req *CreateLedgerRequest) (*model.Ledger, error) {
	db := database.GetDB()

	// If setting as default, unset other defaults
	if req.IsDefault {
		db.Model(&model.Ledger{}).Where("user_id = ?", userID).Update("is_default", false)
	}

	ledger := &model.Ledger{
		UserID:    userID,
		Name:      req.Name,
		Icon:      req.Icon,
		Color:     req.Color,
		IsDefault: req.IsDefault,
		Status:    1,
	}

	if err := db.Create(ledger).Error; err != nil {
		return nil, err
	}

	return ledger, nil
}

func (s *LedgerService) Update(userID, ledgerID uint, req *UpdateLedgerRequest) (*model.Ledger, error) {
	db := database.GetDB()

	// Check ownership
	var ledger model.Ledger
	if err := db.Where("id = ? AND user_id = ?", ledgerID, userID).First(&ledger).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLedgerNotFound
		}
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Icon != "" {
		updates["icon"] = req.Icon
	}
	if req.Color != "" {
		updates["color"] = req.Color
	}
	if req.SortOrder != 0 {
		updates["sort_order"] = req.SortOrder
	}
	if req.Status != 0 {
		updates["status"] = req.Status
	}

	// If setting as default, unset other defaults
	if req.IsDefault != nil && *req.IsDefault {
		db.Model(&model.Ledger{}).Where("user_id = ? AND id != ?", userID, ledgerID).Update("is_default", false)
		updates["is_default"] = true
	}

	if len(updates) > 0 {
		if err := db.Model(&ledger).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	db.First(&ledger, ledgerID)
	return &ledger, nil
}

func (s *LedgerService) Delete(userID, ledgerID uint) error {
	db := database.GetDB()

	// Check ownership
	var ledger model.Ledger
	if err := db.Where("id = ? AND user_id = ?", ledgerID, userID).First(&ledger).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrLedgerNotFound
		}
		return err
	}

	// Cannot delete default ledger
	if ledger.IsDefault {
		return errors.New("cannot delete default ledger")
	}

	// Soft delete - set status to 0
	return db.Model(&ledger).Update("status", 0).Error
}

func (s *LedgerService) GetDefault(userID uint) (*model.Ledger, error) {
	db := database.GetDB()

	var ledger model.Ledger
	if err := db.Where("user_id = ? AND is_default = true", userID).First(&ledger).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// If no default, get first ledger
			if err := db.Where("user_id = ? AND status = 1", userID).Order("id ASC").First(&ledger).Error; err != nil {
				return nil, ErrLedgerNotFound
			}
			return &ledger, nil
		}
		return nil, err
	}

	return &ledger, nil
}

func (s *LedgerService) SetDefault(userID, ledgerID uint) error {
	db := database.GetDB()

	// Check ownership
	var ledger model.Ledger
	if err := db.Where("id = ? AND user_id = ?", ledgerID, userID).First(&ledger).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrLedgerNotFound
		}
		return err
	}

	// Unset all defaults
	db.Model(&model.Ledger{}).Where("user_id = ?", userID).Update("is_default", false)

	// Set new default
	return db.Model(&ledger).Update("is_default", true).Error
}
