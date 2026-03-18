# 底部菜单栏多语言支持 (Bottom Nav i18n)

## 概述

修复 `AppLayout.tsx` 中底部菜单栏（移动端）和左侧导航栏（桌面端）的硬编码中文问题，使菜单项支持多语言切换。

## 问题分析

### 当前问题

在 `AppLayout.tsx` 中，`navItems` 数组使用硬编码中文标签：

```javascript
const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/stats', icon: BarChart3, label: '统计' },
  { path: '/budget', icon: PiggyBank, label: '预算' },
  { path: '/settings', icon: Settings, label: '设置' },
]
```

### i18n 现状

`i18n/locales/en.json` 和 `zh.json` 的 `nav` 部分已有翻译键：
- `nav.home`: "首页" / "Home"
- `nav.stats`: "统计" / "Stats"
- `nav.settings`: "设置" / "Settings"
- `nav.categories`: "分类" / "Categories"
- `nav.tags`: "标签" / "Tags"
- `nav.ledgers`: "账本" / "Ledgers"

**缺失**：`nav.budget` 键（预算菜单项）

## 修复方案

### 1. 添加缺失的 i18n 键

在 `zh.json` 和 `en.json` 的 `nav` 部分添加 `budget` 键：

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

### 2. 修改 AppLayout.tsx

将硬编码的 label 替换为 i18n `useTranslation` hook：

```tsx
import { useTranslation } from 'react-i18next'

// 在组件内
const { t } = useTranslation()

const navItems = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/stats', icon: BarChart3, labelKey: 'nav.stats' },
  { path: '/budget', icon: PiggyBank, labelKey: 'nav.budget' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
]

// 使用
<span>{t(item.labelKey)}</span>
```

## 涉及文件

1. `frontend/src/i18n/locales/zh.json` - 添加 `nav.budget`
2. `frontend/src/i18n/locales/en.json` - 添加 `nav.budget`
3. `frontend/src/components/AppLayout.tsx` - 使用 i18n 替代硬编码

## 验收标准

1. 底部菜单栏在中文环境下显示"首页"、"统计"、"预算"、"设置"
2. 底部菜单栏在英文环境下显示"Home"、"Stats"、"Budget"、"Settings"
3. 切换语言后，菜单栏文本立即更新，无需刷新
