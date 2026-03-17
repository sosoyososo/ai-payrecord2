package model

import (
	"time"

	"gorm.io/gorm"
)

type Tag struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	Name      string         `gorm:"size:50;not null" json:"name"`
	Color     string         `gorm:"size:20" json:"color"`
	IsSystem  bool           `gorm:"default:false" json:"is_system"`
	SortOrder int            `gorm:"default:0" json:"sort_order"`
	Status    int            `gorm:"default:1" json:"status"` // 1: active, 0: hidden
	Records   []Record       `gorm:"many2many:record_tags;" json:"records,omitempty"`
}

func (Tag) TableName() string {
	return "tags"
}
