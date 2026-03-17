# UI Test Cases - 账本 App

**Last Updated**: 2026-03-17
**Status**: Active

---

## 1. Authentication

### TC-UI-AUTH-001: User Login
- **ID**: TC-UI-AUTH-001
- **Feature**: Login
- **Preconditions**: User registered, app running
- **URL**: http://localhost:5173/login
- **Test Steps**:
  1. Navigate to http://localhost:5173/login
  2. Enter email: test@test.com
  3. Enter password: test123456
  4. Click "Sign In"
- **Expected**: Redirect to home page, shows ledger name
- **Status**: ✅ Tested

### TC-UI-AUTH-002: User Logout
- **ID**: TC-UI-AUTH-002
- **Feature**: Logout
- **Preconditions**: Logged in
- **Test Steps**:
  1. Click logout icon in header
- **Expected**: Redirect to login page
- **Status**: ✅ Tested

---

## 2. Home Page

### TC-UI-HOME-001: View Home Page
- **ID**: TC-UI-HOME-001
- **Feature**: Home Page Display
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to http://localhost:5173/
- **Expected**: Shows summary cards, recent records
- **Status**: ✅ Tested

### TC-UI-HOME-002: View Recent Records
- **ID**: TC-UI-HOME-002
- **Feature**: Recent Records List
- **Preconditions**: Logged in, records exist
- **Test Steps**:
  1. Navigate to home page
  2. View "最近记录" section
- **Expected**: Records display with category, amount, date
- **Status**: ✅ Tested (Fixed)

### TC-UI-HOME-003: Search Records
- **ID**: TC-UI-HOME-003
- **Feature**: Search
- **Preconditions**: Logged in, records exist
- **Test Steps**:
  1. Enter search term in search box
- **Expected**: Filter records by search term
- **Status**: ✅ Tested

### TC-UI-HOME-004: Switch Ledger
- **ID**: TC-UI-HOME-004
- **Feature**: Ledger Switching
- **Preconditions**: Multiple ledgers exist
- **Test Steps**:
  1. Click different ledger button
- **Expected**: Data updates to show selected ledger
- **Status**: ✅ Tested

---

## 3. Add Record

### TC-UI-ADD-001: Add Expense Record
- **ID**: TC-UI-ADD-001
- **Feature**: Add Record
- **Preconditions**: Logged in
- **URL**: http://localhost:5173/add
- **Test Steps**:
  1. Navigate to /add or click FAB
  2. Enter amount: 25
  3. Select category: 餐饮
  4. Click "保存记录"
- **Expected**: Redirect to home, record appears in list
- **Status**: ✅ Tested

### TC-UI-ADD-002: Add Income Record
- **ID**: TC-UI-ADD-002
- **Feature**: Add Record (Income)
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /add
  2. Click "收入" button
  3. Enter amount: 1000
  4. Select category: 工资
  5. Click "保存记录"
- **Expected**: Record created as income
- **Status**: ✅ Tested

### TC-UI-ADD-003: Add Record with Note
- **ID**: TC-UI-ADD-003
- **Feature**: Add Record with Note
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /add
  2. Enter amount
  3. Select category
  4. Enter note: "Test note"
  5. Click "保存记录"
- **Expected**: Note saved with record
- **Status**: ⏳ Not tested

---

## 4. Statistics

### TC-UI-STATS-001: View Overview
- **ID**: TC-UI-STATS-001
- **Feature**: Statistics Overview
- **Preconditions**: Logged in, records exist
- **URL**: http://localhost:5173/stats
- **Test Steps**:
  1. Navigate to /stats
  2. View Overview tab
- **Expected**: Shows summary cards, monthly trend chart
- **Status**: ✅ Tested

### TC-UI-STATS-002: View Category Stats
- **ID**: TC-UI-STATS-002
- **Feature**: Category Statistics
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /stats
  2. Click "分类" tab
- **Expected**: Shows pie chart, category list
- **Status**: ✅ Tested

### TC-UI-STATS-003: View Monthly Stats
- **ID**: TC-UI-STATS-003
- **Feature**: Monthly Statistics
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /stats
  2. Click "月度" tab
- **Expected**: Shows bar chart with monthly data
- **Status**: ✅ Tested

### TC-UI-STATS-004: Change Year
- **ID**: TC-UI-STATS-004
- **Feature**: Year Filter
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /stats
  2. Select different year from dropdown
- **Expected**: Data updates for selected year
- **Status**: ✅ Tested

---

## 5. Category Management

### TC-UI-CATEGORY-001: View Categories
- **ID**: TC-UI-CATEGORY-001
- **Feature**: Category List
- **Preconditions**: Logged in
- **URL**: http://localhost:5173/categories
- **Test Steps**:
  1. Navigate to /categories
- **Expected**: Shows income and expense categories
- **Status**: ✅ Tested

### TC-UI-CATEGORY-002: Add Category
- **ID**: TC-UI-CATEGORY-002
- **Feature**: Create Category
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /categories
  2. Click "添加分类"
  3. Enter name: "Test Category"
  4. Select type: 支出
  5. Click "保存"
- **Expected**: New category appears in list
- **Status**: ✅ Tested

### TC-UI-CATEGORY-003: Edit Category
- **ID**: TC-UI-CATEGORY-003
- **Feature**: Edit Category
- **Preconditions**: Logged in, custom category exists
- **Test Steps**:
  1. Navigate to /categories
  2. Click edit button on custom category
  3. Change name
  4. Click "保存"
- **Expected**: Category updated
- **Status**: ✅ Tested

