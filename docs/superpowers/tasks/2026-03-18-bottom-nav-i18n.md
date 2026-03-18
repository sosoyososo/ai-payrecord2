# Bottom Nav i18n - Task List

## Summary

- **Total tasks**: 5
- **Feature**: 底部菜单栏多语言支持
- **Spec**: docs/superpowers/specs/2026-03-18-bottom-nav-i18n.md
- **Plan**: docs/superpowers/plans/2026-03-18-bottom-nav-i18n.md

---

## Phase 1: 添加 nav.budget 翻译键

- [x] T001 [P] Add nav.budget key to zh.json and en.json

---

## Phase 2: 修改 AppLayout.tsx 使用 i18n

- [x] T002 [P] Add useTranslation import to AppLayout.tsx

- [x] T003 [P] Replace hardcoded nav labels with i18n t() function

---

## Phase 3: 验证

- [x] T004 [US1] Verify i18n works for bottom navigation in both zh and en locales

---

## Dependencies

```
T001 ─┬─> T002 ─> T003 ─> T004
      └─> T002 ─> T003 ─> T004
```

## Task Details

### T001 [P] Add nav.budget key to zh.json and en.json

**Files:**
- Modify: `frontend/src/i18n/locales/zh.json`
- Modify: `frontend/src/i18n/locales/en.json`

**Description:**
在 zh.json 和 en.json 的 nav 部分添加 "budget" 键

**zh.json 修改内容:**
```json
"nav": {
  "home": "首页",
  "stats": "统计",
  "settings": "设置",
  "categories": "分类",
  "tags": "标签",
  "ledgers": "账本",
  "budget": "预算"
}
```

**en.json 修改内容:**
```json
"nav": {
  "home": "Home",
  "stats": "Stats",
  "settings": "Settings",
  "categories": "Categories",
  "tags": "Tags",
  "ledgers": "Ledgers",
  "budget": "Budget"
}
```

**Verification:**
两个文件都包含 nav.budget 键

---

### T002 [P] Add useTranslation import to AppLayout.tsx

**Files:**
- Modify: `frontend/src/components/AppLayout.tsx`

**Description:**
添加 `import { useTranslation } from 'react-i18next'` 到文件顶部，并在组件内调用 `const { t } = useTranslation()`

**Verification:**
AppLayout.tsx 可以正常导入并使用 useTranslation

---

### T003 [P] Replace hardcoded nav labels with i18n t() function

**Files:**
- Modify: `frontend/src/components/AppLayout.tsx`

**Description:**
将 navItems 数组从:
```tsx
const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/stats', icon: BarChart3, label: '统计' },
  { path: '/budget', icon: PiggyBank, label: '预算' },
  { path: '/settings', icon: Settings, label: '设置' },
]
```

改为:
```tsx
const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/stats', icon: BarChart3, labelKey: 'nav.stats' },
  { path: '/budget', icon: PiggyBank, labelKey: 'nav.budget' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
]
```

并将 `<span>{item.label}</span>` 改为 `<span>{t(item.labelKey)}</span>`

**Verification:**
PC端左侧导航栏和移动端底部导航栏都正确显示翻译后的文本

---

### T004 [US1] Verify i18n works for bottom navigation in both zh and en locales

**Files:**
- Verify: `frontend/src/components/AppLayout.tsx`
- Verify: `frontend/src/i18n/locales/zh.json`
- Verify: `frontend/src/i18n/locales/en.json`

**Verification Steps:**
1. 启动前端开发服务器: `cd frontend && npm run dev`
2. 确认中文环境下底部菜单栏显示"首页"、"统计"、"预算"、"设置"
3. 在设置页面切换语言到 English
4. 确认英文环境下显示"Home"、"Stats"、"Budget"、"Settings"
5. 确认语言切换后 UI 立即更新，无需刷新

**Independent Test Criteria:**
- [ ] 中文环境下菜单栏显示正确
- [ ] 英文环境下菜单栏显示正确
- [ ] 语言切换即时生效

---

## Parallel Execution Opportunities

T001 和 T002 可以并行执行，因为它们修改的是不同文件。

T002 和 T003 必须串行执行，因为 T003 依赖于 T002 的修改。

---

## Implementation Strategy

这是单一用户故事的简单修复，按顺序执行 T001 -> T002 -> T003 -> T004 即可。
