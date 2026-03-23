# Fix Web App Correctly Use LLM Analysis Results

## Problem Statement

The LLM integration for natural language parsing exists but the frontend doesn't correctly use the analysis results. When users input natural language like "花费100元买咖啡", the LLM returns structured data but the frontend ignores most of it.

## Current Issues

1. **Category not set from LLM**: `handleAiParse` never sets `categoryId` from `category_id` or `category_name`
2. **Tags ignored**: LLM returns tags array but frontend doesn't populate `tagIds`
3. **Date format mismatch**: Backend returns ISO8601 (`2024-01-15T10:30:00Z`), frontend `datetime-local` expects `YYYY-MM-DDTHH:mm`
4. **New category UX missing**: When LLM returns `category_id=0` with `new_category_name`, no UI to create it
5. **Suggested categories not shown**: `suggested_categories` from LLM is completely ignored

## Design

### 1. Fix Date Format Handling

**Problem**: ISO8601 datetime strings don't work with HTML `datetime-local` inputs.

**Solution**: When applying LLM results to form state, convert datetime:
```typescript
// Convert ISO8601 to datetime-local format (YYYY-MM-DDTHH:mm)
const convertToDateTimeLocal = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toISOString().slice(0, 16) // "2024-01-15T10:30"
}
```

### 2. Apply All LLM Fields to Form

**Solution**: Update `handleAiParse` to set all relevant fields:

```typescript
const handleAiParse = async () => {
  // ... existing code ...
  const data = response.data.data

  // Amount, type, date, note (existing)
  if (data.amount) setAmount(data.amount.toString())
  if (data.type) setType(data.type as 1 | 2)
  if (data.date) setDate(convertToDateTimeLocal(data.date))
  if (data.note) setNote(data.note)

  // NEW: Category handling
  if (data.category_id && data.category_id > 0) {
    setCategoryId(data.category_id)
  } else if (data.category_name) {
    // Try to match by name
    const matched = categories.find(c => c.name === data.category_name)
    if (matched) {
      setCategoryId(matched.id)
    } else {
      // No match - show new category suggestion
      setNewCategoryName(data.category_name)
    }
  }

  // NEW: Tags handling
  if (data.tags && data.tags.length > 0) {
    const matchedTagIds = tags
      .filter(t => data.tags.includes(t.name))
      .map(t => t.id)
    setTagIds(matchedTagIds)
  }
}
```

### 3. Add New Category Suggestion UI

**Solution**: Add state and UI to handle when LLM suggests a new category:

```typescript
const [newCategoryName, setNewCategoryName] = useState<string | null>(null)

// In handleAiParse, when category_id is 0 but category_name exists:
// setNewCategoryName(data.category_name)

// Add to RecordForm or inline in AddRecordPage:
{newCategoryName && (
  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
    <span>Create new category: "{newCategoryName}"?</span>
    <Button size="sm" onClick={handleCreateNewCategory}>Create</Button>
    <Button size="sm" variant="ghost" onClick={() => setNewCategoryName(null)}>Cancel</Button>
  </div>
)}
```

### 4. Show Suggested Categories

**Solution**: Display `suggested_categories` as clickable category options when no exact match:

```typescript
// In handleAiParse when no category matched:
if (data.suggested_categories && data.suggested_categories.length > 0) {
  setSuggestedCategories(data.suggested_categories)
}
```

### 5. Backend Enhancement: Return Suggested Categories Always

**Enhancement**: When LLM can't match category, return `suggested_categories` with confidence scores:

Already implemented in `llm.go` via `LLMParsedRecord.SuggestedCategories`.

## Implementation Plan

### Frontend Changes (AddRecordPage.tsx)

1. Add `convertToDateTimeLocal` helper function
2. Update `handleAiParse` to set category, tags, and handle date format
3. Add `newCategoryName` state for new category suggestions
4. Add `suggestedCategories` state for category alternatives
5. Add UI for creating new category or selecting suggested one
6. Add `handleCreateNewCategory` function using `categoryApi.create`

### Backend Changes

No backend changes required - the API already returns all needed fields.

## Files to Modify

- `frontend/src/pages/AddRecordPage.tsx` - Main changes

## Testing

1. Input "花费100元买咖啡" - category should be auto-selected if "餐饮" exists
2. Input "花费100元买书" when no "书" category - should show option to create
3. Input with tags - tags should be pre-selected
4. Date should populate correctly from LLM result
