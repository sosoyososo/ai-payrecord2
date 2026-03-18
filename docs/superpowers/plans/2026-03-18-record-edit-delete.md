# 记录编辑和删除功能实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为账本记录添加编辑和删除功能

**Architecture:** 在首页添加操作按钮，创建编辑页面复用添加页面逻辑

**Tech Stack:** React + TypeScript + Tailwind + shadcn/ui

---

## 文件结构

- `frontend/src/pages/HomePage.tsx` - 添加编辑/删除按钮
- `frontend/src/pages/EditRecordPage.tsx` - 新建编辑页面（复用 AddRecordPage）
- `frontend/src/App.tsx` - 添加编辑页面路由
- `frontend/src/services/api.ts` - 已完成 ✅

---

## Chunk 1: 首页添加操作按钮

### Task 1: HomePage 添加编辑和删除按钮

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 添加必要的导入**

在 `HomePage.tsx` 顶部添加 Pencil 和 Trash2 图标导入：

```tsx
import { Plus, TrendingUp, TrendingDown, Search, X, Wallet, Pencil, Trash2 } from 'lucide-react'
```

- [ ] **Step 2: 添加 useNavigate 导入**

```tsx
import { Link, useNavigate } from 'react-router-dom'
```

- [ ] **Step 3: 添加 navigate hook**

在 HomePage 函数组件中添加：

```tsx
const navigate = useNavigate()
```

- [ ] **Step 4: 修改记录卡片布局**

找到记录卡片渲染部分（约 line 245-285），当前结构：

```tsx
<Card key={record.id} className="card-hover cursor-pointer scale-enter">
  <CardContent className="p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      {/* 分类图标和信息 */}
    </div>
    <div className={`font-semibold amount-animate ${...}`}>
      {formatAmount(record.amount, record.type)}
    </div>
  </CardContent>
</Card>
```

修改为：

```tsx
<Card key={record.id} className="card-hover cursor-pointer scale-enter">
  <CardContent className="p-4 flex items-center justify-between">
    <div className="flex items-center gap-3 flex-1">
      {/* 分类图标和信息 - 添加点击编辑 */}
      <div onClick={() => navigate(`/edit/${record.id}`)} className="flex-1">
        {/* ... 现有内容 ... */}
      </div>
    </div>
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(`/edit/${record.id}`)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(record.id)}
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 5: 添加删除处理函数**

在 `loadData` 函数后添加：

```tsx
const handleDelete = async (id: number) => {
  if (!confirm(t('confirm.deleteRecord') || '确定删除这条记录吗？')) return
  try {
    await recordApi.delete(id)
    loadData()
  } catch (error) {
    console.error('Failed to delete record:', error)
  }
}
```

- [ ] **Step 6: 验证构建**

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESS

---

## Chunk 2: 创建编辑页面

### Task 2: 创建 EditRecordPage

**Files:**
- Create: `frontend/src/pages/EditRecordPage.tsx`

- [ ] **Step 1: 复制 AddRecordPage 作为基础**

复制 `frontend/src/pages/AddRecordPage.tsx` 到 `frontend/src/pages/EditRecordPage.tsx`

- [ ] **Step 2: 修改页面元信息**

修改文件头部的页面标题：

```tsx
// 将:
<span className="font-semibold text-lg">{t('addRecord.title')}</span>

// 改为:
<span className="font-semibold text-lg">{t('editRecord.title') || '编辑记录'}</span>
```

- [ ] **Step 3: 获取记录 ID**

在组件中添加 useParams：

```tsx
import { useParams } from 'react-router-dom'

// 在组件内:
const { id } = useParams<{ id: string }>()
const recordId = parseInt(id || '0', 10)
```

- [ ] **Step 4: 修改 loadData 加载记录**

修改 `loadData` 函数：

```tsx
const loadData = async () => {
  try {
    const [currentRes, categoriesRes, recordRes] = await Promise.all([
      ledgerApi.getCurrent(),
      categoryApi.list(),
      recordApi.get(recordId),  // 新增：加载记录详情
    ])

    setCurrentLedger(currentRes.data.data)
    setCategories(categoriesRes.data.data)

    // 填充表单数据
    if (recordRes.data.data) {
      const record = recordRes.data.data
      setAmount(record.amount.toString())
      setType(record.type as 1 | 2)
      setCategoryId(record.category_id)
      setDate(new Date(record.date).toISOString().slice(0, 16))
      setNote(record.note || '')
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 5: 修改 handleSubmit 为更新逻辑**

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!amount || !categoryId || !currentLedger) return

  const dateTime = new Date(date).toISOString()

  setSaving(true)
  try {
    await recordApi.update(recordId, {
      ledger_id: currentLedger.id,
      category_id: categoryId,
      amount: parseFloat(amount),
      type,
      date: dateTime,
      note: note || undefined,
    })
    window.location.href = '/'
  } catch (error) {
    console.error('Failed to update record:', error)
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 6: 添加 useEffect 依赖**

```tsx
useEffect(() => {
  loadData()
}, [id])  // 添加 id 依赖
```

---

## Chunk 3: 添加路由

### Task 3: 添加编辑页面路由

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 添加 EditRecordPage 导入**

在文件顶部添加：

```tsx
import EditRecordPage from './pages/EditRecordPage'
```

- [ ] **Step 2: 添加路由**

在 `/add` 路由后添加：

```tsx
<Route
  path="/edit/:id"
  element={
    <ProtectedRoute>
      <EditRecordPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: 验证构建**

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESS

---

## 验证清单

完成所有任务后，验证：

- [ ] 首页每条记录右侧显示编辑和删除按钮
- [ ] 点击编辑按钮跳转到编辑页面
- [ ] 编辑页面可以修改所有字段并保存
- [ ] 点击删除按钮弹出确认对话框
- [ ] 确认删除后记录被删除并刷新列表
- [ ] 构建通过

---

## 依赖关系

- Task 1 → Task 2 → Task 3 (顺序执行)
- 每个 Chunk 内部步骤顺序执行