### TC-UI-CATEGORY-004: Delete Category
- **ID**: TC-UI-CATEGORY-004
- **Feature**: Delete Category
- **Preconditions**: Logged in, custom category exists
- **Test Steps**:
  1. Navigate to /categories
  2. Click delete button on custom category
- **Expected**: Category removed from list
- **Status**: ✅ Tested

---

## 6. Tag Management

### TC-UI-TAG-001: View Tags
- **ID**: TC-UI-TAG-001
- **Feature**: Tag List
- **Preconditions**: Logged in
- **URL**: http://localhost:5173/tags
- **Test Steps**:
  1. Navigate to /tags
- **Expected**: Shows system and custom tags
- **Status**: ✅ Tested

### TC-UI-TAG-002: Add Tag
- **ID**: TC-UI-TAG-002
- **Feature**: Create Tag
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /tags
  2. Click "添加标签"
  3. Enter name: "Test Tag"
  4. Click "保存"
- **Expected**: New tag appears in list
- **Status**: ✅ Tested

### TC-UI-TAG-003: Delete Tag
- **ID**: TC-UI-TAG-003
- **Feature**: Delete Tag
- **Preconditions**: Logged in, custom tag exists
- **Test Steps**:
  1. Navigate to /tags
  2. Click delete on custom tag
- **Expected**: Tag removed
- **Status**: ✅ Tested

---

## 7. Ledger Management

### TC-UI-LEDGER-001: View Ledgers
- **ID**: TC-UI-LEDGER-001
- **Feature**: Ledger List
- **Preconditions**: Logged in
- **URL**: http://localhost:5173/ledgers
- **Test Steps**:
  1. Navigate to /ledgers
- **Expected**: Shows all ledgers
- **Status**: ✅ Tested

### TC-UI-LEDGER-002: Add Ledger
- **ID**: TC-UI-LEDGER-002
- **Feature**: Create Ledger
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /ledgers
  2. Click "添加账本"
  3. Enter name: "Test Ledger"
  4. Click confirm
- **Expected**: New ledger appears
- **Status**: ✅ Tested

### TC-UI-LEDGER-003: Delete Ledger
- **ID**: TC-UI-LEDGER-003
- **Feature**: Delete Ledger
- **Preconditions**: Logged in, non-default ledger exists
- **Test Steps**:
  1. Navigate to /ledgers
  2. Click delete on non-default ledger
- **Expected**: Ledger removed
- **Status**: ✅ Tested

---

## 8. Settings

### TC-UI-SETTINGS-001: View Settings
- **ID**: TC-UI-SETTINGS-001
- **Feature**: Settings Page
- **Preconditions**: Logged in
- **URL**: http://localhost:5173/settings
- **Test Steps**:
  1. Navigate to /settings
- **Expected**: Shows theme, profile, password sections
- **Status**: ✅ Tested

### TC-UI-SETTINGS-002: Change Theme
- **ID**: TC-UI-SETTINGS-002
- **Feature**: Theme Toggle
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /settings
  2. Click "深色" or "浅色"
- **Expected**: Theme changes immediately
- **Status**: ✅ Tested

### TC-UI-SETTINGS-003: Update Profile
- **ID**: TC-UI-SETTINGS-003
- **Feature**: Profile Update
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /settings
  2. Enter nickname
  3. Click "保存"
- **Expected**: Profile updated
- **Status**: ✅ Tested

### TC-UI-SETTINGS-004: Change Password
- **ID**: TC-UI-SETTINGS-004
- **Feature**: Password Change
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /settings
  2. Enter current password
  3. Enter new password
  4. Confirm new password
  5. Click "修改密码"
- **Expected**: Password changed
- **Status**: ✅ Tested

---

## 9. Budget

### TC-UI-BUDGET-001: View Budget
- **ID**: TC-UI-BUDGET-001
- **Feature**: Budget Display
- **Preconditions**: Logged in
- **URL**: http://localhost:5173/budget
- **Test Steps**:
  1. Navigate to /settings
  2. Click "预算设置"
- **Expected**: Shows budget, spent, remaining
- **Status**: ✅ Tested

### TC-UI-BUDGET-002: Set Budget
- **ID**: TC-UI-BUDGET-002
- **Feature**: Budget Setting
- **Preconditions**: Logged in
- **Test Steps**:
  1. Navigate to /budget
  2. Enter budget amount
  3. Click "保存预算"
- **Expected**: Budget saved, shows remaining
- **Status**: ✅ Tested

---

## 10. Export

### TC-UI-EXPORT-001: Export Data
- **ID**: TC-UI-EXPORT-001
- **Feature**: Data Export
- **Preconditions**: Logged in, records exist
- **URL**: http://localhost:5173/export
- **Test Steps**:
  1. Navigate to /export
  2. Click "加载数据"
  3. Click "导出 JSON"
- **Expected**: JSON file downloads
- **Status**: ✅ Tested

### TC-UI-EXPORT-002: Export CSV
- **ID**: TC-UI-EXPORT-002
- **Feature**: CSV Export
- **Preconditions**: Logged in, records exist
- **Test Steps**:
  1. Navigate to /export
  2. Click "加载数据"
  3. Click "导出 CSV"
- **Expected**: CSV file downloads
- **Status**: ✅ Tested

---

## Test Environment

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **Credentials**: test@test.com / test123456

## Running UI Tests

### Manual Testing
Use Playwright to automate:
```bash
# Open browser
npx playwright test

# Or run specific test
npx playwright test --grep "login"
```

### Test Status Legend

- ✅ Tested - Test passed
- ⏳ Not tested - Needs testing
- ❌ Failed - Test failed, needs fix

## Notes

- All tests run on local environment
- Use Playwright for automation
- Update status after each test run
