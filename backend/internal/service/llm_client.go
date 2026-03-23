package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/karsa/ai-payrecord2/backend/internal/config"
	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

type LLMClient struct {
	apiKey string
	apiURL string
	model  string
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

func NewLLMClient() *LLMClient {
	cfg := config.AppConfig
	if cfg == nil {
		return nil
	}
	return &LLMClient{
		apiKey: cfg.DeepSeekAPIKey,
		apiURL: cfg.DeepSeekAPIUrl,
		model:  cfg.DeepSeekModel,
	}
}

func (c *LLMClient) IsConfigured() bool {
	return c != nil && c.apiKey != ""
}

func (c *LLMClient) CallChatAPI(messages []chatMessage) (string, error) {
	if !c.IsConfigured() {
		return "", fmt.Errorf("LLM client not configured")
	}

	reqBody := chatRequest{
		Model:    c.model,
		Messages: messages,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call API: %w", err)
	}
	defer resp.Body.Close()

	var chatResp chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if chatResp.Error != nil {
		return "", fmt.Errorf("API error: %s", chatResp.Error.Message)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no response from API")
	}

	return chatResp.Choices[0].Message.Content, nil
}

// GetUserCategories returns user categories for prompt building
func (c *LLMClient) GetUserCategories(userID uint) ([]model.Category, error) {
	db := database.GetDB()
	var categories []model.Category
	if err := db.Where("user_id = ? AND status = 1", userID).Order("type, name").Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// ParseWithLLM uses DeepSeek to parse natural language into structured record
func (c *LLMClient) ParseWithLLM(userID uint, text string) (*LLMParsedRecord, error) {
	// Get user categories for context
	categories, err := c.GetUserCategories(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get categories: %w", err)
	}

	// Build category context for the prompt
	var categoryContext strings.Builder
	categoryContext.WriteString("用户已有的分类:\n")
	for _, cat := range categories {
		typeStr := "支出"
		if cat.Type == 2 {
			typeStr = "收入"
		}
		categoryContext.WriteString(fmt.Sprintf("- ID:%d %s(%s)\n", cat.ID, cat.Name, typeStr))
	}

	// Build the prompt
	systemPrompt := `你是一个记账助手。用户会输入自然语言描述消费或收入，你需要提取结构化信息。

` + categoryContext.String() + `

请根据用户输入和已有分类，提取结构化信息。如果用户提到的分类不在已有分类中，请设置 category_id 为 0，并用 category_name 记录用户提到的分类名。

只返回JSON格式，不要包含其他文字。格式如下：
{
  "amount": 金额数字,
  "type": 1或2 (1=支出, 2=收入),
  "category_id": 分类ID数字,
  "category_name": "分类名称",
  "date": "日期YYYY-MM-DD格式",
  "note": "备注文字",
  "tags": ["标签数组"],
  "suggested_categories": [],
  "new_category_name": "如果提到新分类则填写，否则为空"
}`

	userMessage := fmt.Sprintf(`用户输入: "%s"`, text)

	messages := []chatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userMessage},
	}

	response, err := c.CallChatAPI(messages)
	if err != nil {
		return nil, err
	}

	// Parse the JSON response
	// Try to extract JSON from the response (in case of extra text)
	jsonStr := extractJSON(response)
	if jsonStr == "" {
		return nil, fmt.Errorf("failed to extract JSON from response")
	}

	// Fix date format: ensure date-only strings have time component
	jsonStr = fixDateFormat(jsonStr)

	var result LLMParsedRecord
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Set default date to today if not provided
	if result.Date.IsZero() {
		result.Date = time.Now()
	}

	return &result, nil
}

// extractJSON tries to find and extract JSON from a string
func extractJSON(s string) string {
	// Find the first { and last }
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start == -1 || end == -1 || start >= end {
		// Try to find array
		start = strings.Index(s, "[")
		end = strings.LastIndex(s, "]")
		if start == -1 || end == -1 || start >= end {
			return ""
		}
		return s[start : end+1]
	}
	return s[start : end+1]
}

// fixDateFormat ensures date-only strings are converted to full ISO8601 format
// e.g., "2023-10-27" -> "2023-10-27T00:00:00Z"
func fixDateFormat(jsonStr string) string {
	// Match date-only patterns and add time component
	re := regexp.MustCompile(`"date"\s*:\s*"(\d{4}-\d{2}-\d{2})"`)
	matches := re.FindStringSubmatchIndex(jsonStr)
	if matches == nil {
		return jsonStr
	}

	// Extract the matched date to check if it already has time
	// matches[2] = start of capture, matches[3] = end of capture (exclusive)
	dateMatched := jsonStr[matches[2]:matches[3]]

	// If the matched string contains 'T', it already has time component
	if strings.Contains(dateMatched, "T") {
		return jsonStr
	}

	// Replace with full datetime format
	replacement := fmt.Sprintf(`"date": "%sT00:00:00Z"`, dateMatched)
	return strings.Replace(jsonStr, `"date": "`+dateMatched+`"`, replacement, 1)
}
