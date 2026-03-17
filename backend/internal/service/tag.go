package service

import (
	"errors"

	"gorm.io/gorm"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

var (
	ErrTagNotFound = errors.New("tag not found")
)

type CreateTagRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=50"`
	Color string `json:"color"`
}

type UpdateTagRequest struct {
	Name      string `json:"name"`
	Color     string `json:"color"`
	SortOrder int    `json:"sort_order"`
	Status    int    `json:"status"`
}

type TagService struct{}

func NewTagService() *TagService {
	return &TagService{}
}

func (s *TagService) List(userID uint) ([]model.Tag, error) {
	db := database.GetDB()

	var tags []model.Tag
	if err := db.Where("user_id = ? AND status = 1", userID).Order("is_system DESC, sort_order ASC, id ASC").Find(&tags).Error; err != nil {
		return nil, err
	}

	return tags, nil
}

func (s *TagService) GetByID(userID, tagID uint) (*model.Tag, error) {
	db := database.GetDB()

	var tag model.Tag
	if err := db.Where("id = ? AND user_id = ?", tagID, userID).First(&tag).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTagNotFound
		}
		return nil, err
	}

	return &tag, nil
}

func (s *TagService) Create(userID uint, req *CreateTagRequest) (*model.Tag, error) {
	db := database.GetDB()

	tag := &model.Tag{
		UserID:   userID,
		Name:     req.Name,
		Color:    req.Color,
		IsSystem: false,
		Status:   1,
	}

	if err := db.Create(tag).Error; err != nil {
		return nil, err
	}

	return tag, nil
}

func (s *TagService) Update(userID, tagID uint, req *UpdateTagRequest) (*model.Tag, error) {
	db := database.GetDB()

	// Check ownership
	var tag model.Tag
	if err := db.Where("id = ? AND user_id = ?", tagID, userID).First(&tag).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTagNotFound
		}
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
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

	if len(updates) > 0 {
		if err := db.Model(&tag).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	db.First(&tag, tagID)
	return &tag, nil
}

func (s *TagService) Delete(userID, tagID uint) error {
	db := database.GetDB()

	// Check ownership
	var tag model.Tag
	if err := db.Where("id = ? AND user_id = ?", tagID, userID).First(&tag).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTagNotFound
		}
		return err
	}

	// Cannot delete system tag
	if tag.IsSystem {
		return errors.New("cannot delete system tag")
	}

	// Check if tag is in use (via record_tags)
	var count int64
	db.Table("record_tags").Where("tag_id = ?", tagID).Count(&count)
	if count > 0 {
		return errors.New("tag is in use, cannot delete")
	}

	// Soft delete - set status to 0
	return db.Model(&tag).Update("status", 0).Error
}
