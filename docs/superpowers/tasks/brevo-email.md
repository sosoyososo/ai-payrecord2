# Tasks: Brevo Email Integration

**Input**: Design documents from `docs/superpowers/specs/2026-03-20-brevo-email-design.md` and `docs/superpowers/plans/2026-03-20-brevo-email-plan.md`
**Prerequisites**: plan.md, spec.md

**Tests**: Tests are NOT explicitly requested in the feature specification - skip test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration

- [ ] T001 Add Brevo and token encryption config fields in `backend/internal/config/config.go`
- [ ] T002 Create Brevo API client in `backend/pkg/brevo/client.go`
- [ ] T003 Create AES encryption utility in `backend/pkg/crypto/aes.go`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create VerificationToken model in `backend/internal/model/verification_token.go`
- [ ] T005 Create TokenService in `backend/internal/service/token.go`
- [ ] T006 Add GetUserByEmail, MarkEmailVerified, UpdatePassword methods in `backend/internal/service/auth.go`
- [ ] T007 Add email_verified field to User model in `backend/internal/model/user.go`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Password Reset (Priority: P1)

**Goal**: Allow users to request password reset via email and complete password reset with verification code

**Independent Test**: POST `/api/auth/forgot-password` followed by POST `/api/auth/reset-password` succeeds

### Implementation for User Story 1

- [ ] T008 Create EmailService with SendPasswordResetEmail in `backend/internal/service/email.go`
- [ ] T009 Add ForgotPassword handler in `backend/internal/handler/auth.go`
- [ ] T010 Add ResetPassword handler in `backend/internal/handler/auth.go`
- [ ] T011 Register routes in `backend/cmd/server/main.go`: `/api/auth/forgot-password`, `/api/auth/reset-password`
- [ ] T012 Add VerificationToken to AutoMigrate in `backend/cmd/server/main.go`

**Checkpoint**: Password reset flow should be fully functional

---

## Phase 4: User Story 2 - Email Verification (Priority: P2)

**Goal**: Allow users to verify email address and resend verification email

**Independent Test**: POST `/api/auth/verify-email` succeeds for valid code

### Implementation for User Story 2

- [ ] T013 Add SendEmailVerification method to EmailService in `backend/internal/service/email.go`
- [ ] T014 Add VerifyEmail handler in `backend/internal/handler/auth.go`
- [ ] T015 Add SendVerification handler (protected) in `backend/internal/handler/auth.go`
- [ ] T016 Register routes in `backend/cmd/server/main.go`: `/api/auth/verify-email`, `/api/auth/send-verification`

**Checkpoint**: Email verification flow should be fully functional

---

## Phase 5: User Story 3 - Login Alert (Priority: P3)

**Goal**: Send login alert notification when new device login detected (future enhancement)

**Independent Test**: Direct call to SendLoginAlert succeeds

### Implementation for User Story 3

- [ ] T017 Add SendLoginAlert method to EmailService in `backend/internal/service/email.go`

**Note**: Login alert triggering is not implemented - just the email sending capability

**Checkpoint**: Login alert email capability ready for future integration

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T018 Verify all imports and dependencies are correct
- [ ] T019 Build and verify compilation: `cd backend && go build ./...`
- [ ] T020 Update API documentation in `docs/api.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3-5 (User Stories)**: All depend on Foundational phase completion
  - User stories can proceed in parallel if staffed
- **Phase 6 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on US1/US2

### Within Each User Story

- Models before services
- Services before handlers
- Handlers before route registration
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different files, no dependencies)
- T004, T005, T006, T007 can run in parallel within Foundational phase
- T008-T012 (US1) and T013-T016 (US2) can potentially run in parallel

---

## Parallel Example

```bash
# Setup tasks (Phase 1) - all can run in parallel:
Task: T001 - Add Brevo config
Task: T002 - Create Brevo client
Task: T003 - Create AES utility

# Foundational tasks (Phase 2) - all can run in parallel:
Task: T004 - Create VerificationToken model
Task: T005 - Create TokenService
Task: T006 - Add AuthService methods
Task: T007 - Add email_verified field
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Password Reset)
4. **STOP and VALIDATE**: Test password reset flow
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

---

## File Paths Summary

| Task | File |
|------|------|
| T001 | `backend/internal/config/config.go` |
| T002 | `backend/pkg/brevo/client.go` |
| T003 | `backend/pkg/crypto/aes.go` |
| T004 | `backend/internal/model/verification_token.go` |
| T005 | `backend/internal/service/token.go` |
| T006 | `backend/internal/service/auth.go` |
| T007 | `backend/internal/model/user.go` |
| T008 | `backend/internal/service/email.go` |
| T009 | `backend/internal/handler/auth.go` |
| T010 | `backend/internal/handler/auth.go` |
| T011 | `backend/cmd/server/main.go` |
| T012 | `backend/cmd/server/main.go` |
| T013 | `backend/internal/service/email.go` |
| T014 | `backend/internal/handler/auth.go` |
| T015 | `backend/internal/handler/auth.go` |
| T016 | `backend/cmd/server/main.go` |
| T017 | `backend/internal/service/email.go` |
| T018 | All files |
| T019 | `backend/` |
| T020 | `docs/api.md` |

---

## Notes

- Tests are NOT included as they were not explicitly requested in the spec
- User Story 3 (Login Alert) is marked as future enhancement - just adds the SendLoginAlert method
- All handlers use `response.SuccessWithMessage()` format per project conventions
- Token codes are 8-digit numbers, encrypted with AES-256 for storage
