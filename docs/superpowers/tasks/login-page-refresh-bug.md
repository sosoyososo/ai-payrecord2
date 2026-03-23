# Tasks: Login页面刷新URL异常修复

**Input**: Design documents from `/docs/superpowers/specs/2026-03-23-login-page-refresh-bug.md`
**Prerequisites**: spec.md (required), plan.md (required)

**Tests**: UI测试 - 使用 Playwright 手动验证 SPA 路由刷新行为

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (验证环境)

**Purpose**: 确认当前配置状态

- [ ] T001 Verify Vite config has no base setting in frontend/vite.config.ts
- [ ] T002 Verify 404.html SPA fallback logic in frontend/public/404.html

---

## Phase 2: Foundational (核心修复)

**Purpose**: 修复导致 SPA 路由刷新闻题的根因

### Implementation

- [ ] T003 [P] Add `base: './'` to frontend/vite.config.ts
- [ ] T004 [P] Fix frontend/public/404.html SPA fallback logic to use relative path

### Verification

- [ ] T005 Build project to verify no errors: `cd frontend && npm run build`
- [ ] T006 Preview and test login page refresh: `npm run preview`

---

## Phase 3: User Story 1 - SPA路由刷新修复 (Priority: P1) 🎯 MVP

**Goal**: 修复login页面刷新后URL变成 `https://login/` 的问题

**Independent Test**: 在 `/login` 页面刷新后，URL保持 `/login`

### Tests

> NOTE: 使用 Playwright 手动测试 SPA 路由刷新行为

- [ ] T007 [US1] 验证 Login 页面刷新后 URL 保持正确

### Implementation

- [ ] T008 [US1] 配置 Vite base 为相对路径 (`base: './'`) in frontend/vite.config.ts
- [ ] T009 [US1] 修复 404.html fallback 逻辑 in frontend/public/404.html

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: 确保所有 SPA 路由刷新都能正常工作

- [ ] T010 [P] 验证其他页面刷新行为（/add, /edit/:id）
- [ ] T011 [P] 更新测试用例文档 in docs/superpowers/test-cases/ui-test-cases.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **Polish (Phase 4)**: Depends on User Story 1 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Core implementation before verification
- Build before preview test

---

## Parallel Opportunities

- T003 和 T004 可以并行执行（不同文件）
- T010 和 T011 可以并行执行（不同文件）

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify current state)
2. Complete Phase 2: Foundational (fix root cause)
3. Complete Phase 3: User Story 1 (verify fix works)
4. **STOP and VALIDATE**: Test login page refresh independently
5. Deploy if ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- 关键修复：
  1. Vite `base: './'` 确保资源使用相对路径
  2. 404.html fallback 只重定向到 index.html，由前端路由处理路径
