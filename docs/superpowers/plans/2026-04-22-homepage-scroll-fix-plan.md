# HomePage 滚动行为修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除 `react-pull-to-refresh` 库，使 iOS/Android 原生滚动正常工作，修复 sticky header 和 safe area 问题

**Architecture:** 移除 HomePage.tsx 中的 PullToRefresh 包装层，恢复原生 HTML/CSS 滚动行为。各平台 WebView 原生支持 pull-to-refresh，无需 JS 库干预。

**Tech Stack:** React, Tailwind CSS, Capacitor iOS/Android

---

## Task 1: 移除 PullToRefresh 相关代码

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx:1-347`

- [ ] **Step 1: 删除 PullToRefresh import**

找到第15行：
```tsx
import PullToRefresh from 'react-pull-to-refresh'
```

删除该行。

- [ ] **Step 2: 删除 PullToRefresh 包装层**

找到第137-144行：
```tsx
    <SafeAreaView edges={['top']}>
    <PullToRefresh
      onRefresh={loadData}
      distanceToRefresh={80}
      className="min-h-screen"
    >
      <div className="min-h-screen bg-gradient-to-b ...">
```

修改为：
```tsx
    <SafeAreaView edges={['top']}>
      <div className="min-h-screen bg-gradient-to-b ...">
```

- [ ] **Step 3: 删除 PullToRefresh 结束标签**

找到第344行附近的 `</PullToRefresh>`，删除该闭合标签。

修改后第137-145行应为：
```tsx
    <SafeAreaView edges={['top']}>
      <div className="min-h-screen bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 pb-24">
```

最后一行应为 `</SafeAreaView>` 而不是 `</PullToRefresh>`。

- [ ] **Step 4: 验证改动**

检查文件确保：
1. 没有 `import PullToRefresh`
2. 没有 `<PullToRefresh>` 或 `</PullToRefresh>` 标签
3. `<SafeAreaView>` 和 `</SafeAreaView>` 成对出现

- [ ] **Step 5: 提交**

```bash
git add frontend/src/pages/HomePage.tsx
git commit -m "fix: remove PullToRefresh to restore native scroll behavior"
```

---

## Task 2: 验证 sticky header 和 safe area

**Files:**
- Test: `frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: iOS 模拟器测试**

1. 启动 iOS 模拟器
2. 打开 App
3. 在首页向上滚动
4. 验证：顶部 header 固定不动，safe area 正确显示

- [ ] **Step 2: Android 模拟器测试（如有）**

1. 启动 Android 模拟器
2. 打开 App
3. 在首页向上滚动
4. 验证：顶部 header 固定不动

- [ ] **Step 3: Web 桌面端测试**

1. 打开浏览器访问 http://localhost:5173
2. 验证"加载更多"按钮正常工作
3. 滚动时 sticky header 正常工作

---

## 验证清单

- [ ] iOS 首页可正常滚动
- [ ] iOS sticky header 固定不动
- [ ] iOS safe area 正确显示
- [ ] Web 加载更多按钮工作正常
- [ ] 无 console 错误