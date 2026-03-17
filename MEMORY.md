# Project Memory

## Test Workflow Rules (MUST FOLLOW)

### API Tests
- Use **hurl** NOT curl
- Run: `hurl --test --variables-file docs/superpowers/test-scripts/test-vars.hurl docs/superpowers/test-scripts/api-tests.hurl`

### UI Tests
- Use **Playwright**
- Run via MCP tools or `npx playwright test`

### After Running Tests
- ALWAYS update test case status in docs/superpowers/test-cases/
- Use status: ✅ (passed), ⏳ (not tested), ❌ (failed)

### Quick Reference
- Test docs: docs/superpowers/test-cases/
- Test scripts: docs/superpowers/test-scripts/
- Credentials: test@test.com / test123456
