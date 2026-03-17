package model

import (
	"time"

	"gorm.io/gorm"
)

type CategoryType int

const (
	CategoryTypeIncome  CategoryType = 1 // Income
	CategoryTypeExpense CategoryType = 2 // Expense
	CategoryTypeTransfer CategoryType = 3 // Transfer
)

type Category struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	Name      string         `gorm:"size:50;not null" json:"name"`
	Icon      string         `gorm:"size:50" json:"icon"`
	Color     string         `gorm:"size:20" json:"color"`
	Type      CategoryType   `gorm:"type:tinyint;not null;default:2" json:"type"` // 1: income, 2: expense, 3: transfer
	IsSystem  bool           `gorm:"default:false" json:"is_system"`
	SortOrder int            `gorm:"default:0" json:"sort_order"`
	Status    int            `gorm:"default:1" json:"status"` // 1: active, 0: hidden
	Records   []Record       `gorm:"foreignKey:CategoryID" json:"records,omitempty"`
}

func (Category) TableName() string {
	return "categories"
}
