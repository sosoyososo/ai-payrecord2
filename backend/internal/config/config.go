package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DBPath       string
	JWTSecret    string
	JWTExpiryHours int
	OpenAIAPIKey string
	AnthropicAPIKey string
}

var AppConfig *Config

func Load() error {
	// Load .env file if exists
	_ = godotenv.Load()

	AppConfig = &Config{
		Port:         getEnv("PORT", "8080"),
		DBPath:       getEnv("DB_PATH", "./data/ledger.db"),
		JWTSecret:    getEnv("JWT_SECRET", "default-secret-key"),
		JWTExpiryHours: getEnvInt("JWT_EXPIRY_HOURS", 24),
		OpenAIAPIKey: getEnv("OPENAI_API_KEY", ""),
		AnthropicAPIKey: getEnv("ANTHROPIC_API_KEY", ""),
	}

	// Ensure DB directory exists
	dir := AppConfig.DBPath
	if dir != "" && dir != ":memory:" {
		// Get directory part
		for i := len(dir) - 1; i >= 0; i-- {
			if dir[i] == '/' || dir[i] == '\\' {
				dir = dir[:i]
				break
			}
		}
		if dir != "" && dir != AppConfig.DBPath {
			if err := os.MkdirAll(dir, 0755); err != nil {
				return fmt.Errorf("failed to create database directory: %w", err)
			}
		}
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var intVal int
		if _, err := fmt.Sscanf(value, "%d", &intVal); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func (c *Config) JWTExpiryHoursFromNow() time.Time {
	return time.Now().Add(time.Duration(c.JWTExpiryHours) * time.Hour)
}
