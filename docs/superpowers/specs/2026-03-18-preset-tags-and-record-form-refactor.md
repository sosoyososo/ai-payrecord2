# 规格说明书：预设标签与记录表单重构

## 1. 概述

### 问题背景
1. **缺少标签选择功能**：后端已支持 `tag_ids` 关联标签，但前端添加/编辑页面没有标签选择 UI
2. **代码重复**：AddRecordPage 和 EditRecordPage 表单代码几乎完全相同

### 目标
- 在系统中预设常用标签（如"必须""可选""紧急"等）
- 在添加/编辑记录页面添加标签选择功能
- 重构表单代码，提高可维护性

---

## 2. 功能需求

### 2.1 预设标签系统

**当前状态**：已存在基础标签功能，用户可创建自定义标签

**新增功能**：添加预设系统标签

**预设标签（5个）**：
| 标签名 | 颜色 | 说明 |
|--------|------|------|
| 必须 | #F44336 | 必须支出的项目 |
| 可选 | #2196F3 | 可选支出 |
| 紧急 | #FF9800 | 紧急需要 |
| 待办 | #9C27B0 | 待确认事项 |
| 常规 | #607D8B | 常规支出 |

**特性**：
- 预设标签 `is_system: true`，不可删除
- 用户可在预设标签基础上创建自定义标签
- 标签可选择颜色

### 2.2 记录标签选择功能

**位置**：添加/编辑记录页面

**功能描述**：
- 记录可以有多个标签，也可以没有标签
- 标签以彩色圆角标签形式展示
- 点击标签区域展开标签选择器
- 已选标签以选中状态显示

**交互流程**：
1. 在分类下方显示"标签"区块
2. 点击展开显示所有可选标签（网格/列表）
3. 点击标签切换选中状态
4. 选中标签以彩色圆角标签显示

### 2.3 表单代码重构

**目标**：将 AddRecordPage 和 EditRecordPage 的公共表单代码提取为可复用组件

**共享组件**：
```tsx
// components/RecordForm.tsx
interface RecordFormProps {
  initialData?: Partial<RecordFormData>
  onSubmit: (data: RecordFormData) => Promise<void>
  isEditing?: boolean
}
```

**共享表单元素**：
- Type selector (expense/income)
- Amount input
- Date picker
- Category selector
- Note input
- **NEW**: Tag selector
- Submit button

---

## 3. 技术方案

### 3.1 预设标签数据

**后端**：在 `seedDefaultTags` 中添加预设标签

**文件**：`backend/internal/service/auth.go`

```go
// 现有预设标签
tags := []struct {
    Name  string
    Color string
}{
    {"必须", "#F44336"},
    {"可选", "#2196F3"},
    {"紧急", "#FF9800"},
    {"待办", "#9C27B0"},
    {"常规", "#607D8B"},
}
```

### 3.2 标签选择组件

**新增组件**：`frontend/src/components/TagSelector.tsx`

```tsx
interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: number[]
  onChange: (tagIds: number[]) => void
}
```

**功能**：
- 显示所有可用标签
- 点击切换选中状态
- 选中标签以彩色圆角标签展示

### 3.3 表单重构

**新增组件**：`frontend/src/components/RecordForm.tsx`

**Props**：
```tsx
interface RecordFormProps {
  type: 1 | 2  // expense or income
  onTypeChange: (type: 1 | 2) => void
  amount: string
  onAmountChange: (amount: string) => void
  date: string
  onDateChange: (date: string) => void
  categoryId: number
  onCategoryChange: (categoryId: number) => void
  tagIds: number[]
  onTagIdsChange: (tagIds: number[]) => void
  note: string
  onNoteChange: (note: string) => void
  categories: Category[]
  tags: Tag[]
  onSubmit: () => void
  isLoading: boolean
  isEditing?: boolean
}
```

---

## 4. 页面变更

### 4.1 AddRecordPage
- 集成 RecordForm 组件
- 保留 AI 输入功能（差异化部分）
- 添加标签选择功能

### 4.2 EditRecordPage
- 集成 RecordForm 组件
- 加载已有标签数据
- 添加标签编辑功能

### 4.3 TagPage
- 保持现有功能
- 可查看系统预设标签（不可编辑/删除）

---

## 5. 预期效果

### 5.1 用户体验
- 记录可关联多个标签
- 标签选择直观简便
- 表单代码更简洁

### 5.2 视觉效果
- 标签显示为彩色圆角标签
- 选中状态有明显区分
- 与现有 UI 风格一致

---

## 6. 非功能需求

- **性能**：标签数据本地缓存，减少 API 调用
- **兼容性**：支持 iOS/Android (Capacitor)
- **可维护性**：表单代码集中管理，修改一处即可
