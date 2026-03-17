package service

import (
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

var (
	ErrRecordNotFound = errors.New("record not found")
)

type CreateRecordRequest struct {
	LedgerID   uint            `json:"ledger_id"`
	CategoryID uint            `json:"category_id" binding:"required"`
	Amount     float64         `json:"amount" binding:"required,gt=0"`
	Type       model.RecordType `json:"type" binding:"required"`
	Date       time.Time       `json:"date" binding:"required"`
	Note       string          `json:"note"`
	ImageURL   string          `json:"image_url"`
	Location   string          `json:"location"`
	Source     string          `json:"source"`
	TagIDs     []uint          `json:"tag_ids"`
}

type UpdateRecordRequest struct {
	CategoryID uint     `json:"category_id"`
	Amount     float64  `json:"amount"`
	Type       model.RecordType `json:"type"`
	Date       *time.Time `json:"date"`
	Note       string    `json:"note"`
	ImageURL   string    `json:"image_url"`
	Location   string    `json:"location"`
	Source     string    `json:"source"`
	Status     int       `json:"status"`
	TagIDs     []uint    `json:"tag_ids"`
}

type RecordListQuery struct {
	LedgerID  uint
	StartDate *time.Time
	EndDate   *time.Time
	Type      *model.RecordType
	Page      int
	PageSize  int
}

type RecordService struct{}

func NewRecordService() *RecordService {
	return &RecordService{}
}

func (s *RecordService) List(userID uint, query RecordListQuery) ([]model.Record, int64, error) {
	db := database.GetDB()

	// Build query
	q := db.Where("user_id = ? AND status = 1", userID)

	if query.LedgerID > 0 {
		q = q.Where("ledger_id = ?", query.LedgerID)
	}

	if query.StartDate != nil {
		q = q.Where("date >= ?", query.StartDate)
	}

	if query.EndDate != nil {
		q = q.Where("date <= ?", query.EndDate)
	}

	if query.Type != nil {
		q = q.Where("type = ?", *query.Type)
	}

	// Get total count
	var total int64
	if err := q.Model(&model.Record{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Pagination
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PageSize < 1 {
		query.PageSize = 20
	}
	if query.PageSize > 100 {
		query.PageSize = 100
	}

	offset := (query.Page - 1) * query.PageSize

	// Get records with relations
	var records []model.Record
	if err := q.Preload("Category").Preload("Tags").Order("date DESC, id DESC").Offset(offset).Limit(query.PageSize).Find(&records).Error; err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

func (s *RecordService) GetByID(userID, recordID uint) (*model.Record, error) {
	db := database.GetDB()

	var record model.Record
	if err := db.Preload("Category").Preload("Tags").Where("id = ? AND user_id = ? AND status = 1", recordID, userID).First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	return &record, nil
}

func (s *RecordService) Create(userID uint, req *CreateRecordRequest) (*model.Record, error) {
	db := database.GetDB()

	// Get current ledger if not provided
	ledgerID := req.LedgerID
	if ledgerID == 0 {
		// Use default ledger
		var ledger model.Ledger
		if err := db.Where("user_id = ? AND is_default = ?", userID, true).First(&ledger).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("no default ledger found")
			}
			return nil, err
		}
		ledgerID = ledger.ID
	}

	// Verify ledger ownership
	var ledger model.Ledger
	if err := db.Where("id = ? AND user_id = ?", ledgerID, userID).First(&ledger).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("ledger not found")
		}
		return nil, err
	}

	// Verify category ownership
	var category model.Category
	if err := db.Where("id = ? AND user_id = ? AND status = 1", req.CategoryID, userID).First(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("category not found")
		}
		return nil, err
	}

	// Create record
	record := &model.Record{
		UserID:     userID,
		LedgerID:   ledgerID,
		CategoryID: req.CategoryID,
		Amount:     req.Amount,
		Type:       req.Type,
		Date:       req.Date,
		Note:       req.Note,
		ImageURL:   req.ImageURL,
		Location:   req.Location,
		Source:     req.Source,
		Status:     1,
	}

	// Start transaction
	tx := db.Begin()

	if err := tx.Create(record).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Add tags
	if len(req.TagIDs) > 0 {
		var tags []model.Tag
		if err := tx.Where("id IN ? AND user_id = ?", req.TagIDs, userID).Find(&tags).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
		if err := tx.Model(record).Association("Tags").Append(&tags); err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	tx.Commit()

	// Reload with relations
	db.Preload("Category").Preload("Tags").First(&record, record.ID)

	return record, nil
}

func (s *RecordService) Update(userID, recordID uint, req *UpdateRecordRequest) (*model.Record, error) {
	db := database.GetDB()

	// Check ownership
	var record model.Record
	if err := db.Where("id = ? AND user_id = ? AND status = 1", recordID, userID).First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRecordNotFound
		}
		return nil, err
	}

	// Verify category if provided
	if req.CategoryID > 0 && req.CategoryID != record.CategoryID {
		var category model.Category
		if err := db.Where("id = ? AND user_id = ? AND status = 1", req.CategoryID, userID).First(&category).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("category not found")
			}
			return nil, err
		}
	}

	// Start transaction
	tx := db.Begin()

	updates := map[string]interface{}{}
	if req.CategoryID > 0 {
		updates["category_id"] = req.CategoryID
	}
	if req.Amount > 0 {
		updates["amount"] = req.Amount
	}
	if req.Type != 0 {
		updates["type"] = req.Type
	}
	if req.Date != nil {
		updates["date"] = req.Date
	}
	if req.Note != "" {
		updates["note"] = req.Note
	}
	if req.ImageURL != "" {
		updates["image_url"] = req.ImageURL
	}
	if req.Location != "" {
		updates["location"] = req.Location
	}
	if req.Source != "" {
		updates["source"] = req.Source
	}
	if req.Status != 0 {
		updates["status"] = req.Status
	}

	if len(updates) > 0 {
		if err := tx.Model(&record).Updates(updates).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	// Update tags if provided
	if req.TagIDs != nil {
		// Clear existing tags
		if err := tx.Model(&record).Association("Tags").Clear(); err != nil {
			tx.Rollback()
			return nil, err
		}

		// Add new tags
		if len(req.TagIDs) > 0 {
			var tags []model.Tag
			if err := tx.Where("id IN ? AND user_id = ?", req.TagIDs, userID).Find(&tags).Error; err != nil {
				tx.Rollback()
				return nil, err
			}
			if err := tx.Model(&record).Association("Tags").Append(&tags); err != nil {
				tx.Rollback()
				return nil, err
			}
		}
	}

	tx.Commit()

	// Reload with relations
	db.Preload("Category").Preload("Tags").First(&record, recordID)

	return &record, nil
}

func (s *RecordService) Delete(userID, recordID uint) error {
	db := database.GetDB()

	// Check ownership
	var record model.Record
	if err := db.Where("id = ? AND user_id = ? AND status = 1", recordID, userID).First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRecordNotFound
		}
		return err
	}

	// Soft delete - set status to 0
	return db.Model(&record).Update("status", 0).Error
}
