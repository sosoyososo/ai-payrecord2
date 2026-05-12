# LLM Prompt 优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix LLM date hallucination and improve time/tag extraction by optimizing the DeepSeek prompt.

**Architecture:** Single-file change in `llm_client.go` — replace the hardcoded system prompt string with a dynamically constructed prompt that injects current date, category context, extraction rules, and few-shot examples.

**Tech Stack:** Go, DeepSeek API, time.Time, strings.Builder

---

### Task 1: Update ParseWithLLM prompt

**Files:**
- Modify: `backend/internal/service/llm_client.go:116-183`

- [ ] **Step 1: Read current file to confirm state**

```bash
cat backend/internal/service/llm_client.go | head -185 | tail -70
```

- [ ] **Step 2: Replace the prompt building block** (lines 124-148)

Replace the prompt section at lines 131-148 with a structured prompt that includes current date, extraction rules, and few-shot examples.

Old code (lines 131-148):
```go
	// Build the prompt
	systemPrompt := `你是一个记账助手。用户会输入自然语言描述消费，你需要提取结构化信息。

` + categoryContext.String() + `

请根据用户输入和已有分类，提取结构化信息。如果用户提到的分类不在已有分类中，请设置 category_id 为 0，并用 category_name 记录用户提到的分类名。

只返回JSON格式，不要包含其他文字。格式如下：
{
  "amount": 金额数字,
  "category_id": 分类ID数字,
  "category_name": "分类名称",
  "date": "日期YYYY-MM-DD格式",
  "note": "备注文字",
  "tags": ["标签数组"],
  "suggested_categories": [],
  "new_category_name": "如果提到新分类则填写，否则为空"
}`
```

Should use `time.Now()` to compute current date and weekday. Replace:

```go
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
  "new_category_name": "日用"
}`,
		dateStr, weekdayStr, categoryContext.String(),
		now.AddDate(0, 0, -1).Format("2006-01-02"),
		now.AddDate(0, 0, -3).Format("2006-01-02"),
		dateStr)
```

- [ ] **Step 3: Remove `fmt` from the function — already imported, confirm imports**

The `fmt` package is already imported in the file (`"fmt"` at line 6), so no import changes needed.

- [ ] **Step 4: Build and verify compilation**

```bash
cd /Users/karsa/proj/ai-payrecord2/backend && go build ./...
```

Expected: no errors

- [ ] **Step 5: Restart backend and test**

```bash
# Kill old backend
lsof -ti:8080 | xargs kill -9 2>/dev/null; sleep 1

# Start new backend
cd /Users/karsa/proj/ai-payrecord2/backend && go run ./cmd/server/ &
sleep 3

# Test 1: X块Y毛Z分 + 新分类建议
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456"}' \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)
tok=d['data']['access_token']
print(tok)
" > /tmp/token.txt

TOKEN=$(cat /tmp/token.txt)

echo "=== Test 1: 永辉日用品136块3毛6 ==="
curl -s -X POST http://localhost:8080/api/v1/llm/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"永辉买了些日用品，花了136块3毛6"}' | python3 -m json.tool

echo ""
echo "=== Test 2: 昨天下午3点吃饭 ==="
curl -s -X POST http://localhost:8080/api/v1/llm/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"昨天下午3点吃饭花了50块，记得报销"}' | python3 -m json.tool

echo ""
echo "=== Test 3: 3天前京东买书 ==="
curl -s -X POST http://localhost:8080/api/v1/llm/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"3天前在京东买书花了99块"}' | python3 -m json.tool
```

Expected results:
- Test 1: amount=136.36, category_name="日用"/"日用品", tags includes "永辉" and "日用品", date=today
- Test 2: amount=50, category_id=1 (餐饮), date contains yesterday's date and 15:00 time, tags=["报销"]
- Test 3: amount=99, category_id=7 (教育), date contains 3-days-ago date, tags includes "京东" and "书籍"

- [ ] **Step 6: Update test case doc**

Check and update `docs/superpowers/test-cases/api-test-cases.md` for LLM-related test cases.

```bash
cat docs/superpowers/test-cases/api-test-cases.md | grep -A 10 "LLM\|llm"
```

If LLM test cases exist, update their expected results. If not, add a new section for TC-API-LLM-001 through 003.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/service/llm_client.go docs/superpowers/plans/2026-05-08-llm-prompt-optimization.md
git commit -m "feat: optimize LLM prompt for date/time and tag extraction

- Inject current date context so LLM computes correct relative dates
- Add time extraction rules (下午3点, 14:30, etc.)
- Define tags as meaningful entity extraction
- Add 3 few-shot examples covering key scenarios
- Fix date hallucination where LLM returned 2023 dates

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
