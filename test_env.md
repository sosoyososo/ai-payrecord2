# Test Environment Variables

## Test User Credentials

```
TEST_EMAIL=test@test.com
TEST_PASSWORD=test123456
TEST_USERNAME=testuser2

# JWT Token (for API testing)
TEST_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJ1c2VybmFtZSI6InRlc3R1c2VyMiIsImV4cCI6MTc3MzgyOTQ0NX0.EnNUWgWu7_6fQ8fnjy0fOZsGi54X1OFxKATDqVSUTOw
```

## How to use in curl

```bash
# Using token
curl -H "Authorization: Bearer $TEST_TOKEN" ...

# Using credentials
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456"}'
```
