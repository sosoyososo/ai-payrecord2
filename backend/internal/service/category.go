package service

import (
	"errors"

	"gorm.io/gorm"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

var (
	ErrCategoryNotFound = errors.New("category not found")
)

type CreateCategoryRequest struct {
	Name     string        `json:"name" binding:"required,min=1,max=50"`
	Icon     string        `json:"icon"`
	Color    string        `json:"color"`
	Type     model.CategoryType `json:"type" binding:"required"`
}

type UpdateCategoryRequest struct {
	Name      string `json:"name"`
	Icon      string `json:"icon"`
	Color     string `json:"color"`
	SortOrder int    `json:"sort_order"`
	Status    int    `json:"status"`
}

type CategoryService struct{}

func NewCategoryService() *CategoryService {
	return &CategoryService{}
}

func (s *CategoryService) List(userID uint, categoryType *model.CategoryType) ([]model.Category, error) {
	db := database.GetDB()

	query := db.Where("user_id = ? AND status = 1", userID)
	if categoryType != nil {
		query = query.Where("type = ?", *categoryType)
	}

	var categories []model.Category
	if err := query.Order("is_system DESC, sort_order ASC, id ASC").Find(&categories).Error; err != nil {
		return nil, err
	}

	return categories, nil
}

func (s *CategoryService) GetByID(userID, categoryID uint) (*model.Category, error) {
	db := database.GetDB()

	var category model.Category
	if err := db.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}

	return &category, nil
}

func (s *CategoryService) Create(userID uint, req *CreateCategoryRequest) (*model.Category, error) {
	db := database.GetDB()

	category := &model.Category{
		UserID:   userID,
		Name:     req.Name,
		Icon:     req.Icon,
		Color:    req.Color,
		Type:     req.Type,
		IsSystem: false,
		Status:   1,
	}

	if err := db.Create(category).Error; err != nil {
		return nil, err
	}

	return category, nil
}

func (s *CategoryService) Update(userID, categoryID uint, req *UpdateCategoryRequest) (*model.Category, error) {
	db := database.GetDB()

	// Check ownership
	var category model.Category
	if err := db.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCategoryNotFound
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

	if len(updates) > 0 {
		if err := db.Model(&category).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	db.First(&category, categoryID)
	return &category, nil
}

func (s *CategoryService) Delete(userID, categoryID uint) error {
	db := database.GetDB()

	// Check ownership
	var category model.Category
	if err := db.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrCategoryNotFound
		}
		return err
	}

	// Cannot delete system category
	if category.IsSystem {
		return errors.New("cannot delete system category")
	}

	// Check if category is in use
	var count int64
	db.Model(&model.Record{}).Where("category_id = ?", categoryID).Count(&count)
	if count > 0 {
		return errors.New("category is in use, cannot delete")
	}

	// Soft delete - set status to 0
	return db.Model(&category).Update("status", 0).Error
}
