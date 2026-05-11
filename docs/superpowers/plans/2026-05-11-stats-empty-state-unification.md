# Stats Empty State Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify empty state behavior across all three stats tabs (Overview, Category, Monthly) to consistently show the empty state when no data exists.

**Architecture:** Single frontend-only change in `StatsPage.tsx` — replace `summary.monthly_stats.length > 0` checks with `summary.total_expense > 0` for the Overview and Monthly tab content guards.

**Tech Stack:** React + TypeScript + Recharts

---

### Task 1: Fix empty state guards in StatsPage.tsx

**Files:**
- Modify: `frontend/src/pages/StatsPage.tsx:153` (Overview content guard)
- Modify: `frontend/src/pages/StatsPage.tsx:248` (Monthly content guard)

- [ ] **Step 1: Change Overview tab content guard**

Line 153, change from:
```tsx
{activeTab === 'overview' && summary && summary.monthly_stats && summary.monthly_stats.length > 0 && (
```
to:
```tsx
{activeTab === 'overview' && summary && summary.total_expense > 0 && (
```

- [ ] **Step 2: Change Monthly tab content guard**

Line 248, change from:
```tsx
{activeTab === 'monthly' && summary && summary.monthly_stats && summary.monthly_stats.length > 0 && (
```
to:
```tsx
{activeTab === 'monthly' && summary && summary.total_expense > 0 && (
```

- [ ] **Step 3: Simplify Overview empty state condition (optional cleanup)**

Line 273, the empty state condition for Overview currently checks `monthly_stats` — simplify to just check `summary.total_expense <= 0`:
```tsx
{activeTab === 'overview' && (!summary || summary.total_expense <= 0) && (
```

- [ ] **Step 4: Simplify Monthly empty state condition (optional cleanup)**

Line 287:
```tsx
{activeTab === 'monthly' && (!summary || summary.total_expense <= 0) && (
```

- [ ] **Step 5: Verify the build**

Run:
```bash
cd /Users/karsa/proj/ai-payrecord2/frontend && bun run build 2>&1 | tail -20
```
Expected: Build succeeds with no errors.
