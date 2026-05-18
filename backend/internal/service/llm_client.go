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
	if err := db.Where("user_id = ? AND status = 1", userID).Order("name").Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// GetUserTags returns user tags for prompt building
func (c *LLMClient) GetUserTags(userID uint) ([]model.Tag, error) {
	db := database.GetDB()
	var tags []model.Tag
	if err := db.Where("user_id = ? AND status = 1", userID).Order("name").Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}

// ParseWithLLM uses DeepSeek to parse natural language into structured record
func (c *LLMClient) ParseWithLLM(userID uint, text string) (*LLMParsedRecord, error) {
	// Get user categories for context
	categories, err := c.GetUserCategories(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get categories: %w", err)
	}

	// Build tag context for the prompt
	var tagContext strings.Builder
	tagContext.WriteString("用户已有的分类:\n")
	for _, cat := range categories {
		tagContext.WriteString(fmt.Sprintf("- ID:%d %s\n", cat.ID, cat.Name))
	}

	tagContext.WriteString("\n用户已有的标签:\n")
	tags, _ := c.GetUserTags(userID)
	for _, t := range tags {
		tagContext.WriteString(fmt.Sprintf("- ID:%d %s\n", t.ID, t.Name))
	}

	// Build date context
	now := time.Now()
	dateStr := now.Format("2006-01-02")
	weekdayStr := now.Weekday().String()

	// Build the prompt
	systemPrompt := fmt.Sprintf(`你是一个记账助手。用户会输入自然语言描述一笔支出，你需要提取结构化信息。

## 当前日期
当前日期: %s (%s)

%s

## 提取规则

### 金额
- 提取金额数字，支持"X块Y毛Z分"格式
- 例：136块3毛6 → 136.36，50块 → 50，15.5元 → 15.5

### 分类
- 优先匹配用户已有分类（按名称匹配）
- 若没有匹配的分类，设置 category_id 为 0，用 category_name 记录建议的分类名
- 建议分类尽可能基于输入内容推断

### 日期和时间
- 如果输入中提到具体时间（下午3点、14:30、晚上8点半等），提取到 date 字段
- 支持相对日期：今天、昨天、前天、X天前、上周X、下周一等
- 如果没有提及日期，使用当前日期
- 如果没有提及时间，使用 00:00:00
- 日期格式：YYYY-MM-DDTHH:mm:ss+08:00

### 标签
- 标签是有意义的实体词：商家名（永辉、星巴克）、地点（机场、北京）、用途（报销、礼物）、品类（书籍、日用品）等
- 优先使用已有标签（根据上面"用户已有的标签"列表匹配）
- 如果提取的标签不在已有列表中，同时放入 tags 和 new_tags 数组
- 不要重复分类名作为标签
- 不要包含金额、数字
- 如果无法提取有意义的标签，返回空数组

### 备注
- 保留完整语义，去除金额数字即可
- 不要残留金额碎片（如"块"、"元"等孤立的单位）

## 输出格式
只返回 JSON，不要包含其他文字：
{
  "amount": 金额数字,
  "category_id": 分类ID(0表示新分类),
  "category_name": "分类名称",
  "date": "ISO8601完整日期时间",
  "note": "备注文字",
  "tags": ["标签1", "标签2"],
  "new_tags": ["新标签1", "新标签2"],
  "new_category_name": "新分类名(仅在category_id=0时填写)"
}

## 示例
用户输入: "昨天下午3点吃饭花了50块，记得报销"
{
  "amount": 50,
  "category_id": 1,
  "category_name": "餐饮",
  "date": "%sT15:00:00+08:00",
  "note": "吃饭",
  "tags": ["报销"],
  "new_category_name": ""
}

用户输入: "3天前在京东买书花了99块"
{
  "amount": 99,
  "category_id": 7,
  "category_name": "教育",
  "date": "%sT00:00:00+08:00",
  "note": "京东买书",
  "tags": ["京东", "书籍"],
  "new_category_name": ""
}

用户输入: "永辉买了些日用品，花了136块3毛6"
{
  "amount": 136.36,
  "category_id": 0,
  "category_name": "日用",
  "date": "%sT00:00:00+08:00",
  "note": "永辉买了些日用品",
  "tags": ["永辉", "日用品"],
  "new_tags": ["永辉", "日用品"],
  "new_category_name": "日用"
}`,
		dateStr, weekdayStr, tagContext.String(),
		now.AddDate(0, 0, -1).Format("2006-01-02"),
		now.AddDate(0, 0, -3).Format("2006-01-02"),
		dateStr)

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
		result.Date = now
	}

	return &result, nil
}

// CorrectSpeech uses LLM to correct homophone errors in ASR output.
// Pure language task -- no user business data required.
func (c *LLMClient) CorrectSpeech(rawText string) (string, error) {
	if !c.IsConfigured() {
		return rawText, nil // graceful degradation: return original text
	}

	systemPrompt := `你是一个语音识别纠错助手。用户的输入来自语音识别（ASR），可能包含同音字错误、口音导致的错误识别。
请纠正这些错误，输出纠正后的文本。只返回纠正后的文本，不要添加任何解释。
如果文本已经正确，原样返回。`

	messages := []chatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: rawText},
	}

	response, err := c.CallChatAPI(messages)
	if err != nil {
		return rawText, nil // graceful degradation: return original text on error
	}

	corrected := strings.TrimSpace(response)
	if corrected == "" {
		return rawText, nil
	}

	return corrected, nil
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
// e.g., "2026-05-08" -> "2026-05-08T00:00:00+08:00"
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
	replacement := fmt.Sprintf(`"date": "%sT00:00:00+08:00"`, dateMatched)
	return strings.Replace(jsonStr, `"date": "`+dateMatched+`"`, replacement, 1)
}
