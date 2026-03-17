package service

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/karsa/ai-payrecord2/backend/internal/model"
	"github.com/karsa/ai-payrecord2/backend/pkg/database"
)

type ParseNaturalLanguageRequest struct {
	Text string `json:"text" binding:"required"`
}

type LLMCategorySuggestion struct {
	Name     string  `json:"name"`
	Icon     string  `json:"icon"`
	Color    string  `json:"color"`
	Type     int     `json:"type"`
	Confidence float64 `json:"confidence"`
}

type LLMParsedRecord struct {
	Amount      float64              `json:"amount"`
	CategoryID  uint                 `json:"category_id,omitempty"`
	CategoryName string              `json:"category_name,omitempty"`
	Type        model.RecordType     `json:"type"`
	Date        time.Time            `json:"date"`
	Note        string               `json:"note"`
	Tags        []string             `json:"tags"`
	SuggestedCategories []LLMCategorySuggestion `json:"suggested_categories,omitempty"`
	NewCategoryName string            `json:"new_category_name,omitempty"`
}

type LLMStructuredRecord struct {
	Amount         float64   `json:"amount"`
	CategoryID     uint      `json:"category_id"`
	Type           model.RecordType `json:"type"`
	Date           time.Time `json:"date"`
	Note           string    `json:"note"`
	TagIDs         []uint    `json:"tag_ids"`
	NewCategoryName string   `json:"new_category_name,omitempty"`
}

type LLMService struct{}

func NewLLMService() *LLMService {
	return &LLMService{}
}

// Simple rule-based parser for natural language
// In production, this would call OpenAI/Anthropic APIs
func (s *LLMService) ParseNaturalLanguage(userID uint, text string) (*LLMParsedRecord, error) {
	result := &LLMParsedRecord{
		Date: time.Now(),
		Tags: []string{},
		Type: model.RecordTypeExpense, // Default to expense
	}

	// Extract amount
	amount := s.extractAmount(text)
	if amount <= 0 {
		return nil, nil // Could not parse amount
	}
	result.Amount = amount

	// Remove amount from text for category matching
	textWithoutAmount := s.removeAmount(text)

	// Match category based on keywords
	categoryID, categoryName, newCategory := s.matchCategory(userID, textWithoutAmount)
	if categoryID > 0 {
		result.CategoryID = categoryID
		result.CategoryName = categoryName
	} else if newCategory != "" {
		result.NewCategoryName = newCategory
		// Provide suggestions
		result.SuggestedCategories = s.suggestCategories(textWithoutAmount)
	}

	// Extract date from text
	if date := s.extractDate(text); date != nil {
		result.Date = *date
	}

	// Extract note (remaining text after amount and category)
	result.Note = s.extractNote(textWithoutAmount, categoryName)

	// Match tags
	result.Tags = s.extractTags(textWithoutAmount)

	// Determine type based on category or keywords
	if s.isIncome(textWithoutAmount) {
		result.Type = model.RecordTypeIncome
	}

	return result, nil
}

func (s *LLMService) extractAmount(text string) float64 {
	// Match patterns like: 100元, 100块钱, $100, 100.50, 消费100
	patterns := []string{
		`(\d+\.?\d*)\s*元`,
		`(\d+\.?\d*)\s*块钱`,
		`(\d+\.?\d*)\s*块`,
		`消费\s*(\d+\.?\d*)`,
		`花了\s*(\d+\.?\d*)`,
		`收入\s*(\d+\.?\d*)`,
		`(\d+\.?\d*)\s*美元`,
		`\$\s*(\d+\.?\d*)`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(text)
		if len(matches) > 1 {
			var amount float64
			if _, err := fmt.Sscanf(matches[1], "%f", &amount); err == nil && amount > 0 {
				return amount
			}
		}
	}

	return 0
}

func (s *LLMService) removeAmount(text string) string {
	re := regexp.MustCompile(`(\d+\.?\d*)\s*(元|块钱|块|美元)|\$\s*(\d+\.?\d*)|消费\s*(\d+\.?\d*)|花了\s*(\d+\.?\d*)|收入\s*(\d+\.?\d*)`)
	return re.ReplaceAllString(text, "")
}

