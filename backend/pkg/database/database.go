package database

import (
	"fmt"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/karsa/ai-payrecord2/backend/internal/config"
)

var DB *gorm.DB

func Init() error {
	var err error

	config := config.AppConfig
	if config == nil {
		return fmt.Errorf("config not loaded")
	}

	DB, err = gorm.Open(sqlite.Open(config.DBPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect database: %w", err)
	}

	log.Printf("Database connected: %s", config.DBPath)
	return nil
}

func GetDB() *gorm.DB {
	return DB
}

func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
