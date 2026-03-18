# 实施计划：预设标签与记录表单重构

## 阶段一：预设标签数据

### 步骤 1.1：更新后端预设标签
- **文件**: `backend/internal/service/auth.go`
- **修改**: 在 `seedDefaultTags` 中添加 5 个预设标签（必须、紧急等）
- **注意**: 预设标签 `is_system: true`

---

## 阶段二：创建 TagSelector 组件

### 步骤 2.1：创建 TagSelector 组件
- **文件**: `frontend/src/components/TagSelector.tsx`
- **内容**:
  - 接收 `tags`, `selectedTagIds`, `onChange` props
  - 以网格形式展示可选标签
  - 点击标签切换选中状态
  - 已选标签以彩色圆角标签形式展示

---

## 阶段三：重构 RecordForm 组件

### 步骤 3.1：创建 RecordForm 组件
- **文件**: `frontend/src/components/RecordForm.tsx`
- **内容**:
  - 共享表单元素：type selector, amount, date, category, note, tag selector
  - 接收 props 进行数据管理
  - 暴露变更回调

### 步骤 3.2：更新 AddRecordPage
- **文件**: `frontend/src/pages/AddRecordPage.tsx`
- **修改**:
  - 使用 RecordForm 组件
  - 保留 AI 输入功能
  - 添加标签选择功能

### 步骤 3.3：更新 EditRecordPage
- **文件**: `frontend/src/pages/EditRecordPage.tsx`
- **修改**:
  - 使用 RecordForm 组件
  - 加载已有标签数据
  - 添加标签编辑功能

---

## 阶段四：更新 HomePage 标签显示

### 步骤 4.1：更新记录卡片标签展示
- **文件**: `frontend/src/pages/HomePage.tsx`
- **修改**:
  - 记录卡片中显示关联的标签
  - 以彩色圆角标签形式展示

---

## 验证清单

- [ ] 预设标签添加到数据库 seed
- [ ] TagSelector 组件创建完成
- [ ] RecordForm 组件创建完成
- [ ] AddRecordPage 使用新组件
- [ ] EditRecordPage 使用新组件
- [ ] HomePage 显示记录标签
- [ ] 标签选择功能正常
- [ ] 代码重构成功，无重复代码
