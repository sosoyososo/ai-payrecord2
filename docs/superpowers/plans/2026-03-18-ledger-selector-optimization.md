# 账本切换组件优化实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一并优化账本切换组件，提升用户体验

**Architecture:** 创建独立的 LedgerSelector 组件，使用 shadcn/ui Select

**Tech Stack:** React, Tailwind CSS, shadcn/ui

---

## 文件结构

- `frontend/src/components/ui/select.tsx` - 新建 shadcn/ui Select 组件
- `frontend/src/components/LedgerSelector.tsx` - 新建账本选择器组件
- `frontend/src/pages/HomePage.tsx` - 使用 LedgerSelector
- `frontend/src/pages/StatsPage.tsx` - 使用 LedgerSelector

---

## Chunk 1: 安装 shadcn/ui Select

### Task 1: 安装 Select 组件

**Files:**
- Modify: `frontend/src/components/ui/select.tsx` (新建)
- Modify: `frontend/src/components/ui/index.ts` (新建)

- [ ] **Step 1: 安装 shadcn/ui Select**

Run: `cd frontend && npx shadcn@latest add select`
Expected: 组件安装成功

- [ ] **Step 2: 提交**

```bash
git add frontend/src/components/ui/select.tsx
git commit -m "feat: 安装 shadcn/ui Select 组件"
```

---

## Chunk 2: 创建 LedgerSelector 组件

### Task 2: 创建账本选择器组件

**Files:**
- Create: `frontend/src/components/LedgerSelector.tsx`

- [ ] **Step 1: 创建 LedgerSelector 组件**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Ledger } from "@/types"

interface LedgerSelectorProps {
  ledgers: Ledger[]
  currentLedger: Ledger | null
  onChange: (ledgerId: number) => void
}

export function LedgerSelector({ ledgers, currentLedger, onChange }: LedgerSelectorProps) {
  if (ledgers.length <= 1) return null

  return (
    <Select value={String(currentLedger?.id)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择账本" />
      </SelectTrigger>
      <SelectContent>
        {ledgers.map((ledger) => (
          <SelectItem key={ledger.id} value={String(ledger.id)}>
            {ledger.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/components/LedgerSelector.tsx
git commit -m "feat: 创建 LedgerSelector 组件"
```

---

## Chunk 3: HomePage 使用 LedgerSelector

### Task 3: HomePage 集成账本选择器

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: 导入 LedgerSelector**

在 import 部分添加：
```tsx
import { LedgerSelector } from "@/components/LedgerSelector"
```

- [ ] **Step 2: 替换原生 select**

找到当前的 select 元素：
```tsx
{/* Ledger Selector */}
{ledgers.length > 1 && (
  <div className="max-w-md mx-auto px-4 py-3">
    <select
      value={currentLedger?.id || ''}
      onChange={(e) => switchLedger(Number(e.target.value))}
      className="w-full px-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {ledgers.map((ledger) => (
        <option key={ledger.id} value={ledger.id}>
          {ledger.name}
        </option>
      ))}
    </select>
  </div>
)}
```

替换为：
```tsx
{/* Ledger Selector */}
<div className="max-w-md mx-auto px-4 py-3">
  <LedgerSelector
    ledgers={ledgers}
    currentLedger={currentLedger}
    onChange={switchLedger}
  />
</div>
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "feat: HomePage 使用 LedgerSelector 组件"
```

---

## Chunk 4: StatsPage 使用 LedgerSelector

### Task 4: StatsPage 集成账本选择器

**Files:**
- Modify: `frontend/src/pages/StatsPage.tsx`

- [ ] **Step 1: 导入 LedgerSelector**

在 import 部分添加：
```tsx
import { LedgerSelector } from "@/components/LedgerSelector"
```

- [ ] **Step 2: 替换按钮组**

找到当前的按钮组：
```tsx
{/* Ledger Selector */}
{ledgers.length > 1 && (
  <div className="max-w-md mx-auto px-4 py-3 overflow-x-auto flex gap-2">
    {ledgers.map((ledger) => (
      <button
        key={ledger.id}
        onClick={() => switchLedger(ledger.id)}
        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
          currentLedger?.id === ledger.id
            ? 'bg-primary text-white'
            : 'bg-white text-muted-foreground hover:bg-slate-100'
        }`}
      >
        {ledger.name}
      </button>
    ))}
  </div>
)}
```

替换为：
```tsx
{/* Ledger Selector */}
<div className="max-w-md mx-auto px-4 py-3">
  <LedgerSelector
    ledgers={ledgers}
    currentLedger={currentLedger}
    onChange={switchLedger}
  />
</div>
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend && npm run build`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/StatsPage.tsx
git commit -m "feat: StatsPage 使用 LedgerSelector 组件"
```

---

## 执行顺序

1. Task 1 → Task 2 → Task 3 → Task 4（顺序执行）
2. 每个 Task 内的步骤按顺序执行
3. 每个 Task 完成后进行提交

---

## 验收标准

1. 两个页面使用统一的账本选择器
2. 组件样式美观，支持选中状态动画
3. 功能与原来一致（切换账本）
4. 构建无错误
