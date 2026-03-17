# API Test Cases - 账本 App

**Last Updated**: 2026-03-17
**Status**: Active

---

## 1. Authentication

### TC-API-AUTH-001: User Registration
- **ID**: TC-API-AUTH-001
- **Endpoint**: POST /api/v1/auth/register
- **Preconditions**: None
- **Test Data**:
  ```json
  {
    "email": "newuser@test.com",
    "password": "test123456",
    "username": "newuser"
  }
  ```
- **Expected**: 200 OK, returns user + tokens
- **Status**: ✅ Tested

### TC-API-AUTH-002: User Login
- **ID**: TC-API-AUTH-002
- **Endpoint**: POST /api/v1/auth/login
- **Preconditions**: User registered
- **Test Data**:
  ```json
  {
    "email": "test@test.com",
    "password": "test123456"
  }
  ```
- **Expected**: 200 OK, returns access_token + refresh_token
- **Status**: ✅ Tested

### TC-API-AUTH-003: Token Refresh
- **ID**: TC-API-AUTH-003
- **Endpoint**: POST /api/v1/auth/refresh
- **Preconditions**: Valid refresh_token
- **Test Data**:
  ```json
  {
    "refresh_token": "<valid_refresh_token>"
  }
  ```
- **Expected**: 200 OK, returns new tokens
- **Status**: ⏳ Not tested

### TC-API-AUTH-004: Logout
- **ID**: TC-API-AUTH-004
- **Endpoint**: POST /api/v1/auth/logout
- **Preconditions**: Valid access_token
- **Expected**: 200 OK
- **Status**: ⏳ Not tested

---

## 2. Ledger Management

### TC-API-LEDGER-001: List Ledgers
- **ID**: TC-API-LEDGER-001
- **Endpoint**: GET /api/v1/ledgers
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns list of ledgers
- **Status**: ✅ Tested

### TC-API-LEDGER-002: Create Ledger
- **ID**: TC-API-LEDGER-002
- **Endpoint**: POST /api/v1/ledgers
- **Preconditions**: Valid access_token
- **Test Data**:
  ```json
  {
    "name": "Test Ledger",
    "is_default": false
  }
  ```
- **Expected**: 200 OK, returns created ledger
- **Status**: ✅ Tested

### TC-API-LEDGER-003: Get Current Ledger
- **ID**: TC-API-LEDGER-003
- **Endpoint**: GET /api/v1/ledgers/current
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns current ledger
- **Status**: ✅ Tested

### TC-API-LEDGER-004: Switch Current Ledger
- **ID**: TC-API-LEDGER-004
- **Endpoint**: PUT /api/v1/ledgers/current
- **Preconditions**: Valid access_token, multiple ledgers exist
- **Test Data**:
  ```json
  {
    "ledger_id": 2
  }
  ```
- **Expected**: 200 OK
- **Status**: ✅ Tested

### TC-API-LEDGER-005: Update Ledger
- **ID**: TC-API-LEDGER-005
- **Endpoint**: PUT /api/v1/ledgers/:id
- **Preconditions**: Valid access_token
- **Test Data**:
  ```json
  {
    "name": "Updated Ledger Name"
  }
  ```
- **Expected**: 200 OK
- **Status**: ⏳ Not tested

### TC-API-LEDGER-006: Delete Ledger
- **ID**: TC-API-LEDGER-006
- **Endpoint**: DELETE /api/v1/ledgers/:id
- **Preconditions**: Valid access_token
- **Expected**: 200 OK
- **Status**: ⏳ Not tested

---

## 3. Category Management

### TC-API-CATEGORY-001: List Categories
- **ID**: TC-API-CATEGORY-001
- **Endpoint**: GET /api/v1/categories
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns list of categories
- **Status**: ✅ Tested

### TC-API-CATEGORY-002: Create Category
- **ID**: TC-API-CATEGORY-002
- **Endpoint**: POST /api/v1/categories
- **Preconditions**: Valid access_token
- **Test Data**:
  ```json
  {
    "name": "Test Category",
    "type": 1,
    "color": "#FF0000"
  }
  ```
- **Expected**: 200 OK, returns created category
- **Status**: ✅ Tested

### TC-API-CATEGORY-003: Update Category
- **ID**: TC-API-CATEGORY-003
- **Endpoint**: PUT /api/v1/categories/:id
- **Preconditions**: Valid access_token
- **Test Data**:
  ```json
  {
    "name": "Updated Category",
    "color": "#00FF00"
  }
  ```
- **Expected**: 200 OK, returns updated category
- **Status**: ⏳ Not tested

### TC-API-CATEGORY-004: Delete Category
- **ID**: TC-API-CATEGORY-004
- **Endpoint**: DELETE /api/v1/categories/:id
- **Preconditions**: Valid access_token, category belongs to user
- **Expected**: 200 OK
- **Status**: ⏳ Not tested

---

## 4. Tag Management

### TC-API-TAG-001: List Tags
- **ID**: TC-API-TAG-001
- **Endpoint**: GET /api/v1/tags
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns list of tags
- **Status**: ✅ Tested

### TC-API-TAG-002: Create Tag
- **ID**: TC-API-TAG-002
- **Endpoint**: POST /api/v1/tags
- **Preconditions**: Valid access_token
- **Test Data**:
  ```json
  {
    "name": "Test Tag",
    "color": "#0000FF"
  }
  ```
- **Expected**: 200 OK, returns created tag
- **Status**: ✅ Tested

### TC-API-TAG-003: Update Tag
- **ID**: TC-API-TAG-003
- **Endpoint**: PUT /api/v1/tags/:id
- **Preconditions**: Valid access_token
- **Test Data**:
  ```json
  {
    "name": "Updated Tag"
  }
  ```
