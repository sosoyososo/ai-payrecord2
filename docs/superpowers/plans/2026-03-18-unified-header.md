# 统一顶部标题栏实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为每个页面添加统一顶部标题栏，二级页面显示返回按钮，修复 FAB 和保存按钮被遮挡问题

**Architecture:** 在每个页面添加顶部标题栏组件，使用 react-router-dom 的 useNavigate 实现返回功能

**Tech Stack:** React, Tailwind CSS, react-router-dom

---

## Task 1: 首页标题栏 (HomePage)

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 添加顶部标题栏**

在页面最外层 div 之后添加标题栏：
```tsx
{/* 顶部标题栏 */}
<header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
  <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Wallet className="h-6 w-6 text-primary" />
      <span className="font-semibold text-lg">{currentLedger?.name || t('nav.ledgers')}</span>
    </div>
    {/* 设置按钮等 */}
  </div>
</header>
```

- [ ] **Step 2: 调整 FAB 位置到 bottom-24**

```tsx
className="fixed bottom-24 right-6 ..."
```

---

## Task 2: 添加记录页面 (AddRecordPage)

**Files:**
- Modify: `frontend/src/pages/AddRecordPage.tsx`

- [ ] **Step 1: 确保有返回按钮的标题栏**

```tsx
<header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
  <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
      <ArrowLeft className="h-5 w-5" />
    </Button>
    <span className="font-semibold text-lg">{t('addRecord.title')}</span>
  </div>
</header>
```

- [ ] **Step 2: 调整保存按钮位置**

```tsx
className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-md w-full px-4"
```

---

## Task 3: 统计页面 (StatsPage)

**Files:**
- Modify: `frontend/src/pages/StatsPage.tsx`

- [ ] **添加返回按钮标题栏**

---

## Task 4: 预算页面 (BudgetPage)

**Files:**
- Modify: `frontend/src/pages/BudgetPage.tsx`

- [ ] **添加返回按钮标题栏**

---

## Task 5: 设置页面 (SettingsPage)

**Files:**
- Modify: `frontend/src/pages/SettingsPage.tsx`

- [ ] **添加返回按钮标题栏**

---

## Task 6: 账本页面 (LedgerPage)

**Files:**
- Modify: `frontend/src/pages/LedgerPage.tsx`

- [ ] **添加返回按钮标题栏**

---

## Task 7: 分类页面 (CategoryPage)

**Files:**
- Modify: `frontend/src/pages/CategoryPage.tsx`

- [ ] **添加返回按钮标题栏**

---

## Task 8: 标签页面 (TagPage)

**Files:**
- Modify: `frontend/src/pages/TagPage.tsx`

- [ ] **添加返回按钮标题栏**

---

## Task 9: 导出页面 (ExportPage)

**Files:**
- Modify: `frontend/src/pages/ExportPage.tsx`

- [ ] **添加返回按钮标题栏**

---

## Task 10: 构建验证

- [ ] **Step 1: 运行构建**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 2: 提交代码**

```bash
git add frontend/src/pages/*.tsx
git commit -m "fix: 添加统一顶部标题栏，修复FAB和保存按钮被遮挡"
```

---

## 验收标准

1. 每个页面顶部都有标题栏
2. 二级页面标题栏左侧有返回按钮
3. FAB 完整可见 (bottom-24)
4. 底部保存按钮完整可见 (bottom-24)
5. PC 端布局正常
6. 构建通过
