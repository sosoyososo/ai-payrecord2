# Fix Web App Correctly Use LLM Analysis Results - Tasks

## Feature Overview

**Feature**: Fix the frontend to correctly apply LLM parsing results to the record form
**Spec**: `docs/superpowers/specs/2026-03-23-fix-llm-analysis-usage-design.md`
**Plan**: `docs/superpowers/plans/2026-03-23-fix-llm-analysis-usage.md`

**User Stories**:
- [US1] Frontend correctly applies all LLM parsing results to the record form

**Tech Stack**: React, TypeScript, shadcn/ui

---

## Phase 1: Implementation

### [US1] Fix LLM Analysis Results Usage

**Goal**: Update `AddRecordPage.tsx` to correctly apply LLM parsing results including category matching, tag selection, date format conversion, and new category creation.

**Independent Test Criteria**: User can input natural language like "花费100元买咖啡" and all parsed fields (amount, type, date, category, tags) are correctly populated in the form.

- [x] T001 [US1] Add date conversion helper function in `frontend/src/pages/AddRecordPage.tsx`

```typescript
// Add after imports (around line 10):
const convertToDateTimeLocal = (isoString: string): string => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}
```

- [x] T002 [US1] Add `LLMCategorySuggestion` interface and state variables in `frontend/src/pages/AddRecordPage.tsx`

```typescript
// Add interface above component:
interface LLMCategorySuggestion {
  name: string
  icon: string
  color: string
  type: number
  confidence: number
}

// Add state after existing state (around line 31):
const [newCategoryName, setNewCategoryName] = useState<string | null>(null)
const [suggestedCategories, setSuggestedCategories] = useState<LLMCategorySuggestion[]>([])
```

- [x] T003 [US1] Replace `handleAiParse` with complete implementation in `frontend/src/pages/AddRecordPage.tsx`

```typescript
const handleAiParse = async () => {
  if (!aiInput.trim()) return
  setAiLoading(true)
  try {
    const response = await llmApi.parse(aiInput)
    const data = response.data.data

    if (data.amount) setAmount(data.amount.toString())
    if (data.type) setType(data.type as 1 | 2)
    if (data.date) setDate(convertToDateTimeLocal(data.date))
    if (data.note) setNote(data.note)

    if (data.category_id && data.category_id > 0) {
      setCategoryId(data.category_id)
      setNewCategoryName(null)
    } else if (data.category_name) {
      const matched = categories.find(c => c.name === data.category_name)
      if (matched) {
        setCategoryId(matched.id)
        setNewCategoryName(null)
      } else {
        setNewCategoryName(data.category_name)
        setCategoryId(0)
      }
    }

    if (data.tags && data.tags.length > 0) {
      const matchedTagIds = tags
        .filter(t => data.tags.includes(t.name))
        .map(t => t.id)
      setTagIds(matchedTagIds)
    }

    if (data.suggested_categories && data.suggested_categories.length > 0) {
      setSuggestedCategories(data.suggested_categories)
    }

    setAiInput('')
  } catch (error) {
    console.error('AI parse failed:', error)
  } finally {
    setAiLoading(false)
  }
}
```

- [x] T004 [US1] Add `handleAiInputChange` function in `frontend/src/pages/AddRecordPage.tsx`

```typescript
const handleAiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setAiInput(e.target.value)
  if (newCategoryName) setNewCategoryName(null)
  if (suggestedCategories.length > 0) setSuggestedCategories([])
}
```

- [x] T005 [US1] Add new category creation UI in `frontend/src/pages/AddRecordPage.tsx`

```tsx
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
              type: type,
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
      <Button size="sm" variant="ghost" onClick={() => setNewCategoryName(null)}>
        Cancel
      </Button>
    </div>
  </div>
)}
```

- [x] T006 [US1] Add suggested categories UI in `frontend/src/pages/AddRecordPage.tsx`

```tsx
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
            const existing = categories.find(c => c.name === suggestion.name)
            if (existing) {
              setCategoryId(existing.id)
              setSuggestedCategories([])
            } else {
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

- [x] T007 [US1] Update Input onChange to use `handleAiInputChange` in `frontend/src/pages/AddRecordPage.tsx`

Find the AI Input section and change:
```tsx
onChange={(e) => setAiInput(e.target.value)}
```
to:
```tsx
onChange={handleAiInputChange}
```

- [x] T008 [US1] Verify build compiles successfully

Run: `cd frontend && npm run build 2>&1 | head -80`
Expected: Successful build with no TypeScript errors

---

## Phase 2: Testing

### [US1] Manual Testing

- [ ] T009 [US1] Test basic LLM parse with category match

1. Start dev server: `cd frontend && npm run dev`
2. Navigate to Add Record page
3. Enter "花费100元买咖啡" in AI input
4. Press Enter or click Sparkles icon
5. Verify: amount=100, type=expense, date populated, category auto-selected if "餐饮" exists

- [ ] T010 [US1] Test new category creation when no match

1. Enter "花费50元买书" (assuming no "书" category exists)
2. Verify: amount=50, no category selected, "Create new category" UI appears
3. Click Create, verify category is created and selected

- [ ] T011 [US1] Test tag matching

1. Clear and enter "花费30元买咖啡必须" (with tag)
2. Verify: tag "必须" is pre-selected if it exists in system

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 11 |
| Implementation Tasks | 8 |
| Testing Tasks | 3 |
| User Stories | 1 |
| Files to Modify | 1 (`frontend/src/pages/AddRecordPage.tsx`) |

**Dependencies**: None - all tasks are sequential within the single file

**MVP Scope**: Tasks T001-T008 (implementation) + T009 (basic test)
