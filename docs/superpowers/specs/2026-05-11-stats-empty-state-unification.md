# Stats Empty State Unification

## Problem

On the stats page, when there is no data for the selected year/ledger:

- **Overview tab**: Shows `¥0.00` total and a flat-line chart (all zeros), because `summary.monthly_stats` is always an array of 12 zero-filled months from the backend.
- **Category tab**: Correctly shows the empty state (Inbox icon + "no data" text).
- **Monthly tab**: Shows a bar chart with all-zero bars (same root cause as Overview).

## Root Cause

`getMonthlyStats()` (`backend/internal/service/stats.go:112-128`) always returns 12 months with zero values, so `monthly_stats` is always a length-12 array. The frontend checks `summary.monthly_stats.length > 0` for Overview/Monthly tabs, which is always true.

The Category tab uses `categoryStats.length > 0` and the backend returns `[]` for no data, so it correctly shows the empty state.

## Solution

Change the data-existence check in `StatsPage.tsx` from `monthly_stats.length > 0` to `total_expense > 0`.

### Changes

**File**: `frontend/src/pages/StatsPage.tsx`

1. **Line 153** (Overview content guard):
   - Before: `activeTab === 'overview' && summary && summary.monthly_stats && summary.monthly_stats.length > 0`
   - After: `activeTab === 'overview' && summary && summary.total_expense > 0`

2. **Line 248** (Monthly content guard):
   - Before: `activeTab === 'monthly' && summary && summary.monthly_stats && summary.monthly_stats.length > 0`
   - After: `activeTab === 'monthly' && summary && summary.total_expense > 0`

## Affected Tab Behavior

| Tab | With data | Without data |
|-----|-----------|-------------|
| Overview | Summary card + trend chart | Empty state |
| Category | Pie chart + list | Empty state |
| Monthly | Bar chart | Empty state |

All three tabs now consistently show the empty state when `total_expense === 0`.

## Risk

Minimal. The change is purely a frontend condition change (2 lines). Backend unaffected. No API changes needed.
