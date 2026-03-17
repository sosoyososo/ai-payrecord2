package model

import (
	"time"

	"gorm.io/gorm"
)

type RefreshToken struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	UserID    uint           `gorm:"index;not null" json:"user_id"`
	Token     string         `gorm:"uniqueIndex;size:255;not null" json:"token"`
	ExpiresAt time.Time      `gorm:"index;not null" json:"expires_at"`
	IPAddress string         `gorm:"size:50" json:"ip_address"`
	UserAgent string         `gorm:"size:255" json:"user_agent"`
	Status    int            `gorm:"default:1" json:"status"` // 1: active, 0: revoked
}

func (RefreshToken) TableName() string {
	return "refresh_tokens"
}
