# HomePage SWR Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Stale-While-Revalidate caching for HomePage so state persists across navigation and data updates silently without flashing loading skeletons.

**Architecture:** ES module-level cache provides cross-unmount persistence. HomePage mount checks cache: if valid, restores state instantly (no loading flicker) then optionally triggers silent background refresh if stale. AddRecordPage/EditRecordPage invalidate cache after save. HomePage header gains a manual refresh button.

**Tech Stack:** React + TypeScript + React Router + HeaderContext

---

### Task 1: Create cache store module

**Files:**
- Create: `frontend/src/stores/homeCache.ts`

- [ ] **Step 1: Create `homeCache.ts` with cache interface and implementation**

```typescript
import type { Record, Ledger, SummaryStats } from '@/types'

export interface HomeCacheData {
  records: Record[]
  filteredRecords: Record[]
  ledgers: Ledger[]
  currentLedger: Ledger | null
  summary: SummaryStats | null
  searchQuery: string
  currentPage: number
  hasMore: boolean
}

let cache: HomeCacheData | null = null
let stale = false

export function getCache(): HomeCacheData | null {
  return cache
}

export function setCache(data: HomeCacheData): void {
  cache = data
  stale = false
}

export function invalidate(): void {
  stale = true
}

export function isStale(): boolean {
  return stale
}

export function isValid(): boolean {
  return cache !== null
}

export function clear(): void {
  cache = null
  stale = false
}
```

- [ ] **Step 2: Verify the file is created correctly**

Run: `ls -la frontend/src/stores/homeCache.ts`
Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/homeCache.ts
git commit -m "feat: add HomePage SWR cache module"
```

---

### Task 2: Add headerRight prop to PageContainer

**Files:**
- Modify: `frontend/src/components/PageContainer.tsx`

The refresh button goes in the top nav bar. PageContainer already controls header config via HeaderContext. Add a `headerRight` prop that passes through as `customRight`.

- [ ] **Step 1: Add `headerRight` to PageContainer props and pass to HeaderContext**

Current interface at line 6-11:
```typescript
interface PageContainerProps {
  title?: string
  showBackButton?: boolean
  fab?: { to: string }
  children: React.ReactNode
}
```

Change to:
```typescript
interface PageContainerProps {
  title?: string
  showBackButton?: boolean
  fab?: { to: string }
  headerRight?: React.ReactNode
  children: React.ReactNode
}
```

Current useEffect at line 21-27:
```typescript
useEffect(() => {
  setConfig({
    title,
    showBackButton,
  })
  return () => setConfig({})
}, [title, showBackButton, setConfig])
```

Change to:
```typescript
useEffect(() => {
  setConfig({
    title,
    showBackButton,
    customRight: headerRight,
  })
  return () => setConfig({})
}, [title, showBackButton, headerRight, setConfig])
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/PageContainer.tsx
git commit -m "feat: add headerRight prop to PageContainer"
```

---

### Task 3: Modify HomePage with SWR mount, silent refresh, and manual refresh button

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: Add imports**

After existing lucide-react import (line 14), add `RefreshCw`:

```typescript
import { TrendingDown, Search, X, Pencil, Trash2, RefreshCw } from 'lucide-react'
```

After existing type imports (line 12), add homeCache import:

```typescript
import type { Record, Ledger, SummaryStats } from '@/types'
import { homeCache } from '@/stores/homeCache'  // ADD
```

- [ ] **Step 2: Add refreshing state and handleRefresh function**

After the `deleteDialogOpen` state (line 29), add:

```typescript
const [refreshing, setRefreshing] = useState(false)

