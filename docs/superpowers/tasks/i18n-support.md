# i18n 多语言支持任务清单

**Spec**: docs/superpowers/specs/2026-03-17-i18n-support.md
**Plan**: docs/superpowers/plans/2026-03-17-i18n-support.md
**Created**: 2026-03-17
**Status**: ✅ COMPLETED

## 概述

为账本 App 添加多语言支持，默认支持中文和英文，语言设置保存在 localStorage。

## User Stories

- **US1**: 用户可以看到中文或英文的 UI 文本
- **US2**: 用户可以在设置页面切换语言

---

## Phase 1: 基础设置

**Goal**: 安装依赖并创建 i18n 配置

**Independent Test**: npm install 成功，i18n 可以正常初始化

- [X] T001 Install i18n dependencies: npm install i18next react-i18next (frontend/package.json)
- [X] T002 Create i18n initialization in frontend/src/i18n/index.ts
- [X] T003 Create Chinese translation file frontend/src/i18n/locales/zh.json
- [X] T004 Create English translation file frontend/src/i18n/locales/en.json
- [X] T005 Import i18n in frontend/src/main.tsx

---

## Phase 2: 页面翻译

**Goal**: 将所有页面的中文文本替换为翻译 key

**Independent Test**: 各页面可以正常显示中文或英文

- [X] T006 [P] Translate LoginPage - add useTranslation hook and replace text (frontend/src/pages/LoginPage.tsx)
- [X] T007 [P] Translate HomePage - add useTranslation and replace text (frontend/src/pages/HomePage.tsx)
- [X] T008 [P] Translate AddRecordPage - add useTranslation and replace text (frontend/src/pages/AddRecordPage.tsx)
- [X] T009 [P] Translate StatsPage - add useTranslation and replace text (frontend/src/pages/StatsPage.tsx)
- [X] T010 [P] Translate LedgerPage - add useTranslation and replace text (frontend/src/pages/LedgerPage.tsx)
- [X] T011 [P] Translate CategoryPage - add useTranslation and replace text (frontend/src/pages/CategoryPage.tsx)
- [X] T012 [P] Translate TagPage - add useTranslation and replace text (frontend/src/pages/TagPage.tsx)
- [X] T013 [P] Translate ExportPage - add useTranslation and replace text (frontend/src/pages/ExportPage.tsx)
- [X] T014 [P] Translate BudgetPage - add useTranslation and replace text (frontend/src/pages/BudgetPage.tsx)

---

## Phase 3: 语言切换功能

**Goal**: 在设置页面添加语言切换 UI

**Independent Test**: 用户可以在设置页面切换语言，切换后 UI 立即更新

- [X] T015 Add language switcher buttons to SettingsPage (frontend/src/pages/SettingsPage.tsx)

---

## Phase 4: 测试验证

**Goal**: 验证 i18n 功能正常工作

**Independent Test**: 使用 Playwright 验证语言检测、切换、持久化

- [X] T016 Test default language detection - zh-CN browser shows Chinese UI
- [X] T017 Test language switch - clicking English button changes all UI to English
- [X] T018 Test language persistence - refreshing page keeps selected language
- [X] T019 Test fallback - invalid localStorage falls back to English
- [X] T020 Build and verify no TypeScript errors

---

## Dependencies

- T001-T005 must complete before T006-T014
- T006-T014 are independent (can run in parallel)
- T015 depends on T002-T004 (i18n must be configured)
- T016-T020 depend on previous phases

---

## Implementation Notes

1. Language detection priority: localStorage['language'] → navigator.language → fallback 'en'
2. Translation keys follow i18n namespace pattern: auth.*, home.*, addRecord.*, etc.
3. SettingsPage uses i18n.changeLanguage() for immediate UI update
4. All commits must follow project conventions
