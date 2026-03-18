# 任务清单：删除确认优化与分类图标支持

## 功能概述
将浏览器原生 `window.confirm()` 替换为 shadcn/ui AlertDialog，并为预设分类和用户自定义分类添加 Lucide 图标支持。

---

## 阶段 1：Setup - 依赖安装

- [X] T001 安装 shadcn/ui AlertDialog 组件 `cd frontend && npx shadcn@latest add alert-dialog` 并验证 `frontend/src/components/ui/alert-dialog.tsx` 存在

---

## 阶段 2：Foundational - 通用组件与配置

- [X] T002 创建 `frontend/src/components/DeleteConfirmDialog.tsx` - 可复用的删除确认对话框组件，接受 open, onOpenChange, onConfirm, title, description, confirmText, cancelText props，使用 AlertDialog 实现，destructive 按钮样式，支持 loading 状态
- [X] T003 创建 `frontend/src/components/CategoryIcon.tsx` - 分类图标展示组件，接收 icon 名称和 color，渲染 Lucide 图标，圆形背景样式
- [X] T004 创建 `frontend/src/components/IconPicker.tsx` - 图标选择器组件，100 个预设 Lucide 图标网格展示，支持搜索和分类筛选（餐饮/交通/购物/居住/娱乐/健康/教育/通讯/金融/生活/服饰/宠物），已选中状态，支持触屏滑动
- [X] T005 [P] 添加国际化文本到 `frontend/src/i18n/locales/zh.json` 和 `frontend/src/i18n/locales/en.json` - confirm.deleteRecord, confirm.deleteRecordDesc, confirm.deleteCategory, confirm.deleteCategoryDesc, confirm.deleteTag, confirm.deleteTagDesc, confirm.deleteLedger, confirm.deleteLedgerDesc, confirm.cancel, confirm.delete, category.selectIcon, category.iconSearch

---

## 阶段 3：[US1] 删除确认对话框优化

**目标**: 替换所有 `window.confirm()` 为 AlertDialog 组件

- [X] T006 [US1] 更新 `frontend/src/pages/HomePage.tsx` - 导入 DeleteConfirmDialog，添加 deleteDialogOpen state 和待删除 ID state，将 `window.confirm()` 替换为 DeleteConfirmDialog，传入 confirm.deleteRecord 相关文本
- [X] T007 [US1] 更新 `frontend/src/pages/CategoryPage.tsx` - 类似 T006，使用 confirm.deleteCategory 相关文本
- [X] T008 [US1] 更新 `frontend/src/pages/TagPage.tsx` - 类似 T006，使用 confirm.deleteTag 相关文本
- [X] T009 [US1] 更新 `frontend/src/pages/LedgerPage.tsx` - 类似 T006，使用 confirm.deleteLedger 相关文本

---

## 阶段 4：[US2] 分类图标系统

**目标**: 为预设分类添加图标，为用户自定义分类提供图标选择

- [X] T010 [US2] 定义预设分类数据在 `frontend/src/pages/CategoryPage.tsx` - 支出分类（餐饮-Utensils, 交通-Car, 购物-ShoppingBag, 居住-Home, 娱乐-Gamepad2, 医疗-HeartPulse, 教育-GraduationCap, 通讯-Smartphone, 旅行-Plane, 其他-MoreHorizontal）和收入分类（工资-Briefcase, 奖金-Gift, 投资-TrendingUp, 兑换-Repeat, 其他-MoreHorizontal）
- [X] T011 [US2] 更新 `frontend/src/pages/CategoryPage.tsx` 添加图标选择功能 - 在添加/编辑分类弹窗中集成 IconPicker，用户可从 100 个图标中选择预设分类图标，预设分类使用指定图标不可更改
- [X] T012 [US2] 更新后端预设分类数据 - 修改 Go seed 数据为预设分类设置正确的图标名称（对应上述预设图标映射）
- [X] T013 [US2] 更新 `frontend/src/types/index.ts` - 确认 Category.icon 类型为 string

---

## 验证清单

- [X] AlertDialog 组件安装成功
- [X] DeleteConfirmDialog 可复用组件创建
- [X] CategoryIcon 组件正确显示图标
- [X] IconPicker 组件可选择 100 个图标
- [X] HomePage 删除记录使用新对话框
- [X] CategoryPage 删除分类使用新对话框
- [X] TagPage 删除标签使用新对话框
- [X] LedgerPage 删除账本使用新对话框
- [X] 预设分类显示对应图标
- [X] 用户自定义分类可选择图标
- [X] 国际化文本完整
- [X] UI 交互流畅

---

## 依赖关系

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← T002, T003, T004, T005 可并行
    ↓
Phase 3 (US1) ← T006, T007, T008, T009 可并行
    ↓
Phase 4 (US2) ← T010, T011, T012, T013 有顺序依赖
```

## 并行执行机会

- **Phase 2**: T002, T003, T004 可并行（T005 需等 Foundational 组件完成）
- **Phase 3**: T006, T007, T008, T009 可并行（都依赖 T002）
- **Phase 4**: T010, T012 可并行（T011 依赖 T010，T013 依赖 T004）

## 用户故事测试标准

**US1 删除确认对话框**
- 触发删除操作时显示 AlertDialog 而非浏览器 confirm
- 对话框显示正确的标题和描述文本
- 点击取消关闭对话框不执行删除
- 点击删除执行删除操作

**US2 分类图标**
- 预设分类显示对应 Lucide 图标
- 用户自定义分类可打开 IconPicker
- 搜索图标名称可过滤图标
- 选择图标后分类显示新图标
