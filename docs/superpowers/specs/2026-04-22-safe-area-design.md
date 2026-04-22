# 安全区域支持设计方案

**日期**: 2026-04-22
**状态**: 已批准

## 1. 背景

当前项目使用 Capacitor 构建 iOS/Android 应用，但安全区域（Safe Area）支持不完整：
- 异形屏（刘海/灵动岛/挖孔）设备上内容被遮挡
- 底部导航在有 Home Indicator 的设备上被遮挡
- 状态栏未正确处理

## 2. 设计目标

创建可复用的安全区组件，统一处理 iOS/Android 设备的安全区域问题。

## 3. 组件设计

### SafeAreaView 组件

```tsx
interface SafeAreaViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
  className?: string
  children: React.ReactNode
}
```

**实现要点：**
- 使用 CSS `env(safe-area-inset-*)` 变量
- 根据 `edges` prop 添加对应方向的 padding
- 支持 Tailwind CSS className

**CSS 类映射：**
| edge | CSS 属性 |
|------|----------|
| top | `padding-top: env(safe-area-inset-top)` |
| bottom | `padding-bottom: env(safe-area-inset-bottom)` |
| left | `padding-left: env(safe-area-inset-left)` |
| right | `padding-right: env(safe-area-inset-right)` |

### 默认值

- `edges` 默认值：`['top', 'bottom']`
- 适配大多数移动端页面布局

## 4. 实施步骤

### 步骤 1: 创建 SafeAreaView 组件
- 文件: `frontend/src/components/SafeAreaView.tsx`
- 单元测试

### 步骤 2: 更新 AppLayout
- 使用 SafeAreaView 包装主内容区和底部导航
- 移除旧的 `safe-area-bottom` 类

### 步骤 3: 更新页面组件
- HomePage
- AddRecordPage
- StatsPage
- SettingsPage
- BudgetPage
- LoginPage

### 步骤 4: 验证测试
- iOS 模拟器测试
- Android 模拟器测试
- 截图对比

## 5. 技术栈

- React 19 + TypeScript
- Tailwind CSS
- Capacitor 8.x
- @capacitor/status-bar（如后续需要动态控制）

## 6. 兼容性

| 平台 | 支持情况 |
|------|----------|
| iOS 11+ | ✅ 使用 CSS env() |
| Android 7+ | ✅ 使用 CSS env() |
| Web | ✅ 回退为 0px |
