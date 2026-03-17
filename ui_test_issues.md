# UI Test Issues

## Test Date: 2026-03-17

## Test Environment
- Backend: http://localhost:8080
- Frontend: http://localhost:5173
- Test User: test@test.com / test123456

## Test Results Summary

### ✅ Working Features
| Feature | Status | Notes |
|---------|--------|-------|
| Login | ✅ PASS | |
| Add Record | ✅ PASS | |
| Categories Management | ✅ PASS | |
| Tags Management | ✅ PASS | |
| Ledger Management | ✅ PASS | |
| Stats - Overview | ✅ PASS | |
| Stats - Category | ✅ PASS | |
| Stats - Monthly | ✅ PASS | |
| Budget Settings | ✅ PASS | |
| Export Data | ✅ PASS | |
| Settings | ✅ PASS | |
| Theme Toggle | ✅ PASS | |

### ❌ Issues Found

#### Issue #1: Home - Recent Records Not Displaying ✅ FIXED
- **Location**: Home page "最近记录" section
- **Severity**: High
- **Description**: Records exist in the database (confirmed via API) and the summary shows ¥25.00, but the "最近记录" list still shows "No records yet"
- **Root Cause**: Backend's PageSuccess didn't wrap response in standard {code, message, data} format
- **Fix Applied**: Updated backend/internal/response/response.go PageSuccess to wrap response correctly

#### Issue #2: Stats - Chart Rendering Warnings ⚠️ KNOWN ISSUE
- **Location**: Stats page charts
- **Severity**: Very Low (Warning only)
- **Description**: Charts show warning "The width(-1) and height(-1) of chart should be set and width"
- **Root Cause**: Known Recharts issue during initial render in development mode
- **Impact**: None - charts render correctly after initial warning, only affects dev mode
- **Resolution**: No fix needed - this is a known Recharts issue that doesn't affect production
