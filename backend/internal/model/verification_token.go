package model

import (
	"time"
)

type VerificationToken struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Type      string    `gorm:"size:50;not null" json:"type"` // "password_reset" | "email_verification"
	Code      string    `gorm:"size:255;not null" json:"code"` // AES encrypted
	ExpiresAt time.Time `gorm:"index;not null" json:"expires_at"`
	Used      bool      `gorm:"default:false" json:"used"`
}

func (VerificationToken) TableName() string {
	return "verification_tokens"
}
