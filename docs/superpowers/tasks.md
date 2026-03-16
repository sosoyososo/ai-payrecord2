# Tasks: 账本 App 后端 API

**Input**: Design documents from `/docs/superpowers/specs/`
**Prerequisites**: plan.md, spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (项目初始化)

**Purpose**: 项目初始化和基础架构

- [ ] T001 Create project structure in backend/ directory
- [ ] T002 Initialize Go module with go mod init
- [ ] T003 [P] Install dependencies: gin, gorm, sqlite, jwt, bcrypt, godotenv
- [ ] T004 Create .env configuration file
- [ ] T005 Create config loader in backend/internal/config/config.go

---

## Phase 2: Foundational (核心基础设施)

**Purpose**: 核心基础设施，必须在用户故事之前完成

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create database connection in backend/pkg/database/database.go
- [ ] T007 Create unified response format in backend/internal/response/response.go
- [ ] T008 [P] Create data models: User, Ledger, Category, Tag, Record, RecordTag, RefreshToken
- [ ] T009 Create password utility in backend/pkg/utils/bcrypt.go
- [ ] T010 Create JWT middleware in backend/internal/middleware/auth.go
- [ ] T011 Create main.go entry point in backend/cmd/server/main.go
- [ ] T012 [P] Compile and verify project builds successfully

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 用户认证 (Priority: P1) 🎯 MVP

**Goal**: 用户可以注册、登录、登出，使用 JWT Token 进行认证

**Independent Test**: 可以成功注册用户、登录获取 token、使用 token 访问受保护接口

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create AuthService in backend/internal/service/auth.go
- [ ] T014 [US1] Create AuthHandler in backend/internal/handler/auth.go
- [ ] T015 [US1] Implement /api/v1/auth/register endpoint
- [ ] T016 [US1] Implement /api/v1/auth/login endpoint
- [ ] T017 [US1] Implement /api/v1/auth/refresh endpoint
- [ ] T018 [US1] Implement /api/v1/auth/logout endpoint

**Checkpoint**: User authentication should be fully functional

---

## Phase 4: User Story 2 - 账本管理 (Priority: P1) 🎯 MVP

**Goal**: 用户可以创建、查看、切换多个账本

**Independent Test**: 可以创建账本、查看账本列表、切换当前账本

### Implementation for User Story 2

- [ ] T019 [P] [US2] Create UserService in backend/internal/service/user.go
- [ ] T020 [US2] Create UserHandler in backend/internal/handler/user.go
- [ ] T021 [US2] Implement /api/v1/user/profile endpoint
- [ ] T022 [P] [US2] Create LedgerService in backend/internal/service/ledger.go
- [ ] T023 [US2] Create LedgerHandler in backend/internal/handler/ledger.go
- [ ] T024 [US2] Implement /api/v1/ledgers endpoints (CRUD + switch)
- [ ] T025 [US2] Implement /api/v1/ledgers/current endpoint
- [ ] T026 [US2] Auto-create default ledger and seed data on user registration

**Checkpoint**: User story 1 and 2 should work together - user can register, login, and have a default ledger

---

## Phase 5: User Story 3 - 分类管理 (Priority: P2)

**Goal**: 用户可以查看、创建、删除分类

**Independent Test**: 可以查看分类列表、创建自定义分类、删除自定义分类

### Implementation for User Story 3

- [ ] T027 [P] [US3] Create CategoryService in backend/internal/service/category.go
- [ ] T028 [US3] Create CategoryHandler in backend/internal/handler/category.go
- [ ] T029 [US3] Implement /api/v1/categories endpoints (List, Create, Update, Delete)
- [ ] T030 [US3] Seed default categories on user registration (14 categories)
- [ ] T031 [US3] Prevent system category deletion

**Checkpoint**: Categories can be managed independently

---

## Phase 6: User Story 4 - 标签管理 (Priority: P2)

**Goal**: 用户可以查看、创建、删除标签

**Independent Test**: 可以查看标签列表、创建自定义标签、删除自定义标签

### Implementation for User Story 4

- [ ] T032 [P] [US4] Create TagService in backend/internal/service/tag.go
- [ ] T033 [US4] Create TagHandler in backend/internal/handler/tag.go
- [ ] T034 [US4] Implement /api/v1/tags endpoints (List, Create, Update, Delete)
- [ ] T035 [US4] Seed default tags on user registration (5 tags)
- [ ] T036 [US4] Prevent system tag deletion