func (s *LLMService) matchCategory(userID uint, text string) (uint, string, string) {
	db := database.GetDB()
	text = strings.ToLower(text)

	// Get user categories
	var categories []model.Category
	db.Where("user_id = ? AND status = 1", userID).Find(&categories)

	// Keyword to category mapping
	keywords := map[string][]string{
		"餐饮": {"吃饭", "餐饮", "午餐", "晚餐", "早餐", "外卖", "饭店", "餐厅", "美食", "奶茶", "咖啡", "点心"},
		"交通": {"交通", "打车", "出租车", "地铁", "公交", "公交车", "加油", "停车", "打车", "滴滴", "骑车", "自行车"},
		"购物": {"购物", "买东西", "网购", "淘宝", "京东", "快递", "超市", "商场", "衣服", "鞋子", "包"},
		"娱乐": {"娱乐", "电影", "KTV", "唱歌", "游戏", "上网", "旅游", "健身", "运动", "游泳", "羽毛球"},
		"住房": {"住房", "房租", "水电", "物业", "燃气", "宽带", "电话", "房租"},
		"医疗": {"医疗", "医院", "药店", "看病", "买药", "体检", "医保"},
		"教育": {"教育", "学费", "培训", "书", "课程", "学习", "考试"},
		"通讯": {"通讯", "手机", "话费", "流量", "宽带"},
		"工资": {"工资", "月薪", "薪资", "薪水"},
		"奖金": {"奖金", "年终奖", "分红", "提成"},
		"投资": {"投资", "理财", "股票", "基金", "利息"},
	}

	for _, cat := range categories {
		catKeywords, ok := keywords[cat.Name]
		if !ok {
			continue
		}
		for _, kw := range catKeywords {
			if strings.Contains(text, kw) {
				return cat.ID, cat.Name, ""
			}
		}
	}

	// Check if any category was mentioned directly
	for _, cat := range categories {
		if strings.Contains(text, cat.Name) {
			return cat.ID, cat.Name, ""
		}
	}

	return 0, "", ""
}

func (s *LLMService) suggestCategories(text string) []LLMCategorySuggestion {
	// Provide suggestions based on common expense categories
	return []LLMCategorySuggestion{
		{Name: "餐饮", Icon: "restaurant", Color: "#FF5722", Type: 2, Confidence: 0.8},
		{Name: "交通", Icon: "directions_car", Color: "#2196F3", Type: 2, Confidence: 0.7},
		{Name: "购物", Icon: "shopping_bag", Color: "#E91E63", Type: 2, Confidence: 0.6},
		{Name: "娱乐", Icon: "movie", Color: "#9C27B0", Type: 2, Confidence: 0.5},
	}
}

func (s *LLMService) extractDate(text string) *time.Time {
	now := time.Now()

	patterns := []struct {
		pattern string
		offset  func(time.Time) time.Time
	}{
		{"今天", func(t time.Time) time.Time { return t }},
		{"昨天", func(t time.Time) time.Time { return t.AddDate(0, 0, -1) }},
		{"前天", func(t time.Time) time.Time { return t.AddDate(0, 0, -2) }},
		{"明天", func(t time.Time) time.Time { return t.AddDate(0, 0, 1) }},
	}

	for _, p := range patterns {
		if strings.Contains(text, p.pattern) {
			t := p.offset(now)
			return &t
		}
	}

	return nil
}

func (s *LLMService) extractNote(text, categoryName string) string {
	// Remove common patterns and return remaining as note
	text = strings.ToLower(text)
	text = strings.ReplaceAll(text, categoryName, "")
	text = strings.ReplaceAll(text, "今天", "")
	text = strings.ReplaceAll(text, "昨天", "")
	text = strings.ReplaceAll(text, "明天", "")
	text = strings.TrimSpace(text)
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")

	if len(text) > 100 {
		text = text[:100]
	}

	return text
}

func (s *LLMService) extractTags(text string) []string {
	tags := []string{}
	text = strings.ToLower(text)

	tagKeywords := map[string]string{
		"必须": "必须",
		"可选": "可选",
		"紧急": "紧急",
		"待办": "待办",
		"常规": "常规",
	}

	for tag, kw := range tagKeywords {
		if strings.Contains(text, kw) {
			tags = append(tags, tag)
		}
	}

	return tags
}

func (s *LLMService) isIncome(text string) bool {
	text = strings.ToLower(text)
	incomeKeywords := []string{"收入", "工资", "奖金", "分红", "利息", "赚钱", "到账"}

	for _, kw := range incomeKeywords {
		if strings.Contains(text, kw) {
			return true
		}
	}

	return false
}

// GetCategories returns available categories for the user
func (s *LLMService) GetCategories(userID uint) ([]model.Category, error) {
	db := database.GetDB()
	var categories []model.Category
	if err := db.Where("user_id = ? AND status = 1", userID).Order("type, name").Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// ConfirmRecord creates a record after LLM parsing confirmation
func (s *LLMService) ConfirmRecord(userID uint, req *LLMStructuredRecord) (*model.Record, error) {
	recordService := NewRecordService()

	createReq := &CreateRecordRequest{
		LedgerID: 0, // Will use default
		CategoryID: req.CategoryID,
		Amount:     req.Amount,
		Type:       req.Type,
		Date:       req.Date,
		Note:       req.Note,
		Source:     "llm",
		TagIDs:     req.TagIDs,
	}

	// Get default ledger
	ledgerService := NewLedgerService()
	ledger, err := ledgerService.GetDefault(userID)
	if err != nil {
		return nil, err
	}
	createReq.LedgerID = ledger.ID

	// Create new category if specified
	if req.NewCategoryName != "" {
		catReq := &CreateCategoryRequest{
			Name: req.NewCategoryName,
			Type: model.CategoryType(req.Type),
		}
		categoryService := NewCategoryService()
		newCat, err := categoryService.Create(userID, catReq)
		if err != nil {
			return nil, err
		}
		createReq.CategoryID = newCat.ID
	}

	return recordService.Create(userID, createReq)
}
