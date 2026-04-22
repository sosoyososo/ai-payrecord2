# HomePage 滚动行为修复设计

## 问题描述

- iOS APP 首页无法滚动
- 其他 Tab 页滚动时 sticky header 跟着滚动，导致 safe area 缩短和消失
- Web APP 无此问题

## 根本原因

`HomePage.tsx` 使用了 `react-pull-to-refresh` 库，该库通过 JS 拦截滚动事件来实现下拉刷新。这在 Web 端可以工作，但绕过了 Capacitor iOS 的原生 WKWebView 滚动机制，导致：

1. iOS 原生 sticky 定位失效
2. safe area 处理异常

## 解决方案

**移除 `react-pull-to-refresh`，使用原生滚动**

### 改动说明

| 平台 | 改动后的行为 |
|------|-------------|
| 移动端 Web/Android/iOS | 原生滚动，原生 pull-to-refresh，sticky/safe area 正常 |
| 桌面 Web | 通过现有的"加载更多"按钮加载更多数据（已有实现） |

### 涉及文件

- `frontend/src/pages/HomePage.tsx` — 移除 PullToRefresh 相关代码

### 具体改动

1. 删除 import：`import PullToRefresh from 'react-pull-to-refresh'`
2. 删除 `<PullToRefresh>` 包装层（第138-144行，第344行），保留其内部内容
3. 保留现有的"加载更多"按钮功能（第296-313行）作为桌面端补充

### 预期效果

- iOS/Android：原生 pull-to-refresh + sticky header 正常工作
- Web：现有功能不受影响
- safe area：正确显示

## 测试验证

1. iOS 模拟器滚动测试
2. Android 模拟器滚动测试
3. Web 桌面端"加载更多"按钮测试
4. 各 Tab 页 sticky header 行为验证