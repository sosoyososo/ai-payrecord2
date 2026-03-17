# 账本 App UI/UX 设计规范

## 1. 设计原则

### 1.1 移动优先 (Mobile-First)
- **核心目标**: iOS 和 Android 原生体验
- **设计思路**:
  - 拇指易触达区域（屏幕下半部分）
  - 简洁的导航结构
  - 减少输入操作

### 1.2 平台适配

#### iOS 设计规范
- **导航**: 使用 iOS 标准导航栏（顶部）
- **手势**: 支持左滑返回
- **图标**: 使用 SF Symbols 或等效风格
- **字体**: 使用系统字体 (San Francisco)
- **安全区域**: 适配刘海屏和 Home 指示器

#### Android 设计规范
- **导航**: 使用 Material Design 3 组件
- **手势**: 支持返回手势
- **图标**: 使用 Material Icons
- **字体**: 使用 Roboto
- **状态栏**: 适配深色/浅色模式

### 1.3 设计风格
- **整体风格**: 简洁、现代、功能导向
- **视觉层次**: 通过颜色对比、间距、文字大小区分
- **动效**: 适度使用微动画提升体验，避免过度

---

## 2. 颜色系统

### 2.1 主色调 (Primary)
```css
--primary: #3B82F6 (蓝色)
/* 用于主要按钮、选中状态、强调文字 */
```

### 2.2 功能色
```css
--success: #10B981 (绿色)
/* 收入、确认、成功状态 */

--danger: #EF4444 (红色)
/* 支出、删除、错误状态 */

--warning: #F59E0B (黄色)
/* 警告、预算提醒 */
```

### 2.3 中性色
```css
--background: #F8FAFC (浅灰背景)
--surface: #FFFFFF (卡片/浮层)
--text-primary: #1E293B (主要文字)
--text-secondary: #64748B (次要文字)
--border: #E2E8F0 (边框/分割线)
```

---

## 3. 布局规范

### 3.1 移动端布局
```css
/* 最大内容宽度 */
max-width: 480px;

/* 内边距 */
padding: 16px;  /* px-4 */

/* 组件间距 */
gap: 8px;     /* gap-2 */
gap: 12px;     /* gap-3 */
gap: 16px;     /* gap-4 */
```

### 3.2 页面结构
```
┌─────────────────────┐
│ Header (sticky)    │  h: 56px
├─────────────────────┤
│                    │
│ Content            │  flex-1, scroll
│                    │
├─────────────────────┤
│ FAB (可选)         │  右下角固定
└─────────────────────┘
```

### 3.3 导航
- **移动端**: 底部无（当前是顶部导航+悬浮菜单）
- **待优化**: 考虑 iOS Tab Bar 风格

---

## 4. 组件规范

### 4.1 按钮 (Button)
```css
/* 主要按钮 */
class: "bg-primary text-white"

/* 次要按钮 */
class: "border border-input bg-background"

/* 危险按钮 */
class: "bg-red-500 text-white"
```

### 4.2 卡片 (Card)
```css
class: "rounded-lg border bg-card text-card-foreground shadow-sm"
```

### 4.3 输入框 (Input)
```css
class: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
```

### 4.4 列表项
```css
class: "flex items-center justify-between p-3 border-b"
```

---

## 5. 待优化项

### 5.1 现有设计问题
1. **首页顶部**: 当前使用渐变背景，可能在不同设备显示不一致
2. **导航菜单**: 使用 hover 触达，移动端体验不佳
3. **FAB 位置**: 固定右下角，可能遮挡内容
4. **Ledger 切换**: 横向滚动按钮，屏幕较窄时体验差

### 5.2 优化建议
1. 统一使用 shadcn/ui 组件
2. 优化移动端手势交互
3. 添加骨架屏 (Skeleton) 加载状态
4. 考虑 Pull-to-Refresh 下拉刷新

---

## 6. 设计资源

### 6.1 依赖库
- **shadcn/ui**: 组件库
- **Tailwind CSS**: 样式
- **Recharts**: 图表
- **Lucide React**: 图标

### 6.2 设计工具
- Figma (如有需要创建设计稿)
- 浏览器开发者工具调试

---

## 7. UI 优化工作流

### 7.1 优化流程
```
1. 评估现有设计 → 识别问题
2. 参考设计规范 → 提出方案
3. 使用 /ui-ux-pro-max 或 /frontend-design → 创建/优化组件
4. 实现代码 → 使用现有组件
5. 测试验证 → iOS Safari / Android Chrome
```

### 7.2 优先级
1. **P0**: 功能性 bug (交互无响应)
2. **P1**: 体验问题 (手势不适配)
3. **P2**: 视觉优化 (颜色/间距)
4. **P3**: 动效增强 (微交互)
