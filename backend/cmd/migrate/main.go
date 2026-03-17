package main

import (
	"log"

	"github.com/karsa/ai-payrecord2/backend/internal/config"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

func main() {
	// Load configuration
	if err := config.Load(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	if err := database.Init(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	db := database.GetDB()

	// Create indexes
	indexes := []struct {
		table   string
		name    string
		columns string
	}{
		// Records indexes
		{"records", "idx_records_user_date", "user_id, date"},
		{"records", "idx_records_ledger_date", "ledger_id, date"},
		{"records", "idx_records_category_date", "category_id, date"},
		{"records", "idx_records_user_ledger", "user_id, ledger_id"},

		// Categories indexes
		{"categories", "idx_categories_user_type", "user_id, type"},

		// Tags indexes
		{"tags", "idx_tags_user_name", "user_id, name"},

		// Ledgers indexes
		{"ledgers", "idx_ledgers_user_default", "user_id, is_default"},
	}

	for _, idx := range indexes {
		sql := "CREATE INDEX IF NOT EXISTS " + idx.name + " ON " + idx.table + " (" + idx.columns + ")"
		if err := db.Exec(sql).Error; err != nil {
			log.Printf("Warning: Failed to create index %s: %v", idx.name, err)
		} else {
			log.Printf("Created index: %s", idx.name)
		}
	}

	log.Println("Database indexes created successfully")
}
