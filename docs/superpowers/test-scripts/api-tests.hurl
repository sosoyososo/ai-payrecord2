# API Test Cases using Hurl - Comprehensive Tests

# ============================================
# Authentication Tests
# ============================================

# TC-API-AUTH-002: Login
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json
{"email": "test@test.com", "password": "test123456"}
HTTP 200

# ============================================
# Ledger Tests
# ============================================

# TC-API-LEDGER-001: List Ledgers
GET http://localhost:8080/api/v1/ledgers
Authorization: Bearer {{token}}
HTTP 200

# TC-API-LEDGER-002: Create Ledger
POST http://localhost:8080/api/v1/ledgers
Authorization: Bearer {{token}}
Content-Type: application/json
{"name": "Test Ledger via Hurl", "is_default": false}
HTTP 200

# TC-API-LEDGER-005: Update Ledger (using default ledger id 3)
PUT http://localhost:8080/api/v1/ledgers/3
Authorization: Bearer {{token}}
Content-Type: application/json
{"name": "Updated Ledger Name"}
HTTP 200

# ============================================
# Category Tests
# ============================================

# TC-API-CATEGORY-001: List Categories
GET http://localhost:8080/api/v1/categories
Authorization: Bearer {{token}}
HTTP 200

# TC-API-CATEGORY-002: Create Category
POST http://localhost:8080/api/v1/categories
Authorization: Bearer {{token}}
Content-Type: application/json
{"name": "Test Category Hurl", "type": 1, "color": "#FF5733"}
HTTP 200

# TC-API-CATEGORY-003: Update Category (using category id 15)
PUT http://localhost:8080/api/v1/categories/15
Authorization: Bearer {{token}}
Content-Type: application/json
{"name": "Updated Category", "color": "#00FF00"}
HTTP 200

# ============================================
# Tag Tests
# ============================================

# TC-API-TAG-001: List Tags
GET http://localhost:8080/api/v1/tags
Authorization: Bearer {{token}}
HTTP 200

# TC-API-TAG-002: Create Tag
POST http://localhost:8080/api/v1/tags
Authorization: Bearer {{token}}
Content-Type: application/json
{"name": "Test Tag Hurl", "color": "#3380FF"}
HTTP 200

# TC-API-TAG-003: Update Tag (using tag id 7)
PUT http://localhost:8080/api/v1/tags/7
Authorization: Bearer {{token}}
Content-Type: application/json
{"name": "Updated Tag Name"}
HTTP 200

# ============================================
# Record Tests
# ============================================

# TC-API-RECORD-001: List Records
GET http://localhost:8080/api/v1/records
Authorization: Bearer {{token}}
HTTP 200

# TC-API-RECORD-002: Create Record
POST http://localhost:8080/api/v1/records
Authorization: Bearer {{token}}
Content-Type: application/json
{"category_id": 15, "amount": 150, "type": 2, "date": "2026-03-17T10:00:00Z", "note": "Test via Hurl"}
HTTP 200

# TC-API-RECORD-005: Update Record (using record id 4)
PUT http://localhost:8080/api/v1/records/4
Authorization: Bearer {{token}}
Content-Type: application/json
{"amount": 250, "note": "Updated via Hurl"}
HTTP 200

# ============================================
# Stats Tests
# ============================================

# TC-API-STATS-001: Summary
GET http://localhost:8080/api/v1/stats/summary?year=2026&ledger_id=1
Authorization: Bearer {{token}}
HTTP 200

# TC-API-STATS-002: Daily Stats
GET http://localhost:8080/api/v1/stats/daily?start_date=2026-03-01&end_date=2026-03-17&ledger_id=1
Authorization: Bearer {{token}}
HTTP 200

# TC-API-STATS-003: Category Stats
GET http://localhost:8080/api/v1/stats/by-category?type=1&ledger_id=1
Authorization: Bearer {{token}}
HTTP 200

# TC-API-STATS-004: Monthly Stats
GET http://localhost:8080/api/v1/stats/monthly?year=2026&ledger_id=1
Authorization: Bearer {{token}}
HTTP 200

# TC-API-STATS-005: Monthly Detail
GET http://localhost:8080/api/v1/stats/monthly-detail?year=2026&month=3&ledger_id=1
Authorization: Bearer {{token}}
HTTP 200

# ============================================
# Profile Tests
# ============================================

# TC-API-PROFILE-001: Get Profile
GET http://localhost:8080/api/v1/user/profile
Authorization: Bearer {{token}}
HTTP 200

# TC-API-PROFILE-002: Update Profile
PUT http://localhost:8080/api/v1/user/profile
Authorization: Bearer {{token}}
Content-Type: application/json
{"nickname": "Hurl Test User"}
HTTP 200
