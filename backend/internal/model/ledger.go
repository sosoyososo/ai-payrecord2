package model

import (
	"time"

	"gorm.io/gorm"
)

type Ledger struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	Name      string         `gorm:"size:50;not null" json:"name"`
	Icon      string         `gorm:"size:50" json:"icon"`
	Color     string         `gorm:"size:20" json:"color"`
	IsDefault bool           `gorm:"default:false" json:"is_default"`
	SortOrder int            `gorm:"default:0" json:"sort_order"`
	Status    int            `gorm:"default:1" json:"status"` // 1: active, 0: hidden
	Records   []Record       `gorm:"foreignKey:LedgerID" json:"records,omitempty"`
}

func (Ledger) TableName() string {
	return "ledgers"
}
