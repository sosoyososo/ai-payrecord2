# Tasks: Email Verification Flow

**Input**: Design documents from `/specs/2026-03-20-email-verification-flow-design.md`
**Prerequisites**: plan.md (tech stack: React + Gin + Gorm + Brevo API)

**Tech Stack**: React (frontend) + Golang/Gin (backend) + Brevo API (email)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

- **Backend**: `backend/internal/service/auth.go`, `backend/internal/handler/auth.go`, `backend/cmd/server/main.go`
- **Frontend**: `frontend/src/pages/EmailVerificationPage.tsx`, `frontend/src/services/api.ts`, `frontend/src/App.tsx`
- **i18n**: `frontend/src/i18n/locales/en.json`, `frontend/src/i18n/locales/zh.json`

---

## Phase 1: Backend - Core Auth Changes (Foundational)

**Purpose**: Backend modifications to support email verification flow. These changes are prerequisites for all frontend work.

**⚠️ CRITICAL**: All backend tasks must complete before frontend user story testing.

### Implementation

- [x] T001 [P] [US1] Modify `AuthService.Register()` in `backend/internal/service/auth.go` to return `{ email }` only instead of tokens, send verification email via `EmailService.SendEmailVerification()`
- [x] T002 [P] [US1] Update Register handler in `backend/internal/handler/auth.go` to call `SendEmailVerification()` after successful user creation
- [x] T003 [P] [US1] Add `EmailVerified` check in `AuthService.Login()` in `backend/internal/service/auth.go` - block login if `user.EmailVerified == false`
- [x] T004 [US1] Update Login handler in `backend/internal/handler/auth.go` to return proper error message when email not verified
- [x] T005 [US2] Move `send-verification` endpoint from protected to public routes in `backend/cmd/server/main.go`

### Verification

Run: `cd backend && go build ./...`
Expected: Build succeeds

**Checkpoint**: Backend supports email verification flow - user can register, receive email, verify, then login

---

## Phase 2: Frontend - API & i18n (Setup)

**Purpose**: Add necessary API methods and translations for email verification flow.

### Implementation

- [x] T006 [P] Add `verifyEmail`, `sendVerification`, `forgotPassword`, `resetPassword` API methods to `frontend/src/services/api.ts`
- [x] T007 [P] Add i18n translations for email verification flow in `frontend/src/i18n/locales/en.json` (auth.forgotPassword, auth.verifyEmail, auth.verificationCode, etc.)
- [x] T008 [P] Add i18n translations for email verification flow in `frontend/src/i18n/locales/zh.json`

### Verification

Run: `cd frontend && npm run build`
Expected: Build succeeds with new API methods

---

## Phase 3: Email Verification Pages

**Purpose**: Create pages for email verification and update login/register flow.

### Implementation

- [x] T009 [P] [US1] Create `EmailVerificationPage.tsx` in `frontend/src/pages/` with code input, verify button, resend button, and back to login link
- [x] T010 [P] [US2] Create `ForgotPasswordPage.tsx` in `frontend/src/pages/` with email input and submit button
- [x] T011 [P] [US2] Create `ResetPasswordPage.tsx` in `frontend/src/pages/` with code input, new password input, confirm password input
- [x] T012 [US1] Update `LoginPage.tsx` to add "Forgot password?" link after password input, redirect to `/forgot-password`
- [x] T013 [US1] Update `LoginPage.tsx` handleSubmit - after `register()` call, redirect to `/verify-email?email={email}` instead of auto-login
- [x] T014 [US1] Add routes for `/verify-email`, `/forgot-password`, `/reset-password` in `frontend/src/App.tsx`

### Verification

Run: `cd frontend && npm run build`
Expected: All new pages compile without errors

**Checkpoint**: User can register, be redirected to verify-email page, see email displayed, enter code, verify, and login

---

## Phase 4: Integration & Polish

**Purpose**: Ensure end-to-end flow works correctly.

### Implementation

- [ ] T015 [P] Verify complete registration flow: register → verify-email page → email received → verify → login
- [ ] T016 [P] Verify complete password reset flow: forgot-password → reset-password page → enter code + new password → login
- [ ] T017 [P] Verify login is blocked for unverified users with proper error message

### Verification

Manual testing or API testing with hurl/Playwright

**Checkpoint**: All flows work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Backend)**: No dependencies - can start immediately
- **Phase 2 (API & i18n)**: Can start in parallel with Phase 1
- **Phase 3 (Pages)**: Depends on Phase 1 + Phase 2 completion
- **Phase 4 (Integration)**: Depends on Phase 3 completion

### Within Each Phase

- Backend tasks marked [P] can run in parallel
- Frontend tasks marked [P] can run in parallel
- Models before services (not applicable here - using existing models)
- Core implementation before integration

---

## Parallel Execution Examples

```bash
# Phase 1 - Backend: Run in parallel
Task T001: Modify AuthService.Register()
Task T003: Add EmailVerified check to Login
Task T005: Move send-verification to public route

# Phase 2 - Frontend API/i18n: Run in parallel
Task T006: Add API methods
Task T007: Add English translations
Task T008: Add Chinese translations

# Phase 3 - Pages: Run in parallel
Task T009: Create EmailVerificationPage
Task T010: Create ForgotPasswordPage
Task T011: Create ResetPasswordPage
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Backend core changes
2. Complete Phase 2: API & i18n
3. Complete Task T009 + T013 + T014: EmailVerificationPage + routes
4. **STOP and VALIDATE**: User can register, verify email, login
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Add EmailVerificationPage → Test registration flow → Deploy/Demo (MVP!)
3. Add ForgotPasswordPage + ResetPasswordPage → Test password reset → Deploy/Demo
4. Each feature adds value without breaking previous features

---

## User Story Mapping

| User Story | Description | Tasks |
|------------|-------------|-------|
| US1 | Register with Email Verification | T001, T002, T003, T004, T009, T012, T013 |
| US2 | Verify Email | T009 (EmailVerificationPage) |
| US3 | Forgot Password | T010, T011 (ForgotPasswordPage, ResetPasswordPage) |

---

## Notes

- Tests are not explicitly requested in the feature specification - skipped
- Backend Brevo email integration already exists (see `backend/pkg/brevo/client.go`)
- Backend verification_token model already exists (see `backend/internal/model/verification_token.go`)
- Frontend uses React Router for routing
- i18n uses react-i18next
