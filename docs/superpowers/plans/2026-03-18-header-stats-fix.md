# 首页布局优化与统计页年份选择器修复实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复首页顶部按钮冲突问题，优化统计页年份选择器深色样式

**Architecture:** 移除首页不必要的按钮，使用 shadcn/ui Select 组件替换原生 select

**Tech Stack:** React + TypeScript + Tailwind + shadcn/ui (Select)

---

## 文件结构

- `frontend/src/pages/HomePage.tsx` - 移除顶部右侧按钮
- `frontend/src/pages/StatsPage.tsx` - 替换年份选择器为 Select 组件

---

## Chunk 1: 首页顶部按钮修改

### Task 1: 移除 HomePage 顶部右侧按钮

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx:110-160`

- [ ] **Step 1: 读取 HomePage 当前代码**

确认顶部 header 的完整结构

- [ ] **Step 2: 修改 HomePage header - 简化右侧区域**

编辑 `frontend/src/pages/HomePage.tsx`，找到 header 部分：

```tsx
// 当前代码 (line 117-158):
<div className="flex items-center gap-1">
  <Button variant="ghost" size="icon" asChild>
    <Link to="/stats">
      <BarChart3 className="h-5 w-5" />
    </Link>
  </Button>
  <div className="relative">
    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}>
      <Settings className="h-5 w-5" />
    </Button>
    {/* 整个菜单部分 */}
  </div>
</div>
```

替换为：

```tsx
// 简化版本 - 只保留标题
<div className="flex items-center">
  {/* 移除了统计和设置按钮 */}
</div>
```

同时需要：
- 移除未使用的导入: `BarChart3`, `Settings`, `User`, `BookOpen`, `Tag` (检查哪些还在使用)
- 保留 `menuRef` 和 `menuOpen` 状态（如果有其他地方使用）

- [ ] **Step 3: 验证构建**

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 4: 提交更改**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "fix: remove top-right buttons from home header

- Removed statistics and settings buttons from header
- Simplified header to show only ledger name

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: 统计页年份选择器修改

### Task 2: 替换 StatsPage 年份选择器为 Select 组件

**Files:**
- Modify: `frontend/src/pages/StatsPage.tsx`

- [ ] **Step 1: 添加 Select 组件导入**

在 `frontend/src/pages/StatsPage.tsx` 顶部添加：

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
```

- [ ] **Step 2: 替换原生 select 为 Select 组件**

找到当前代码 (line 104-117):

```tsx
<div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2">
  <span className="text-sm text-muted-foreground">{t('stats.year')}</span>
  <select
    value={year}
    onChange={(e) => setYear(parseInt(e.target.value))}
    className="ml-auto text-sm border rounded px-2 py-1"
  >
    {[2024, 2025, 2026].map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>
</div>
```

替换为：

```tsx
<div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2">
  <span className="text-sm text-muted-foreground">{t('stats.year')}</span>
  <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
    <SelectTrigger className="ml-auto w-24">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {[2024, 2025, 2026].map((y) => (
        <SelectItem key={y} value={y.toString()}>
          {y}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

- [ ] **Step 3: 验证构建**

Run: `cd frontend && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 4: 提交更改**

```bash
git add frontend/src/pages/StatsPage.tsx
git commit -m "fix: replace native select with shadcn Select component

- Use Select component for year selector in stats page
- Improves dark mode styling consistency

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 验证清单

完成所有任务后，验证：

- [ ] 首页顶部只有账本名称，无右侧按钮
- [ ] 底部导航栏可正常访问统计和设置
- [ ] 统计页面年份选择在深色/浅色模式下样式正常
- [ ] 构建通过

---

## 依赖关系

- Task 1 和 Task 2 独立执行，无依赖关系
