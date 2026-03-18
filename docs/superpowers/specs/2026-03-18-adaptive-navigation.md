# 自适应导航布局

**Created**: 2026-03-18
**Status**: Draft

## 概述

为账本 App 实现自适应导航，根据屏幕尺寸显示不同的导航模式。

## 现状分析

- 当前所有页面都有自己的 header（顶部导航）
- 没有统一的底部导航栏或侧边栏
- 移动端使用 FAB（浮动操作按钮）添加记录

## 设计方案

### 屏幕尺寸划分

| 屏幕宽度 | 设备类型 | 导航模式 |
|---------|---------|----------|
| < 768px | 手机 | 底部 Tab Bar + 顶部 Header |
| 768-1024px | 平板 | 底部 Tab Bar（更宽）+ 侧边信息 |
| > 1024px | PC | 左侧固定导航栏 |

### 导航项

| 页面 | 图标 | 路径 |
|------|------|------|
| 首页 | Home | / |
| 统计 | BarChart3 | /stats |
| 账本 | Wallet | /ledgers |
| 预算 | PiggyBank | /budget |
| 设置 | Settings | /settings |

### 实现细节

1. **创建 Layout 组件**
   - `src/components/AppLayout.tsx` - 自适应布局容器
   - 使用 `react-router-dom` 的 `Outlet` 渲染子路由

2. **响应式断点**
   - 使用 Tailwind `md:` `lg:` 响应式类
   - 或使用 `window.innerWidth` 检测

3. **底部导航栏**
   - 固定在底部 (`fixed bottom-0`)
   - 显示图标 + 文字标签
   - 当前页面高亮

4. **侧边导航栏（PC）**
   - 固定在左侧 (`fixed left-0`)
   - 显示图标 + 文字标签
   - 宽度 200-240px

## 受影响文件

- 创建：`frontend/src/components/AppLayout.tsx`
- 修改：`frontend/src/App.tsx`
- 修改：移除各页面的重复 header

## 验收标准

1. 手机 (<768px): 显示底部 Tab Bar，内容区有顶部 Header
2. 平板 (768-1024px): 显示底部 Tab Bar，内容更宽
3. PC (>1024px): 显示左侧导航栏，内容居中（max-w-2xl）
4. 导航切换平滑，无页面闪烁
