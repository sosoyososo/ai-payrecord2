# 导航优化实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复首页 FAB 被底部导航遮挡问题，并为二级页面添加返回导航

**Architecture:** 使用 react-router-dom 的 useNavigate 实现返回功能，调整 FAB 的 bottom 定位值

**Tech Stack:** React, Tailwind CSS, react-router-dom

---

## Task 1: 修复首页 FAB 位置

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 调整 FAB 位置**

找到 FAB 的 className，将 `bottom-6` 改为 `bottom-20`:

```tsx
// 之前
className="fixed bottom-6 right-6 w-14 h-14 ..."

// 之后
className="fixed bottom-20 right-6 w-14 h-14 ..."
```

- [ ] **Step 2: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无错误

---

## Task 2: 为 AddRecordPage 添加返回导航

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx`

- [ ] **Step 1: 添加 useNavigate 导入**

在文件顶部添加：
```tsx
import { useNavigate } from 'react-router-dom'
```

- [ ] **Step 2: 在组件中添加 navigate**

```tsx
export default function AddRecordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // ... rest of code
```

- [ ] **Step 3: 添加返回按钮到页面顶部**

在 `<div className="min-h-screen...` 之后、第一个子元素之前添加：

```tsx
{/* 返回按钮 */}
<div className="sticky top-0 z-10 bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 pb-2">
  <div className="max-w-md mx-auto px-4 py-3 flex items-center">
    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
      <ArrowLeft className="h-5 w-5" />
    </Button>
    <span className="font-semibold text-lg ml-2">{t('addRecord.title')}</span>
  </div>
</div>
```

- [ ] **Step 4: 添加 ArrowLeft 导入**

```tsx
import { ArrowLeft, Check, Sparkles, Loader2 } from 'lucide-react'
```

---

## Task 3: 为 StatsPage 添加返回导航

**Files:**
- Modify: `frontend/src/pages/StatsPage.tsx`

- [ ] **Step 1: 添加 useNavigate 和 ArrowLeft**

- [ ] **Step 2: 添加返回按钮**

---

## Task 4: 为 BudgetPage 添加返回导航

**Files:**
- Modify: `frontend/src/pages/BudgetPage.tsx`

- [ ] **Step 1: 添加 useNavigate 和 ArrowLeft**

- [ ] **Step 2: 添加返回按钮**

---

## Task 5: 为 SettingsPage 添加返回导航

**Files:**
- Modify: `frontend/src/pages/SettingsPage.tsx`

- [ ] **Step 1: 添加 ArrowLeft 导入**

- [ ] **Step 2: 使用已有的 navigate 或添加 useNavigate**

- [ ] **Step 3: 添加返回按钮**

---

## Task 6: 为 LedgerPage 添加返回导航

**Files:**
- Modify: `frontend/src/pages/LedgerPage.tsx`

- [ ] **Step 1: 添加 useNavigate 和 ArrowLeft**

- [ ] **Step 2: 添加返回按钮**

---

## Task 7: 为 CategoryPage 添加返回导航

**Files:**
- Modify: `frontend/src/pages/CategoryPage.tsx`

- [ ] **Step 1: 添加 useNavigate 和 ArrowLeft**

- [ ] **Step 2: 添加返回按钮**

---

## Task 8: 为 TagPage 添加返回导航

**Files:**
- Modify: `frontend/src/pages/TagPage.tsx`

- [ ] **Step 1: 添加 useNavigate 和 ArrowLeft**

- [ ] **Step 2: 添加返回按钮**

---

## Task 9: 为 ExportPage 添加返回导航

**Files:**
- Modify: `frontend/src/pages/ExportPage.tsx`

- [ ] **Step 1: 添加 useNavigate 和 ArrowLeft**

- [ ] **Step 2: 添加返回按钮**

---

## Task 10: 构建验证

- [ ] **Step 1: 运行构建**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 2: 提交代码**

```bash
git add frontend/src/pages/*.tsx
git commit -m "fix: 修复 FAB 位置并添加二级页面返回导航"
```

---

## 验收标准

1. 首页 FAB 可见且不被底部导航遮挡
2. 所有二级页面顶部有返回按钮
3. 点击返回按钮可正常返回上一页
4. PC 端布局不受影响
5. 构建通过
