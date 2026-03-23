package config

import (
	"fmt"
	"os"
	"strings"
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
	AllowedOrigins []string
	BrevoAPIKey        string
	BrevoSenderEmail   string
	BrevoSenderName    string
	TokenEncryptionKey string
	DeepSeekAPIKey string
	DeepSeekAPIUrl string
	DeepSeekModel string
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
		AllowedOrigins: parseAllowedOrigins(getEnv("ALLOWED_ORIGINS", "")),
		BrevoAPIKey:        getEnv("BREVO_API_KEY", ""),
		BrevoSenderEmail:   getEnv("BREVO_SENDER_EMAIL", "noreply@example.com"),
		BrevoSenderName:    getEnv("BREVO_SENDER_NAME", "AI PayRecord"),
		TokenEncryptionKey: getEnv("TOKEN_ENCRYPTION_KEY", ""),
		DeepSeekAPIKey: getEnv("DEEPSEEK_API_KEY", ""),
		DeepSeekAPIUrl: getEnv("DEEPSEEK_API_URL", "https://api.deepseek.com/v1/chat/completions"),
		DeepSeekModel: getEnv("DEEPSEEK_MODEL", "deepseek-chat"),
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

func parseAllowedOrigins(env string) []string {
	if env == "" {
		return []string{}
	}
	origins := strings.Split(env, ",")
	result := make([]string, 0, len(origins))
	for _, o := range origins {
		trimmed := strings.TrimSpace(o)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
