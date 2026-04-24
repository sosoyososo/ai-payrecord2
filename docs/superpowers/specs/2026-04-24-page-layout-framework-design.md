# 页面布局框架设计

**日期**: 2026-04-24
**状态**: 已确认

## 1. 背景与目标

当前 App 在 iOS/Android 原生壳中表现异常：
- 内容外层有多余的滚动壳
- TabBar 被部分隐藏
- Header 行为异常

根本原因是：每个页面都自己处理安全区、Header、滚动区域，导致行为不一致且容易出错。

**目标**：建立统一的页面布局框架，一处定义，全局生效。

---

## 2. 核心设计

### 2.1 组件结构

```
App (App.tsx - 路由配置)
└── Routes
    ├── 公开路由 (无需登录，LoginPage 等)
    │   └── LoginPage 等（保持现状）
    │
    └── 受保护路由 (AppLayout 包裹)
        └── AppLayout
            ├── SafeAreaView(edges=['top'])
            │   └── AppHeader (统一 Header)
            ├── <Outlet> (overflow-y-auto, flex-1)  ← 唯一滚动容器
            │   └── PageContainer
            │       └── <div className="pb-X">     ← 动态底部 padding
            │           └── children (页面内容)
            └── TabBar (fixed bottom)
                └── SafeAreaView(edges=['bottom'])
```

### 2.2 PageContainer 组件

```tsx
interface PageContainerProps {
  title?: string                          // Header 标题
  showBackButton?: boolean                // 是否显示返回按钮，默认 false
  enableSwipeBack?: boolean               // 是否启用右滑返回，默认 true
  fab?: { icon: ReactNode; to: string }  // 右下角 FAB
  children: React.ReactNode
}
```

**职责**：
- 渲染 Header（通过 AppLayout 的 HeaderContext）
- 提供滚动容器内的子内容
- 管理底部 padding（动态计算）
- 处理右滑返回手势

### 2.3 AppLayout 改造

**手机模式**：
```tsx
<div className="h-screen flex flex-col">
  <SafeAreaView edges={['top']} className="contents">
    <AppHeader />
  </SafeAreaView>
  <div className="flex-1 overflow-y-auto overflow-x-hidden">
    <Outlet />
  </div>
  <TabBar />
</div>
```

**关键点**：
- `<Outlet>` 是唯一的滚动容器（`overflow-y-auto`）
- Header 和 TabBar 在滚动容器外部（fixed/sticky）
- 滚动区域使用 `flex-1` 填满剩余空间

### 2.4 右滑返回手势

**实现方式**：基于 Touch 事件的手势识别

**手势识别逻辑**：
```tsx
// 触发区域：屏幕左侧边缘 0-50px
// 触发条件：水平滑动距离 > 50px 且 速度 > 0.3
// 视觉反馈：页面跟随手指偏移，半透明遮罩
// 执行：navigate(-1)
```

**配置项**：
- `enableSwipeBack?: boolean` — 默认 true
- 禁用场景：首页（`/`）、弹窗内

**可选增强**：配合 `@capacitor/haptics` 提供震动反馈

---

## 3. 底部空间计算

### 3.1 动态 Padding

```tsx
// 无 FAB 时
pb = TabBar 高度 (3.5rem) + safe-area-inset-bottom

// 有 FAB 时
pb = TabBar 高度 (3.5rem) + safe-area-inset-bottom + 额外间距
```

### 3.2 FAB 定位

```tsx
// FAB 位置
bottom: calc(3.5rem + env(safe-area-inset-bottom) + 0.5rem)
// = TabBar 高度 + 安全区 + 间距
```

---

## 4. 页面迁移清单

需要迁移的受保护页面（10个）：

| 页面 | SafeAreaView | 自定义Header | FAB | 特殊处理 |
|------|-------------|--------------|-----|----------|
| HomePage | 移除 | 移除，用 PageContainer | 保留 | LedgerSelector |
| AddRecordPage | 移除 | 移除 | 无 | AI Input |
| EditRecordPage | 移除 | 移除 | 无 | RecordForm |
| StatsPage | 移除 | 移除 | 无 | Tabs 组件 |
| LedgerPage | 移除 | 移除 | 无 | 无 |
| CategoryPage | 移除 | 移除 | 无 | 无 |
| TagPage | 移除 | 移除 | 无 | 无 |
| SettingsPage | 移除 | 移除 | 无 | 无 |
| ExportPage | 移除 | 移除 | 无 | 无 |
| BudgetPage | 移除 | 移除 | 无 | 无 |

公开页面（4个）保持现状，不纳入 PageContainer：

| 页面 | 处理方式 |
|------|----------|
| LoginPage | 自己处理 |
| ForgotPasswordPage | 自己处理 |
| ResetPasswordPage | 自己处理 |
| EmailVerificationPage | 自己处理 |

---

## 5. 技术实现要点

### 5.1 右滑返回手势实现

```tsx
// SwipeBack.tsx
// 监听 touchstart/touchmove/touchend
// 计算滑动的水平和垂直距离
// 判断是否是左滑且超过阈值
// 触发 navigate(-1)
```

### 5.2 HeaderContext 联动

PageContainer 通过 `useHeader()` 设置 Header 配置：
- `title` → AppHeader 显示标题
- `showBackButton` → AppHeader 显示返回按钮
- 路由变化时自动重置

### 5.3 滚动行为

- 滚动容器收敛到 AppLayout 的 `<Outlet>`
- 页面内容不再自己处理滚动
- `pb-X` padding 确保内容不被 TabBar 遮挡

---

## 6. 验证方案

| 测试项 | 方法 |
|--------|------|
| iOS 模拟器滚动正常 | 在 iOS Simulator 中测试 |
| Android 真机滚动正常 | 在 Android 真机上测试 |
| 右滑返回手势 | 在各页面测试左滑手势 |
| Header 正确显示 | 访问各页面验证 |
| FAB 位置正确 | 检查是否与 TabBar 重叠 |
| 安全区留白 | 在刘海屏和圆角屏上测试 |

---

## 7. 依赖变更

- 新增 `PageContainer` 组件
- 新增 `SwipeBack` 手势组件
- AppLayout 改造
- 可能需要 `@capacitor/haptics`（可选）

---

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 右滑返回与水平滚动冲突 | 限定触发区域在左侧边缘 |
| 部分页面需要禁用右滑返回 | PageContainer 提供 `enableSwipeBack` prop |
| 现有页面改动量大 | 按清单逐个迁移，验证后进行下一个 |
