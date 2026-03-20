package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	Username      string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Email         string         `gorm:"uniqueIndex;size:100;not null" json:"email"`
	Password      string         `gorm:"size:255;not null" json:"-"`
	Nickname      string         `gorm:"size:50" json:"nickname"`
	Avatar        string         `gorm:"size:255" json:"avatar"`
	Status        int            `gorm:"default:1" json:"status"` // 1: active, 0: inactive
	EmailVerified bool           `gorm:"default:false" json:"email_verified"`
	Ledgers       []Ledger       `gorm:"foreignKey:UserID" json:"ledgers,omitempty"`
}

func (User) TableName() string {
	return "users"
}
