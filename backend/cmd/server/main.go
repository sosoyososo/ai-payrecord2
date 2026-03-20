package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"

	"github.com/karsa/ai-payrecord2/backend/internal/config"
	"github.com/karsa/ai-payrecord2/backend/internal/handler"
	"github.com/karsa/ai-payrecord2/backend/internal/middleware"
	"github.com/karsa/ai-payrecord2/backend/internal/model"
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

	// Auto migrate models
	if err := database.GetDB().AutoMigrate(
		&model.User{},
		&model.Ledger{},
		&model.Category{},
		&model.Tag{},
		&model.Record{},
		&model.RefreshToken{},
		&model.VerificationToken{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Initialize Gin router
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.Logger())

	// Add CORS middleware
	router.Use(middleware.CORSMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		authHandler := handler.NewAuthHandler()
		userHandler := handler.NewUserHandler()
		ledgerHandler := handler.NewLedgerHandler()
		categoryHandler := handler.NewCategoryHandler()
		tagHandler := handler.NewTagHandler()
		recordHandler := handler.NewRecordHandler()
		llmHandler := handler.NewLLMHandler()
		statsHandler := handler.NewStatsHandler()
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/forgot-password", authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)
			auth.POST("/verify-email", authHandler.VerifyEmail)
			auth.POST("/send-verification", authHandler.SendVerification)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.Auth())
		{
			// Auth routes (protected)
			protected.POST("/auth/logout", authHandler.Logout)

			// User routes
			user := protected.Group("/user")
			{
				user.GET("/profile", userHandler.GetProfile)
				user.PUT("/profile", userHandler.UpdateProfile)
				user.PUT("/password", userHandler.ChangePassword)
			}

			// Ledger routes
			ledgers := protected.Group("/ledgers")
			{
				ledgers.GET("", ledgerHandler.ListLedgers)
				ledgers.POST("", ledgerHandler.CreateLedger)
				ledgers.GET("/current", ledgerHandler.GetCurrentLedger)
				ledgers.PUT("/current", ledgerHandler.SetCurrentLedger)
				ledgers.PUT("/:id", ledgerHandler.UpdateLedger)
				ledgers.DELETE("/:id", ledgerHandler.DeleteLedger)
			}

			// Category routes
			categories := protected.Group("/categories")
			{
				categories.GET("", categoryHandler.ListCategories)
				categories.POST("", categoryHandler.CreateCategory)
				categories.PUT("/:id", categoryHandler.UpdateCategory)
				categories.DELETE("/:id", categoryHandler.DeleteCategory)
			}

			// Tag routes
			tags := protected.Group("/tags")
			{
				tags.GET("", tagHandler.ListTags)
				tags.POST("", tagHandler.CreateTag)
				tags.PUT("/:id", tagHandler.UpdateTag)
				tags.DELETE("/:id", tagHandler.DeleteTag)
			}

			// Record routes
			records := protected.Group("/records")
			{
				records.GET("", recordHandler.ListRecords)
				records.GET("/:id", recordHandler.GetRecord)
				records.POST("", recordHandler.CreateRecord)
				records.PUT("/:id", recordHandler.UpdateRecord)
				records.DELETE("/:id", recordHandler.DeleteRecord)
			}

			// Stats routes
			stats := protected.Group("/stats")
			{
				stats.GET("/summary", statsHandler.GetSummary)
				stats.GET("/daily", statsHandler.GetDailyStats)
				stats.GET("/by-category", statsHandler.GetCategoryStats)
				stats.GET("/monthly", statsHandler.GetMonthlyStats)
				stats.GET("/by-tag", statsHandler.GetTagStats)
				stats.GET("/monthly-detail", statsHandler.GetMonthlyDetail)
			}

			// LLM routes
			llm := protected.Group("/llm")
			{
				llm.GET("/categories", llmHandler.GetCategories)
				llm.POST("/parse", llmHandler.ParseNaturalLanguage)
				llm.POST("/records", llmHandler.ConfirmRecord)
			}
		}
	}

	// Start server
	addr := fmt.Sprintf(":%s", config.AppConfig.Port)
	log.Printf("Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
