# API Test Cases using Hurl

## Setup
# Run: hurl --variables-file test-vars.hurl api-tests.hurl

## Auth Tests

### TC-API-AUTH-001: Register
POST http://localhost:8080/api/v1/auth/register
Content-Type: application/json
{
  "email": "hurltest@test.com",
  "password": "test123456",
  "username": "hurluser"
}
HTTP 200
[Captures]
access_token: json("$.data.access_token")
refresh_token: json("$.data.refresh_token")

### TC-API-AUTH-002: Login
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json
{
  "email": "test@test.com",
  "password": "test123456"
}
HTTP 200
[Captures]
token: json("$.data.access_token")

### TC-API-AUTH-003: Refresh Token
POST http://localhost:8080/api/v1/auth/refresh
Content-Type: application/json
{
  "refresh_token": "d3c20c07e646e55243a1c89e888538b49174ceec77f66fa09da94a6c87c79e4b"
}
HTTP 200

### TC-API-AUTH-004: Logout
POST http://localhost:8080/api/v1/auth/logout
Authorization: Bearer {{token}}
HTTP 200

---

## Ledger Tests

### TC-API-LEDGER-001: List Ledgers
GET http://localhost:8080/api/v1/ledgers
Authorization: Bearer {{token}}
HTTP 200

### TC-API-LEDGER-002: Create Ledger
POST http://localhost:8080/api/v1/ledgers
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "name": "Hurl Test Ledger",
  "is_default": false
}
HTTP 200

### TC-API-LEDGER-003: Get Current Ledger
GET http://localhost:8080/api/v1/ledgers/current
Authorization: Bearer {{token}}
HTTP 200

### TC-API-LEDGER-004: Switch Current Ledger
PUT http://localhost:8080/api/v1/ledgers/current
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "ledger_id": 1
}
HTTP 200

---

## Category Tests

### TC-API-CATEGORY-001: List Categories
GET http://localhost:8080/api/v1/categories
Authorization: Bearer {{token}}
HTTP 200

### TC-API-CATEGORY-002: Create Category
POST http://localhost:8080/api/v1/categories
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "name": "Hurl Category",
  "type": 1,
  "color": "#FF5733"
}
HTTP 200

---

## Tag Tests

### TC-API-TAG-001: List Tags
GET http://localhost:8080/api/v1/tags
Authorization: Bearer {{token}}
HTTP 200

### TC-API-TAG-002: Create Tag
POST http://localhost:8080/api/v1/tags
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "name": "Hurl Tag",
  "color": "#33FF57"
}
HTTP 200

---

## Record Tests

### TC-API-RECORD-001: List Records
GET http://localhost:8080/api/v1/records
Authorization: Bearer {{token}}
HTTP 200

### TC-API-RECORD-002: Create Record
POST http://localhost:8080/api/v1/records
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "ledger_id": 1,
  "category_id": 1,
  "amount": 100,
  "type": 1,
  "date": "2026-03-17T10:00:00Z"
}
HTTP 200

### TC-API-RECORD-003: Get Record
GET http://localhost:8080/api/v1/records/1
Authorization: Bearer {{token}}
HTTP 200

### TC-API-RECORD-004: Update Record
PUT http://localhost:8080/api/v1/records/1
Authorization: Bearer {{token}}
Content-Type: application/json
{
  "amount": 200,
  "note": "Updated via hurl"
}
HTTP 200

### TC-API-RECORD-005: Delete Record
DELETE http://localhost:8080/api/v1/records/1
Authorization: Bearer {{token}}
HTTP 200

---

## Stats Tests

### TC-API-STATS-001: Summary
GET http://localhost:8080/api/v1/stats/summary?year=2026
Authorization: Bearer {{token}}
HTTP 200

### TC-API-STATS-002: Daily
GET http://localhost:8080/api/v1/stats/daily?start_date=2026-03-01&end_date=2026-03-17
Authorization: Bearer {{token}}
HTTP 200

### TC-API-STATS-003: By Category
GET http://localhost:8080/api/v1/stats/by-category?type=1
Authorization: Bearer {{token}}
HTTP 200

### TC-API-STATS-004: Monthly
GET http://localhost:8080/api/v1/stats/monthly?year=2026
Authorization: Bearer {{token}}
HTTP 200

### TC-API-STATS-005: Monthly Detail
GET http://localhost:8080/api/v1/stats/monthly-detail?year=2026&month=3
Authorization: Bearer {{token}}
HTTP 200

### TC-API-STATS-006: By Tag
GET http://localhost:8080/api/v1/stats/by-tag
Authorization: Bearer {{token}}
HTTP 200

---

## Profile Tests

### TC-API-PROFILE-001: Get Profile
GET http://localhost:8080/api/v1/user/profile
Authorization: Bearer {{token}}
HTTP 200
