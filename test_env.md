# Test Environment Variables

## Test User Credentials

```
TEST_EMAIL=596291630@qq.com
TEST_PASSWORD=test123456
TEST_USERNAME=testuser

# Online API (api.payrecord.ai.karsa.info)
ONLINE_API_URL=https://api.payrecord.ai.karsa.info/api/v1

# Online test account
ONLINE_TEST_EMAIL=596291630@qq.com
ONLINE_TEST_PASSWORD=test123456

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
