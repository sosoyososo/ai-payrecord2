# LLM 标签新建标识 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable LLM to identify new tags (not in user's existing list) and provide frontend UI to create them.

**Architecture:** Backend injects existing tags into prompt + adds `NewTags` response field; frontend adds pill-button UI to create new tags on click.

**Tech Stack:** Go, DeepSeek API, React/TypeScript, shadcn/ui

---

### Task 1: Backend — prompt tag injection + NewTags field

**Files:**
- Modify: `backend/internal/service/llm_client.go` — add `GetUserTags`, inject tags into prompt
- Modify: `backend/internal/service/llm.go:24-33` — add `NewTags []string` to `LLMParsedRecord`

- [ ] **Step 1: Add GetUserTags method to llm_client.go**

Insert after `GetUserCategories` (after line 114):

```go
// GetUserTags returns user tags for prompt building
func (c *LLMClient) GetUserTags(userID uint) ([]model.Tag, error) {
	db := database.GetDB()
	var tags []model.Tag
	if err := db.Where("user_id = ? AND status = 1", userID).Order("name").Find(&tags).Error; err != nil {
		return nil, err
	}
	return tags, nil
}
```

- [ ] **Step 2: In ParseWithLLM, fetch tags and build tag context**

After the categoryContext block (after line 129), add:

```go
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
```

Also update the existing `categoryContext` block above this — replace the stand-alone `categoryContext` building with this combined `tagContext` builder that includes both categories and tags.

- [ ] **Step 3: Update prompt tag rules and output format**

In the systemPrompt template string (lines 162-166), replace the tag section with:

```
### 标签
- 标签是有意义的实体词：商家名（永辉、星巴克）、地点（机场、北京）、用途（报销、礼物）、品类（书籍、日用品）等
- 优先使用已有标签（根据上面"用户已有的标签"列表匹配）
- 如果提取的标签不在已有列表中，同时放入 tags 和 new_tags 数组
- 不要重复分类名作为标签
- 不要包含金额、数字
- 如果无法提取有意义的标签，返回空数组
```

In the output format JSON section (line 180-181), update:

```json
  "tags": ["标签1", "标签2"],
  "new_tags": ["新标签1", "新标签2"],
  "new_category_name": "新分类名(仅在category_id=0时填写)"
```

- [ ] **Step 4: Update third few-shot example (永辉日用品) to include new_tags**

Change the third example JSON (lines 207-215) to:

```json
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
}
```

- [ ] **Step 5: Update tagContext variable usage in Sprintf**

Change the Sprintf call at line 217 from:
```go
dateStr, weekdayStr, categoryContext.String(),
```
to:
```go
dateStr, weekdayStr, tagContext.String(),
```

- [ ] **Step 6: Add NewTags field to LLMParsedRecord in llm.go**

In `backend/internal/service/llm.go`, add `NewTags` field to `LLMParsedRecord` struct (after `Tags` field, around line 30):

```go
type LLMParsedRecord struct {
	Amount              float64                `json:"amount"`
	CategoryID          uint                   `json:"category_id,omitempty"`
	CategoryName        string                 `json:"category_name,omitempty"`
	Date                time.Time              `json:"date"`
	Note                string                 `json:"note"`
	Tags                []string               `json:"tags"`
	NewTags             []string               `json:"new_tags,omitempty"`
	SuggestedCategories []LLMCategorySuggestion `json:"suggested_categories,omitempty"`
	NewCategoryName     string                 `json:"new_category_name,omitempty"`
}
```

- [ ] **Step 7: Build and verify compilation**

```bash
cd /Users/karsa/proj/ai-payrecord2/backend && go build ./...
```

Expected: no errors

- [ ] **Step 8: Restart backend and test**

```bash
# Kill old backend
lsof -ti:8080 | xargs kill -9 2>/dev/null; sleep 1

# Start backend
cd /Users/karsa/proj/ai-payrecord2/backend && go run ./cmd/server/ &
sleep 4

# Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['access_token'])")

# Test: input with new tag
echo "=== Test: 永辉日用品136块3毛6 ==="
curl -s -X POST http://localhost:8080/api/v1/llm/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"永辉买了些日用品，花了136块3毛6"}' | python3 -m json.tool
```

Expected: response includes both `tags` and `new_tags` arrays

- [ ] **Step 9: Commit**

```bash
git add backend/internal/service/llm_client.go backend/internal/service/llm.go
git commit -m "feat: inject existing tags into LLM prompt and add new_tags field

- Add GetUserTags to fetch user's existing tags
- Inject tag list with IDs into DeepSeek prompt for priority matching
- Update prompt rules: new tags go into new_tags array
- Update example 3 to show new_tags output
- Add NewTags field to LLMParsedRecord struct

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Frontend — handle new_tags + create tag UI

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx`

- [ ] **Step 1: Read current file to confirm state**

```bash
cat frontend/src/pages/AddRecordPage.tsx
```

- [ ] **Step 2: Add newTags state variable**

After line 45 (`const [suggestedCategories, setSuggestedCategories]`), add:

```typescript
const [newTags, setNewTags] = useState<string[]>([])
```

- [ ] **Step 3: Update handleAiParse to process new_tags**

In `handleAiParse`, after the existing tag matching block (around line 98-103), add:

```typescript
      // 处理新建标签
      if (data.new_tags && data.new_tags.length > 0) {
        setNewTags(data.new_tags)
      }
```

- [ ] **Step 4: Update handleAiInputChange to clear newTags**

In `handleAiInputChange` (around line 117-121), add to the existing clearing logic:

```typescript
  const handleAiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiInput(e.target.value)
    if (newCategoryName) setNewCategoryName(null)
    if (suggestedCategories.length > 0) setSuggestedCategories([])
    if (newTags.length > 0) setNewTags([])
  }
```

- [ ] **Step 5: Add "New tags" pill UI section**

After the suggested categories section (before `{/* Form */}` comment, around line 255), add:

```tsx
        {/* New Tags */}
        {newTags.length > 0 && (
          <div className="mt-3 p-3 bg-primary/5 rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">New tags:</div>
            <div className="flex flex-wrap gap-2">
              {newTags.map((tagName) => (
                <button
                  key={tagName}
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await tagApi.create({ name: tagName })
                      const newTag = res.data.data
                      setTags(prev => [...prev, newTag])
                      setTagIds(prev => [...prev, newTag.id])
                      setNewTags(prev => prev.filter(t => t !== tagName))
                    } catch (error) {
                      console.error('Failed to create tag:', error)
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border border-input bg-background hover:bg-accent transition-colors"
                >
                  <span>+</span>
                  <span>{tagName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
```

- [ ] **Step 6: Build frontend and verify compilation**

```bash
cd /Users/karsa/proj/ai-payrecord2/frontend && npm run build 2>&1
```

Expected: build succeeds, no TypeScript errors

- [ ] **Step 7: Sync to iOS and run in simulator**

```bash
cd /Users/karsa/proj/ai-payrecord2/frontend && npx cap sync ios && npx cap run ios --target "9089CB1B-25C2-4D56-AB5A-BB65DAFBF434"
```

This step uses `/ui-ux-pro-max` and `/frontend-design` skills for UI refinement.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/AddRecordPage.tsx
git commit -m "feat: handle new_tags in frontend with create-tag pill UI

- Add newTags state for tracking new tags from LLM parsing
- Parse data.new_tags from AI parse response
- Add clickable pill UI to create and select new tags
- Clear newTags on input change

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
