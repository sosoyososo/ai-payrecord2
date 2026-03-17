# 账本 App 前端实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan.

**Goal:** 实现账本 App 前端应用 (React + Capacitor + Tailwind + shadcn/ui)

**Architecture:** 采用组件化架构 - 页面组件 + 业务组件 + UI 组件

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Capacitor, React Query, React Router

---

## UI/UX 设计方向

### 整体风格
- **主色调**: 温暖的中性色 + 柔和的强调色
- **字体**: 选择有特色的衬线字体作为标题，无衬线字体作为正文
- **布局**: 移动优先，卡片式设计
- **动效**: 页面切换平滑过渡，列表项有轻微交错动画

### 颜色方案
- 主色: #1a1a2e (深蓝黑)
- 背景: #fafafa (暖白)
- 强调色: #e94560 (珊瑚红)
- 成功: #4ade80 (绿色)
- 文字: #333333 (深灰)

### 页面结构
1. 登录/注册页
2. 首页 (记录列表 + 汇总)
3. 添加记录页
4. 统计页
5. 账本管理页
6. 分类/标签管理页
7. 设置页

---

## 项目结构

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui 组件
│   │   ├── common/       # 通用组件
│   │   ├── forms/        # 表单组件
│   │   └── layouts/     # 布局组件
│   ├── pages/            # 页面组件
│   ├── hooks/           # 自定义 hooks
│   ├── services/        # API 服务
│   ├── stores/          # 状态管理
│   ├── types/           # TypeScript 类型
│   ├── utils/           # 工具函数
│   └── styles/          # 全局样式
├── public/
├── capacitor.config.ts
└── package.json
```

---

## 实现步骤

### Phase 1: 项目初始化
- [ ] 1.1 创建 React + TypeScript 项目 (Vite)
- [ ] 1.2 配置 Tailwind CSS
- [ ] 1.3 安装 shadcn/ui
- [ ] 1.4 配置 Capacitor
- [ ] 1.5 配置 React Router

### Phase 2: 基础架构
- [ ] 2.1 创建 API 服务层
- [ ] 2.2 创建认证 Context
- [ ] 2.3 创建全局状态管理
- [ ] 2.4 创建布局组件 (Header, TabBar)

### Phase 3: 核心页面
- [ ] 3.1 登录/注册页
- [ ] 3.2 首页 (记录列表 + 本月汇总)
- [ ] 3.3 添加/编辑记录页
- [ ] 3.4 统计页 (图表)

### Phase 4: 管理功能
- [ ] 4.1 账本管理
- [ ] 4.2 分类管理
- [ ] 4.3 标签管理

### Phase 5: 优化
- [ ] 5.1 添加动效
- [ ] 5.2 优化性能
- [ ] 5.3 构建 iOS/Android

---

## 验收标准

1. 用户可以注册/登录
2. 用户可以查看记账记录列表
3. 用户可以添加/编辑/删除记录
4. 用户可以查看月度统计
5. 用户可以管理多个账本
6. 用户可以管理分类和标签
7. App 可以在移动端正常运行

---

## 依赖包

- react, react-dom
- react-router-dom
- @tanstack/react-query
- axios
- tailwindcss
- shadcn-ui
- @radix-ui/react-*
- lucide-react
- recharts
- date-fns
- react-hook-form
- zod
- @capacitor/core
- @capacitor/android
- @capacitor/ios