- **Expected**: 200 OK
- **Status**: ⏳ Not tested

### TC-API-TAG-004: Delete Tag
- **ID**: TC-API-TAG-004
- **Endpoint**: DELETE /api/v1/tags/:id
- **Preconditions**: Valid access_token, tag belongs to user
- **Expected**: 200 OK
- **Status**: ⏳ Not tested

---

## 5. Record Management

### TC-API-RECORD-001: List Records
- **ID**: TC-API-RECORD-001
- **Endpoint**: GET /api/v1/records
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns paginated records
- **Status**: ✅ Tested

### TC-API-RECORD-002: Create Record (with ledger_id)
- **ID**: TC-API-RECORD-002
- **Endpoint**: POST /api/v1/records
- **Preconditions**: Valid access_token, category exists
- **Test Data**:
  ```json
  {
    "ledger_id": 1,
    "category_id": 1,
    "amount": 100,
    "type": 1,
    "date": "2026-03-17T10:00:00Z"
  }
  ```
- **Expected**: 200 OK, returns created record
- **Status**: ✅ Tested

### TC-API-RECORD-003: Create Record (without ledger_id)
- **ID**: TC-API-RECORD-003
- **Endpoint**: POST /api/v1/records
- **Preconditions**: Valid access_token, default ledger exists
- **Test Data**:
  ```json
  {
    "category_id": 1,
    "amount": 50,
    "type": 1,
    "date": "2026-03-17T10:00:00Z"
  }
  ```
- **Expected**: 200 OK, record created with default ledger
- **Status**: ✅ Tested (Bug fix #44)

### TC-API-RECORD-004: Get Record
- **ID**: TC-API-RECORD-004
- **Endpoint**: GET /api/v1/records/:id
- **Preconditions**: Valid access_token, record exists
- **Expected**: 200 OK, returns record details
- **Status**: ✅ Tested

### TC-API-RECORD-005: Update Record
- **ID**: TC-API-RECORD-005
- **Endpoint**: PUT /api/v1/records/:id
- **Preconditions**: Valid access_token, record exists
- **Test Data**:
  ```json
  {
    "amount": 200,
    "note": "Updated note"
  }
  ```
- **Expected**: 200 OK, returns updated record
- **Status**: ⏳ Not tested

### TC-API-RECORD-006: Delete Record
- **ID**: TC-API-RECORD-006
- **Endpoint**: DELETE /api/v1/records/:id
- **Preconditions**: Valid access_token, record exists
- **Expected**: 200 OK
- **Status**: ⏳ Not tested

---

## 6. Statistics

### TC-API-STATS-001: Get Summary
- **ID**: TC-API-STATS-001
- **Endpoint**: GET /api/v1/stats/summary?year=2026
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns yearly summary with monthly breakdown
- **Status**: ✅ Tested

### TC-API-STATS-002: Get Daily Stats
- **ID**: TC-API-STATS-002
- **Endpoint**: GET /api/v1/stats/daily?start_date=2026-03-01&end_date=2026-03-17
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns daily breakdown
- **Status**: ✅ Tested (Bug fix #42)

### TC-API-STATS-003: Get Category Stats
- **ID**: TC-API-STATS-003
- **Endpoint**: GET /api/v1/stats/by-category?type=1
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns category breakdown
- **Status**: ✅ Tested

### TC-API-STATS-004: Get Monthly Stats
- **ID**: TC-API-STATS-004
- **Endpoint**: GET /api/v1/stats/monthly?year=2026
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns monthly trend
- **Status**: ✅ Tested (Bug fix #43)

### TC-API-STATS-005: Get Monthly Detail
- **ID**: TC-API-STATS-005
- **Endpoint**: GET /api/v1/stats/monthly-detail?year=2026&month=3
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns monthly category breakdown
- **Status**: ✅ Tested

### TC-API-STATS-006: Get Tag Stats
- **ID**: TC-API-STATS-006
- **Endpoint**: GET /api/v1/stats/by-tag
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns tag breakdown
- **Status**: ⏳ Not tested

---

## 7. User Profile

### TC-API-PROFILE-001: Get Profile
- **ID**: TC-API-PROFILE-001
- **Endpoint**: GET /api/v1/user/profile
- **Preconditions**: Valid access_token
- **Expected**: 200 OK, returns user profile
- **Status**: ⏳ Not tested

### TC-API-PROFILE-002: Update Profile
- **ID**: TC-API-PROFILE-002
- **Endpoint**: PUT /api/v1/user/profile
- **Preconditions**: Valid access_token
- **Test Data**:
  ```json
  {
    "nickname": "Test Nickname"
  }
  ```
- **Expected**: 200 OK, returns updated profile
- **Status**: ⏳ Not tested

### TC-API-PROFILE-003: Change Password
- **ID**: TC-API-PROFILE-003
- **Endpoint**: PUT /api/v1/user/password
- **Preconditions**: Valid access_token
- **Test Data**:
  ```json
  {
    "old_password": "test123456",
    "new_password": "newtest123"
  }
  ```
- **Expected**: 200 OK
- **Status**: ⏳ Not tested

---

## Test Environment

- **Backend**: http://localhost:8080
- **Database**: backend/data/ledger.db
- **Token**: See test_env.md

## Running API Tests

### Using curl
```bash
# Set token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# List records
curl -s http://localhost:8080/api/v1/records \
  -H "Authorization: Bearer $TOKEN"
```

### Using hurl (recommended)
```bash
# Install hurl
brew install hurl

# Run tests
hurl --test test-scripts/api-tests.hurl
```

## Status Legend

- ✅ Tested - Test passed
- ⏳ Not tested - Needs testing
- ❌ Failed - Test failed, needs fix
