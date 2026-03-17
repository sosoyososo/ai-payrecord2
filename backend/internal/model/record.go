package model

import (
	"time"

	"gorm.io/gorm"
)

type RecordType int

const (
	RecordTypeExpense  RecordType = 1 // Expense
	RecordTypeIncome   RecordType = 2 // Income
	RecordTypeTransfer RecordType = 3 // Transfer
)

type Record struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	UserID      uint           `gorm:"index;not null" json:"user_id"`
	LedgerID    uint           `gorm:"index;not null" json:"ledger_id"`
	CategoryID  uint           `gorm:"index;not null" json:"category_id"`
	Amount      float64        `gorm:"type:decimal(12,2);not null" json:"amount"`
	Type        RecordType     `gorm:"type:tinyint;not null;default:1" json:"type"` // 1: expense, 2: income, 3: transfer
	Date        time.Time      `gorm:"index;not null" json:"date"`
	Note        string         `gorm:"type:text" json:"note"`
	ImageURL    string         `gorm:"size:255" json:"image_url"`
	Location    string         `gorm:"size:100" json:"location"`
	Source      string         `gorm:"size:50" json:"source"` // manual, llm, import
	Status      int            `gorm:"default:1" json:"status"` // 1: active, 0: deleted
	Ledger      *Ledger        `gorm:"foreignKey:LedgerID" json:"ledger,omitempty"`
	Category    *Category      `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Tags        []Tag          `gorm:"many2many:record_tags;" json:"tags,omitempty"`
}

func (Record) TableName() string {
	return "records"
}
