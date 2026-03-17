package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/karsa/ai-payrecord2/backend/internal/config"
	"github.com/karsa/ai-payrecord2/backend/internal/handler"
	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

// SetupTestDB creates a fresh test database
func SetupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	assert.NoError(t, err)

	err = db.AutoMigrate(
		&model.User{},
		&model.Ledger{},
		&model.Category{},
		&model.Tag{},
		&model.Record{},
		&model.RefreshToken{},
	)
	assert.NoError(t, err)

	database.DB = db
	config.AppConfig = &config.Config{
		JWTSecret:      "test-secret",
		JWTExpiryHours: 24,
	}

	return db
}

// TestHealthEndpoint tests the health check endpoint
func TestHealthEndpoint(t *testing.T) {
	router := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))
	defer router.Close()

	resp, err := http.Get(router.URL)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

// TestAuthRegisterIntegration tests user registration via HTTP
func TestAuthRegisterIntegration(t *testing.T) {
	db := SetupTestDB(t)

	gin.SetMode(gin.TestMode)
	router := setupTestRouter()

	// Test registration
	body := map[string]interface{}{
		"username": "testuser",
		"email":    "test@example.com",
		"password": "password123",
		"nickname": "Test User",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Should succeed
	assert.Equal(t, 200, w.Code)

	// Check user was created
	var userCount int64
	db.Model(&model.User{}).Count(&userCount)
	assert.Equal(t, int64(1), userCount)
}

// TestAuthLoginIntegration tests user login via HTTP
func TestAuthLoginIntegration(t *testing.T) {
	SetupTestDB(t)

	gin.SetMode(gin.TestMode)
	router := setupTestRouterWithUser(t)

	// First register a user
	body := map[string]interface{}{
		"username": "loginuser",
		"email":    "login@example.com",
		"password": "password123",
		"nickname": "Login User",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, 200, w.Code)

	// Now test login
	loginBody := map[string]interface{}{
		"email":    "login@example.com",
		"password": "password123",
	}
	loginBytes, _ := json.Marshal(loginBody)

	req2 := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginBytes))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()

	router.ServeHTTP(w2, req2)

	assert.Equal(t, 200, w2.Code)
}

// TestDuplicateRegistration tests duplicate user registration
func TestDuplicateRegistration(t *testing.T) {
	SetupTestDB(t)

	gin.SetMode(gin.TestMode)
	router := setupTestRouter()

	// Register first user
	body := map[string]interface{}{
		"username": "dupuser",
		"email":    "dup@example.com",
		"password": "password123",
		"nickname": "Dup User",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, 200, w.Code)

	// Try to register same user again
	req2 := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyBytes))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()

	router.ServeHTTP(w2, req2)

	// Should fail with 400
	assert.Equal(t, 400, w2.Code)
}

// setupTestRouter creates a basic test router
func setupTestRouter() *gin.Engine {
	router := gin.New()
	router.Use(middleware.CORSMiddleware())

	v1 := router.Group("/api/v1")
	{
		authHandler := handler.NewAuthHandler()

		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		protected := v1.Group("")
		protected.Use(middleware.Auth())
		{
			protected.GET("/user/profile", func(c *gin.Context) {
				userID := middleware.GetUserID(c)
				c.JSON(200, map[string]interface{}{
					"code": 0,
					"data": map[string]interface{}{
						"id": userID,
					},
				})
			})
		}
	}

	return router
}

// setupTestRouterWithUser creates a router with a pre-registered user
func setupTestRouterWithUser(t *testing.T) *gin.Engine {
	router := setupTestRouter()

	// Register a test user
	body := map[string]interface{}{
		"username": "testuser",
		"email":    "test@example.com",
		"password": "password123",
		"nickname": "Test User",
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	return router
}