**Checkpoint**: Tags can be managed independently

---

## Phase 7: User Story 5 - 记录管理 (Priority: P1) 🎯 MVP

**Goal**: 用户可以创建、查看、编辑、删除记账记录

**Independent Test**: 可以创建记录、查看记录列表（分页）、编辑记录、删除记录

### Implementation for User Story 5

- [ ] T037 [P] [US5] Create RecordService in backend/internal/service/record.go
- [ ] T038 [US5] Create RecordHandler in backend/internal/handler/record.go
- [ ] T039 [US5] Implement /api/v1/records endpoints (List, Get, Create, Update, Delete)
- [ ] T040 [US5] Implement cursor-based pagination for record list
- [ ] T041 [US5] Add category and tags info to record response

**Checkpoint**: Records can be managed with full CRUD operations

---

## Phase 8: User Story 6 - LLM 智能添加 (Priority: P3)

**Goal**: 用户可以通过自然语言添加记录，LLM 自动解析

**Independent Test**: 输入自然语言文本，LLM 解析出金额、分类、标签

### Implementation for User Story 6

- [ ] T042 [P] [US6] Create LLMService in backend/internal/service/llm.go
- [ ] T043 [US6] Create LLMHandler in backend/internal/handler/llm.go
- [ ] T044 [US6] Implement /api/v1/llm/categories endpoint
- [ ] T045 [US6] Implement /api/v1/llm/parse endpoint (parse natural language)
- [ ] T046 [US6] Implement /api/v1/llm/records endpoint (confirm and create)
- [ ] T047 [US6] Handle new category creation when LLM detects unknown category

**Checkpoint**: LLM can parse natural language and create records

---

## Phase 9: User Story 7 - 数据统计 (Priority: P3)

**Goal**: 用户可以查看支出/收入的统计图表

**Independent Test**: 可以获取分类统计、月度趋势、日度汇总等数据

### Implementation for User Story 7

- [ ] T048 [P] [US7] Create StatsService in backend/internal/service/stats.go
- [ ] T049 [US7] Create StatsHandler in backend/internal/handler/stats.go
- [ ] T050 [US7] Implement /api/v1/stats/summary endpoint (12-month overview)
- [ ] T051 [US7] Implement /api/v1/stats/daily endpoint (daily summary)
- [ ] T052 [US7] Implement /api/v1/stats/by-category endpoint (pie chart data)
- [ ] T053 [US7] Implement /api/v1/stats/monthly endpoint (trend chart data)
- [ ] T054 [US7] Implement /api/v1/stats/by-tag endpoint (tag statistics)
- [ ] T055 [US7] Implement /api/v1/stats/monthly-detail endpoint (month detail modal)

**Checkpoint**: All statistics endpoints functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 优化和横切关注点

- [ ] T056 [P] Add request validation in all handlers
- [ ] T057 Add proper error handling and logging
- [ ] T058 [P] Add database indexes for performance
- [ ] T059 Test all endpoints with integration testing
- [ ] T060 Update API documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational
- **Polish (Phase 10)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Auth - Can start after Foundational
- **US2 (P1)**: Ledger - Can start after Foundational, depends on US1 for auth
- **US3 (P2)**: Category - Can start after Foundational
- **US4 (P2)**: Tag - Can start after Foundational
- **US5 (P1)**: Record - Can start after Foundational, US2, US3, US4
- **US6 (P3)**: LLM - Can start after Foundational, US3, US4, US5
- **US7 (P3)**: Stats - Can start after Foundational, US5

### Parallel Opportunities

- Phase 1 tasks T001-T003 can run in parallel
- Phase 2 tasks T006-T007 can run in parallel
- US3 and US4 can be developed in parallel
- All models in Phase 2 can be created in parallel

---

## Implementation Strategy

### MVP First (US1 + US2 + US5)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete US1: Auth
4. Complete US2: Ledger
5. Complete US5: Record
6. **STOP and VALIDATE**: Core记账功能可用
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → Basic user and ledger management
3. Add US3 + US4 → Category and tag management
4. Add US5 → Core record management → **MVP!**
5. Add US6 → LLM智能添加
6. Add US7 → Statistics

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story should be independently completable
- Commit after each task or logical group
- Stop at any checkpoint to validate
