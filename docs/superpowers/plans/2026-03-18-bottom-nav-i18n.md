# 底部菜单栏多语言支持 (Bottom Nav i18n) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix AppLayout.tsx to use i18n for bottom menu bar and left sidebar labels instead of hardcoded Chinese.

**Architecture:** Use react-i18next `useTranslation` hook in AppLayout component, reference `nav.*` translation keys from existing locale files, add missing `nav.budget` key to both locales.

**Tech Stack:** react-i18next, i18next

---

## Chunk 1: 添加 nav.budget 翻译键

**Files:**
- Modify: `frontend/src/i18n/locales/zh.json`
- Modify: `frontend/src/i18n/locales/en.json`

- [ ] **Step 1: Add nav.budget to zh.json**

在 `nav` 部分末尾添加 `"budget": "预算"`

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

- [ ] **Step 2: Add nav.budget to en.json**

在 `nav` 部分末尾添加 `"budget": "Budget"`

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

- [ ] **Step 3: Commit i18n changes**

```bash
git add frontend/src/i18n/locales/zh.json frontend/src/i18n/locales/en.json
git commit -m "feat(i18n): add nav.budget translation key"
```

---

## Chunk 2: 修改 AppLayout.tsx 使用 i18n

**Files:**
- Modify: `frontend/src/components/AppLayout.tsx`

- [ ] **Step 1: Add useTranslation import**

在文件顶部添加：
```tsx
import { useTranslation } from 'react-i18next'
```

- [ ] **Step 2: Add t function via useTranslation hook**

在组件函数开头添加：
```tsx
const { t } = useTranslation()
```

- [ ] **Step 3: Change navItems to use labelKey instead of hardcoded label**

修改 `navItems` 数组：
```tsx
const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/stats', icon: BarChart3, labelKey: 'nav.stats' },
  { path: '/budget', icon: PiggyBank, labelKey: 'nav.budget' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
]
```

- [ ] **Step 4: Update label usage to use t() function**

将 `<span>{item.label}</span>` 修改为：
```tsx
<span>{t(item.labelKey)}</span>
```

有两处需要修改：
- PC 端左侧导航栏 (line ~59)
- 移动端底部导航栏 (line ~93)

- [ ] **Step 5: Commit AppLayout changes**

```bash
git add frontend/src/components/AppLayout.tsx
git commit -m "feat(i18n): apply i18n to AppLayout nav items"
```

---

## Chunk 3: 验证

- [ ] **Step 1: 启动前端开发服务器**

```bash
cd frontend && npm run dev
```

- [ ] **Step 2: 验证中文环境**

打开应用，确认底部菜单栏显示"首页"、"统计"、"预算"、"设置"

- [ ] **Step 3: 切换到英文环境**

在设置页面切换语言到 English

- [ ] **Step 4: 验证英文环境**

确认底部菜单栏显示"Home"、"Stats"、"Budget"、"Settings"，无需刷新

---

**Plan complete and saved to `docs/superpowers/plans/2026-03-18-bottom-nav-i18n.md`. Ready to execute?**
