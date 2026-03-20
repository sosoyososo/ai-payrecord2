package service

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/crypto"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

var (
	ErrTokenNotFound = errors.New("token not found")
	ErrTokenExpired  = errors.New("token has expired")
	ErrTokenUsed     = errors.New("token has already been used")
	ErrTokenInvalid  = errors.New("invalid token")
	ErrTokenMismatch = errors.New("token does not match")
	ErrInvalidKey    = errors.New("encryption key not configured")
)

const (
	TokenTypePasswordReset     = "password_reset"
	TokenTypeEmailVerification = "email_verification"
)

type TokenService struct {
	encryptionKey []byte
}

func NewTokenService(encryptionKey string) (*TokenService, error) {
	if encryptionKey == "" {
		return nil, ErrInvalidKey
	}
	key, err := crypto.ParseHexKey(encryptionKey)
	if err != nil {
		return nil, err
	}
	return &TokenService{encryptionKey: key}, nil
}

func (s *TokenService) GenerateCode() (string, error) {
	code, err := rand.Int(rand.Reader, big.NewInt(100000000))
	if err != nil {
		return "", fmt.Errorf("failed to generate code: %w", err)
	}
	return fmt.Sprintf("%08d", code.Int64()), nil
}

func (s *TokenService) GenerateAndStore(userID uint, tokenType string, expiry time.Duration) (*model.VerificationToken, error) {
	code, err := s.GenerateCode()
	if err != nil {
		return nil, err
	}

	encryptedCode, err := crypto.Encrypt(code, s.encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt code: %w", err)
	}

	token := &model.VerificationToken{
		UserID:    userID,
		Type:      tokenType,
		Code:      encryptedCode,
		ExpiresAt: time.Now().Add(expiry),
		Used:      false,
	}

	db := database.GetDB()
	if err := db.Create(token).Error; err != nil {
		return nil, fmt.Errorf("failed to store token: %w", err)
	}

	// Return with unencrypted code for sending
	token.Code = code
	return token, nil
}

func (s *TokenService) Validate(userID uint, tokenType, code string) (*model.VerificationToken, error) {
	db := database.GetDB()

	var tokens []model.VerificationToken
	if err := db.Where("user_id = ? AND type = ? AND used = false", userID, tokenType).
		Order("created_at DESC").
		Find(&tokens).Error; err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}

	if len(tokens) == 0 {
		return nil, ErrTokenNotFound
	}

	// Find the latest unused token and verify
	for _, token := range tokens {
		if time.Now().After(token.ExpiresAt) {
			continue // Skip expired
		}

		decrypted, err := crypto.Decrypt(token.Code, s.encryptionKey)
		if err != nil {
			continue
		}

		if decrypted == code {
			return &token, nil
		}
	}

	return nil, ErrTokenInvalid
}

func (s *TokenService) MarkUsed(tokenID uint) error {
	db := database.GetDB()
	return db.Model(&model.VerificationToken{}).Where("id = ?", tokenID).Update("used", true).Error
}

func (s *TokenService) CleanupExpired() (int64, error) {
	db := database.GetDB()
	result := db.Where("expires_at < ? AND used = false", time.Now()).Delete(&model.VerificationToken{})
	return result.RowsAffected, result.Error
}
