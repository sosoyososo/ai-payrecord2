# Fix Web App Correctly Use LLM Analysis Results

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the frontend to correctly apply LLM parsing results to the record form, including category matching, tag selection, date format conversion, and new category creation.

**Architecture:** Single-file frontend change in `AddRecordPage.tsx`. Add helper functions for date conversion, update `handleAiParse` to apply all LLM fields, and add UI for creating new categories when LLM suggests unrecognized categories.

**Tech Stack:** React, TypeScript, shadcn/ui components

---

## Files to Modify

- `frontend/src/pages/AddRecordPage.tsx` - All changes

---

## Task 1: Add Date Conversion Helper

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx`

- [ ] **Step 1: Add date conversion helper function**

Add after the imports section (around line 10):

```typescript
// Helper to convert ISO8601 datetime to datetime-local format (YYYY-MM-DDTHH:mm)
const convertToDateTimeLocal = (isoString: string): string => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  // Returns format like "2024-01-15T10:30"
  return date.toISOString().slice(0, 16)
}
```

- [ ] **Step 2: Verify function works**

The function is a pure utility, no runtime test needed. Proceed to next task.

---

## Task 2: Update handleAiParse to Apply All LLM Fields

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx:55-70`

- [ ] **Step 1: Replace handleAiParse with complete implementation**

Replace the existing `handleAiParse` function:

```typescript
const handleAiParse = async () => {
  if (!aiInput.trim()) return
  setAiLoading(true)
  try {
    const response = await llmApi.parse(aiInput)
    const data = response.data.data

    // Amount, type, date, note (existing behavior)
    if (data.amount) setAmount(data.amount.toString())
    if (data.type) setType(data.type as 1 | 2)
    if (data.date) setDate(convertToDateTimeLocal(data.date))
    if (data.note) setNote(data.note)

    // Category handling - try to match by ID or name
    if (data.category_id && data.category_id > 0) {
      // Direct match by ID
      setCategoryId(data.category_id)
      setNewCategoryName(null)
    } else if (data.category_name) {
      // Try to match by name
      const matched = categories.find(c => c.name === data.category_name)
      if (matched) {
        setCategoryId(matched.id)
        setNewCategoryName(null)
      } else {
        // No match - suggest creating new category
        setNewCategoryName(data.category_name)
        setCategoryId(0)
      }
    }

    // Tags handling - match by name
    if (data.tags && data.tags.length > 0) {
      const matchedTagIds = tags
        .filter(t => data.tags.includes(t.name))
        .map(t => t.id)
      setTagIds(matchedTagIds)
    }

    // Suggested categories - show when no exact match
    if (data.suggested_categories && data.suggested_categories.length > 0) {
      setSuggestedCategories(data.suggested_categories)
    }

    // Clear AI input after successful parse
    setAiInput('')
  } catch (error) {
    console.error('AI parse failed:', error)
  } finally {
    setAiLoading(false)
  }
}
```

- [ ] **Step 2: Test compilation**

Run: `cd frontend && npm run build 2>&1 | head -50`
Expected: No TypeScript errors related to our changes

---

## Task 3: Add State for Category Suggestions

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx:28-31`

- [ ] **Step 1: Add state for category suggestions**

Add after the existing state declarations (around line 31):

```typescript
const [newCategoryName, setNewCategoryName] = useState<string | null>(null)
const [suggestedCategories, setSuggestedCategories] = useState<LLMCategorySuggestion[]>([])
```

Note: Add this type above the component if not already defined:
```typescript
interface LLMCategorySuggestion {
  name: string
  icon: string
  color: string
  type: number
  confidence: number
}
```

- [ ] **Step 2: Add handleAiInputChange function**

Replace the inline `onChange` with a named function. Find the AI input section and replace:

```typescript
// Replace inline onChange with:
const handleAiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setAiInput(e.target.value)
  // Reset new category suggestion when user changes AI input
  if (newCategoryName) setNewCategoryName(null)
  if (suggestedCategories.length > 0) setSuggestedCategories([])
}
```

Then update the Input's onChange to use this function.

- [ ] **Step 3: Add UI for new category creation**

Find the AI input section (around line 139) and add after the closing `</div>` of the input wrapper, before the `</div>` of the container:

```tsx
{/* New Category Suggestion */}
{newCategoryName && (
  <div className="mt-3 p-3 bg-primary/10 rounded-lg flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-primary" />
      <span className="text-sm">
        Create new category: <strong>"{newCategoryName}"</strong>?
      </span>
    </div>
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          try {
            const res = await categoryApi.create({
              name: newCategoryName,
              type: type, // Match the current form type (1=expense, 2=income)
              icon: 'folder',
              color: '#666',
            })
            const newCat = res.data.data
            setCategories(prev => [...prev, newCat])
            setCategoryId(newCat.id)
            setNewCategoryName(null)
          } catch (error) {
            console.error('Failed to create category:', error)
          }
        }}
      >
        Create
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setNewCategoryName(null)}
      >
        Cancel
      </Button>
    </div>
  </div>
)}
```

- [ ] **Step 4: Add UI for suggested categories**

After the new category suggestion UI, add another section to display suggested categories:

```tsx
{/* Suggested Categories */}
{suggestedCategories.length > 0 && !newCategoryName && (
  <div className="mt-3 p-3 bg-primary/5 rounded-lg">
    <div className="text-sm text-muted-foreground mb-2">Suggested categories:</div>
    <div className="flex flex-wrap gap-2">
      {suggestedCategories.map((suggestion, index) => (
        <Button
          key={index}
          size="sm"
          variant="outline"
          onClick={async () => {
            // Try to find matching category first
            const existing = categories.find(c => c.name === suggestion.name)
            if (existing) {
              setCategoryId(existing.id)
              setSuggestedCategories([])
            } else {
              // Create new category from suggestion
              try {
                const res = await categoryApi.create({
                  name: suggestion.name,
                  type: type,
                  icon: suggestion.icon || 'folder',
                  color: suggestion.color || '#666',
                })
                const newCat = res.data.data
                setCategories(prev => [...prev, newCat])
                setCategoryId(newCat.id)
                setSuggestedCategories([])
              } catch (error) {
                console.error('Failed to create suggested category:', error)
              }
            }
          }}
        >
          {suggestion.name}
        </Button>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run build 2>&1 | head -80`
Expected: Successful build

---

## Task 4: Test the Complete Flow

**Files:**
- No file changes - manual testing

- [ ] **Step 1: Start the dev server**

Run: `cd frontend && npm run dev`
Keep running for subsequent tests.

- [ ] **Step 2: Test basic LLM parse**

1. Navigate to Add Record page
2. Enter "花费100元买咖啡" in AI input
3. Press Enter or click Sparkles icon
4. Verify: amount=100, type=expense, date populated, category might be set if "餐饮" exists

- [ ] **Step 3: Test new category creation**

1. Enter "花费50元买书" (assuming no "书" category exists)
2. Verify: amount=50, no category selected, "Create new category" UI appears
3. Click Create, verify category is created and selected

- [ ] **Step 4: Test tag matching**

1. Clear and enter "花费30元买咖啡必须" (with tag)
2. Verify: tag "必须" is pre-selected if it exists in system

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Line ~10 | Add `convertToDateTimeLocal` helper + `LLMCategorySuggestion` interface |
| Line ~31 | Add `newCategoryName` and `suggestedCategories` state |
| Line ~55-98 | Replace `handleAiParse` with complete implementation including suggested categories |
| Before AI input | Add `handleAiInputChange` function to reset suggestions |
| After AI input | Add new category creation UI + suggested categories display UI |

**No backend changes required.**