const handleRefresh = async () => {
  setRefreshing(true)
  homeCache.clear()
  await loadData()
  setRefreshing(false)
}
```

- [ ] **Step 3: Replace mount useEffect with SWR-aware version**

Replace the existing useEffect at lines 47-49:

```typescript
useEffect(() => {
  loadData()
}, [])
```

With:

```typescript
useEffect(() => {
  const cached = homeCache.getCache()
  if (cached) {
    // Restore state instantly — no loading skeleton
    setRecords(cached.records)
    setFilteredRecords(cached.filteredRecords)
    setLedgers(cached.ledgers)
    setCurrentLedger(cached.currentLedger)
    setSummary(cached.summary)
    setSearchQuery(cached.searchQuery)
    setCurrentPage(cached.currentPage)
    setHasMore(cached.hasMore)
    setLoading(false)
    // If data may be stale, silently refresh in background
    if (homeCache.isStale()) {
      loadData()
    }
  } else {
    loadData() // First visit — normal loading
  }
}, [])
```

- [ ] **Step 4: Modify loadData to save to cache after successful load**

In the `loadData` function, after `setHasMore(...)` and `setSummary(...)` and `setLoading(false)` (around line 97-99), add cache saving:

```typescript
// Cache successful loads
if (page === 1) {
  homeCache.setCache({
    records: recordsData?.data || [],
    filteredRecords: searchQuery
      ? filterRecords(recordsData?.data || [], searchQuery)
      : (recordsData?.data || []),
    ledgers: ledgersRes.data.data || [],
    currentLedger: currentRes.data.data || null,
    summary: summaryRes.data.data || null,
    searchQuery,
    currentPage: 1,
    hasMore: !!((recordsData?.data?.length ?? 0) > 0 && (page * 100) < total),
  })
}
```

Place this right before the `setLoading(false)` call inside the try block.

- [ ] **Step 5: Update confirmDelete to update cache after delete**

Replace the existing `confirmDelete` (lines 37-45):

```typescript
const confirmDelete = async () => {
  if (!pendingDeleteId) return
  const id = pendingDeleteId
  setPendingDeleteId(null)
  setDeleteDialogOpen(false)
  try {
    await recordApi.delete(id)
    await loadData()    // loadData already saves to cache (Task 3 Step 4)
  } catch (error) {
    console.error('Failed to delete record:', error)
  }
}
```

- [ ] **Step 6: Add refresh button via headerRight prop on PageContainer**

Find the PageContainer JSX at line 135:

```tsx
<PageContainer title={currentLedger?.name || t('nav.ledgers')} fab={{ to: '/add' }}>
```

Change to:

```tsx
<PageContainer
  title={currentLedger?.name || t('nav.ledgers')}
  fab={{ to: '/add' }}
  headerRight={
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="p-1 rounded-md hover:bg-accent transition-colors"
    >
      <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
    </button>
  }
>
```

- [ ] **Step 7: Verify build**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: no TypeScript errors

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: implement SWR cache for HomePage with silent refresh and manual refresh button"
```

---

### Task 4: Modify AddRecordPage to invalidate cache and use navigate

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx`

- [ ] **Step 1: Add imports**

Add `useNavigate` after existing react-router-dom import (line 2):

```typescript
import { useNavigate } from 'react-router-dom'  // already present? No — AddRecordPage currently uses window.location.href, not useNavigate
```

Actually, verify imports — if `useNavigate` is not imported, add it. Add `homeCache` after the other imports:

```typescript
import { Sparkles, Loader2 } from 'lucide-react'
import { homeCache } from '@/stores/homeCache'  // ADD
```

- [ ] **Step 2: Add navigate hook**

After `const { t } = useTranslation()` (line 40), add:

```typescript
const navigate = useNavigate()
```

- [ ] **Step 3: Replace window.location.href with invalidate + navigate**

In `handleSubmit` (line 157), replace:

```typescript
window.location.href = '/'
```

With:

```typescript
homeCache.invalidate()
navigate('/')
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/AddRecordPage.tsx
git commit -m "feat: invalidate HomePage cache after adding record"
```

---

### Task 5: Modify EditRecordPage to invalidate cache and use navigate

**Files:**
- Modify: `frontend/src/pages/EditRecordPage.tsx`

- [ ] **Step 1: Add imports**

Add `homeCache` import:

```typescript
import { homeCache } from '@/stores/homeCache'  // ADD
```

Add `useNavigate` if not already imported. Verify: EditRecordPage uses `window.location.href` on line 81, so `useNavigate` needs to be added.

```typescript
import { useParams, useNavigate } from 'react-router-dom'  // ADD useNavigate
```

- [ ] **Step 2: Add navigate hook**

After `const recordId = parseInt(id || '0', 10)` (line 12), add:

```typescript
const navigate = useNavigate()
```

- [ ] **Step 3: Replace window.location.href with invalidate + navigate**

In `handleSubmit` (line 81), replace:

```typescript
window.location.href = '/'
```

With:

```typescript
homeCache.invalidate()
navigate('/')
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -30`
Expected: no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/EditRecordPage.tsx
git commit -m "feat: invalidate HomePage cache after editing record"
```

---

## Verification

- [ ] **Start dev server and verify:**

```bash
cd frontend && npm run dev
```

1. Visit HomePage → records load normally with skeleton
2. Navigate to Stats → press Home tab → back to HomePage, no skeleton flash, data appears instantly
3. Add a record → save → returned to HomePage, new record appears silently
4. Edit a record → save → returned to HomePage, edited changes visible
5. Delete a record → list updates without full refresh
6. Press refresh button in header → button spins, data reloads
