package brevo

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	apiKey      string
	senderEmail string
	senderName  string
	client      *http.Client
}

type EmailRequest struct {
	Sender    Sender       `json:"sender"`
	To        []Recipient `json:"to"`
	Subject   string      `json:"subject"`
	TextContent string     `json:"textContent"`
}

type Sender struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

type Recipient struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

func NewClient(apiKey, senderEmail, senderName string) *Client {
	return &Client{
		apiKey:      apiKey,
		senderEmail: senderEmail,
		senderName:  senderName,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Client) SendEmail(toEmail, toName, subject, text string) error {
	req := EmailRequest{
		Sender: Sender{
			Email: c.senderEmail,
			Name:  c.senderName,
		},
		To: []Recipient{
			{Email: toEmail, Name: toName},
		},
		Subject:    subject,
		TextContent: text,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", "https://api.brevo.com/v3/smtp/email", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("api-key", c.apiKey)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("brevo API error: status %d", resp.StatusCode)
	}

	return nil
}
