# 任务清单：预设标签与记录表单重构

## 功能概述
在系统中预设常用标签，在添加/编辑记录页面添加标签选择功能，并重构表单代码提高可维护性。

---

## 阶段 1：Setup - 依赖检查

- [X] T001 检查后端 seedDefaultTags 函数位置 `backend/internal/service/auth.go`，确认标签数据结构

---

## 阶段 2：[US1] 预设标签系统

**目标**: 在系统中预设 5 个常用标签

- [X] T002 [US1] 更新 `backend/internal/service/auth.go` 中的 `seedDefaultTags` 函数，添加 5 个预设标签：必须(#F44336)、可选(#2196F3)、紧急(#FF9800)、待办(#9C27B0)、常规(#607D8B)，设置 `is_system: true`

---

## 阶段 3：[US2] 标签选择组件

**目标**: 创建 TagSelector 组件，让用户可以在记录中选择标签

- [X] T003 [US2] 创建 `frontend/src/components/TagSelector.tsx` - 标签选择组件，接受 `tags`, `selectedTagIds`, `onChange` props，以网格形式展示可选标签，点击切换选中状态，选中标签以彩色圆角标签展示
- [X] T004 [US2] [P] 更新 `frontend/src/pages/TagPage.tsx` - 确保系统预设标签显示但不可编辑/删除（检查 is_system 逻辑）

---

## 阶段 4：[US3] 表单重构

**目标**: 将 AddRecordPage 和 EditRecordPage 的公共表单代码提取为 RecordForm 组件

- [X] T005 [US3] 创建 `frontend/src/components/RecordForm.tsx` - 可复用的记录表单组件，包含 type selector, amount, date, category, note, tag selector 等表单元素，接收 props 进行数据管理，暴露变更回调
- [X] T006 [US3] 更新 `frontend/src/pages/AddRecordPage.tsx` - 使用 RecordForm 组件替代现有表单代码，保留 AI 输入功能，添加标签选择功能
- [X] T007 [US3] 更新 `frontend/src/pages/EditRecordPage.tsx` - 使用 RecordForm 组件替代现有表单代码，加载已有标签数据，添加标签编辑功能

---

## 阶段 5：[US4] 首页标签显示

**目标**: 在记录列表中显示每条记录关联的标签

- [X] T008 [US4] 更新 `frontend/src/pages/HomePage.tsx` - 在记录卡片中显示关联的标签，以彩色圆角标签形式展示

---

## 验证清单

- [X] 预设标签添加到数据库 seed
- [X] TagSelector 组件创建完成
- [X] RecordForm 组件创建完成
- [X] AddRecordPage 使用新组件
- [X] EditRecordPage 使用新组件
- [X] HomePage 显示记录标签
- [X] 标签选择功能正常
- [X] 代码重构成功，无重复代码

---

## 依赖关系

```
Phase 1 (Setup)
    ↓
Phase 2 (US1) ← 预设标签数据
    ↓
Phase 3 (US2) ← TagSelector 组件
    ↓
Phase 4 (US3) ← RecordForm 重构
    ↓
Phase 5 (US4) ← HomePage 标签显示
```

## 并行执行机会

- **US2**: T003, T004 可并行
- **US3**: T005 → T006, T007（T006/T007 依赖 T005）
- **US4**: T008 独立，可在 T005 后并行

## 用户故事测试标准

**US1 预设标签**
- 新用户注册后自动获得 5 个预设标签
- 预设标签 is_system 为 true，不可删除

**US2 标签选择组件**
- TagSelector 正确显示所有标签
- 点击标签可切换选中状态
- 选中标签以彩色圆角标签展示

**US3 表单重构**
- AddRecordPage 和 EditRecordPage 使用 RecordForm 组件
- 代码量明显减少
- AI 输入功能在 AddRecordPage 中保留

**US4 首页标签显示**
- 记录卡片下方显示关联的标签
- 标签以彩色圆角标签展示
