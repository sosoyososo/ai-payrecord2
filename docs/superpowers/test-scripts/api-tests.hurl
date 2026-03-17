# API Test Cases using Hurl - Basic Tests Only

# TC-API-AUTH-002: Login
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json
{"email": "test@test.com", "password": "test123456"}
HTTP 200

# TC-API-LEDGER-001: List Ledgers
GET http://localhost:8080/api/v1/ledgers
Authorization: Bearer {{token}}
HTTP 200

# TC-API-CATEGORY-001: List Categories
GET http://localhost:8080/api/v1/categories
Authorization: Bearer {{token}}
HTTP 200

# TC-API-TAG-001: List Tags
GET http://localhost:8080/api/v1/tags
Authorization: Bearer {{token}}
HTTP 200

# TC-API-RECORD-001: List Records
GET http://localhost:8080/api/v1/records
Authorization: Bearer {{token}}
HTTP 200

# TC-API-STATS-001: Summary
GET http://localhost:8080/api/v1/stats/summary?year=2026
Authorization: Bearer {{token}}
HTTP 200

# TC-API-PROFILE-001: Get Profile
GET http://localhost:8080/api/v1/user/profile
Authorization: Bearer {{token}}
HTTP 200
