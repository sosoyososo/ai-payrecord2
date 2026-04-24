# HomePage 分页加载实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 HomePage 添加"加载更多"按钮，支持分页追加加载记录

**Architecture:** 利用后端已实现的 page/page_size 分页，前端在 HomePage 添加分页状态和加载更多功能。切换账本时重置分页。

**Tech Stack:** React hooks (useState), existing recordApi, Button component

---

### Task 1: 添加分页相关 State

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx:17-29`

- [ ] **Step 1: 添加 state**

在现有的 `const [loading, setLoading] = useState(true)` (line 26) 后面添加分页状态：

```tsx
const [currentPage, setCurrentPage] = useState(1)
const [hasMore, setHasMore] = useState(true)
const [loadingMore, setLoadingMore] = useState(false)
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: add pagination state for HomePage records"
```

---

### Task 2: 修改 loadData 函数支持分页

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx:64-89`

- [ ] **Step 1: 修改 loadData 函数**

将 `const loadData = async (targetLedgerId?: number) => {` 改为：

```tsx
const loadData = async (targetLedgerId?: number, page: number = 1) => {
  try {
    const [ledgersRes, currentRes] = await Promise.all([
      ledgerApi.list(),
      ledgerApi.getCurrent(),
    ])
    const currentLedgerId = targetLedgerId ?? currentRes.data.data?.id
    const [recordsRes, summaryRes] = await Promise.all([
      recordApi.list({ ledger_id: currentLedgerId, page: page, page_size: 20 }),
      statsApi.getSummary(new Date().getFullYear(), currentLedgerId),
    ])

    setLedgers(ledgersRes.data.data || [])
    setCurrentLedger(currentRes.data.data || null)

    const recordsData = recordsRes.data.data
    const newRecords = recordsData?.data || []

    if (page === 1) {
      setRecords(newRecords)
      setFilteredRecords(searchQuery ? filterRecords(newRecords, searchQuery) : newRecords)
    } else {
      setRecords(prev => [...prev, ...newRecords])
      setFilteredRecords(prev => searchQuery ? filterRecords([...prev, ...newRecords], searchQuery) : [...prev, ...newRecords])
    }

    setCurrentPage(page)
    const total = recordsData?.total || 0
    setHasMore(recordsData?.data?.length > 0 && (page * 20) < total)

    setSummary(summaryRes.data.data || null)
    setLoading(false)
    setLoadingMore(false)
  } catch (error) {
    console.error('Failed to load data:', error)
    setLoading(false)
    setLoadingMore(false)
  }
}
```

- [ ] **Step 2: 添加 filterRecords 辅助函数**

在 `loadData` 函数之前添加：

```tsx
const filterRecords = (recs: Record[], query: string) => {
  const q = query.toLowerCase()
  return recs.filter(
    (r) =>
      r.note?.toLowerCase().includes(q) ||
      r.category?.name.toLowerCase().includes(q) ||
      r.tags?.some((t) => t.name.toLowerCase().includes(q))
  )
}
```

- [ ] **Step 3: 更新 searchQuery useEffect 使用 filterRecords**

将 `useEffect` (lines 49-62) 中的内联 filter 逻辑改为调用 filterRecords：

```tsx
useEffect(() => {
  if (searchQuery.trim()) {
    setFilteredRecords(filterRecords(records, searchQuery))
  } else {
    setFilteredRecords(records)
  }
}, [searchQuery, records])
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: update loadData to support pagination"
```

---

### Task 3: 添加 loadMore 函数

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 添加 loadMore 函数**

在 `switchLedger` 函数之后添加：

```tsx
const loadMore = () => {
  if (!loadingMore && hasMore) {
    setLoadingMore(true)
    loadData(currentLedger?.id, currentPage + 1)
  }
}
```

- [ ] **Step 2: 修改 switchLedger 重置分页**

将 `switchLedger` 中的 `loadData(ledgerId)` 改为 `loadData(ledgerId, 1)`：

```tsx
const switchLedger = async (ledgerId: number) => {
  await ledgerApi.setCurrent(ledgerId)
  const newLedger = ledgers.find(l => l.id === ledgerId)
  setCurrentLedger(newLedger || null)
  setCurrentPage(1)
  setHasMore(true)
  loadData(ledgerId, 1)
}
```

- [ ] **Step 3: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: add loadMore function for pagination"
```

---

### Task 4: 添加"加载更多"按钮 UI

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx:268-274`

- [ ] **Step 1: 在记录列表底部添加加载更多按钮**

在 `{!loading && filteredRecords.length === 0 && (` 之前添加：

```tsx
{!loading && filteredRecords.length > 0 && hasMore && (
  <div className="flex justify-center py-4">
    <Button
      variant="outline"
      onClick={loadMore}
      disabled={loadingMore}
      className="w-full"
    >
      {loadingMore ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          加载中...
        </span>
      ) : (
        '加载更多'
      )}
    </Button>
  </div>
)}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: add Load More button to HomePage"
```

---

### Task 5: 测试分页功能

**Files:**
- 修改: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 启动开发服务器**

```bash
cd frontend && npm run dev
```

- [ ] **Step 2: 在浏览器验证**

1. 打开 http://localhost:5173
2. 登录后查看首页，记录应该只显示约 20 条
3. 滚动到底部，点击"加载更多"
4. 确认记录追加而非替换
5. 切换账本，确认分页重置

- [ ] **Step 3: 验证完成**
