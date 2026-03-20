package service

import (
	"fmt"
	"log"
	"time"

	"github.com/karsa/ai-payrecord2/backend/internal/config"
	"github.com/karsa/ai-payrecord2/backend/pkg/brevo"
)

type EmailService struct {
	client   *brevo.Client
	tokenSvc *TokenService
}

func NewEmailService(tokenSvc *TokenService) *EmailService {
	client := brevo.NewClient(
		config.AppConfig.BrevoAPIKey,
		config.AppConfig.BrevoSenderEmail,
		config.AppConfig.BrevoSenderName,
	)
	return &EmailService{
		client:   client,
		tokenSvc: tokenSvc,
	}
}

func (s *EmailService) SendPasswordResetEmail(userID uint, userEmail, userName string) (string, error) {
	token, err := s.tokenSvc.GenerateAndStore(userID, TokenTypePasswordReset, 15*time.Minute)
	if err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}

	subject := "Password Reset Code"
	body := fmt.Sprintf(`You have requested a password reset for your account.

Your verification code is: %s

This code will expire in 15 minutes.

If you did not request this, please ignore this email.`, token.Code)

	if err := s.client.SendEmail(userEmail, userName, subject, body); err != nil {
		log.Printf("Failed to send password reset email to %s: %v", userEmail, err)
		return "", fmt.Errorf("failed to send email")
	}

	return token.Code, nil
}

func (s *EmailService) SendEmailVerification(userID uint, userEmail, userName string) (string, error) {
	token, err := s.tokenSvc.GenerateAndStore(userID, TokenTypeEmailVerification, 24*time.Hour)
	if err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}

	subject := "Email Verification"
	body := fmt.Sprintf(`Welcome! Please verify your email address.

Your verification code is: %s

This code will expire in 24 hours.

If you did not create an account, please ignore this email.`, token.Code)

	if err := s.client.SendEmail(userEmail, userName, subject, body); err != nil {
		log.Printf("Failed to send verification email to %s: %v", userEmail, err)
		return "", fmt.Errorf("failed to send email")
	}

	return token.Code, nil
}

func (s *EmailService) SendLoginAlert(userEmail, userName, loginTime, location, device string) error {
	subject := "New Device Login Alert"
	body := fmt.Sprintf(`We noticed a new sign-in to your account.

Time: %s
Location: %s
Device: %s

If this was you, you can ignore this email.
If this wasn't you, please secure your account immediately.`, loginTime, location, device)

	if err := s.client.SendEmail(userEmail, userName, subject, body); err != nil {
		log.Printf("Failed to send login alert email to %s: %v", userEmail, err)
		return fmt.Errorf("failed to send email")
	}

	return nil
}
