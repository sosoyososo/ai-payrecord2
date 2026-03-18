# 实施计划：删除确认优化与分类图标支持

## 阶段一：安装 AlertDialog 组件

### 步骤 1.1：安装 shadcn/ui AlertDialog
- **文件**: `frontend/`
- **命令**: `cd frontend && npx shadcn@latest add alert-dialog`
- **验证**: 确认 `components/ui/alert-dialog.tsx` 存在

---

## 阶段二：创建删除确认对话框组件

### 步骤 2.1：创建 DeleteConfirmDialog 组件
- **文件**: `frontend/src/components/DeleteConfirmDialog.tsx`
- **内容**:
  - 接受 props: open, onOpenChange, onConfirm, title, description, confirmText, cancelText
  - 使用 AlertDialog 组件实现
  - 添加 destructive 按钮样式
  - 支持 loading 状态
- **依赖**: AlertDialog 组件

### 步骤 2.2：更新 HomePage 删除确认
- **文件**: `frontend/src/pages/HomePage.tsx`
- **修改**:
  - 导入 DeleteConfirmDialog
  - 添加 `deleteDialogOpen` state
  - 将 `window.confirm()` 替换为 DeleteConfirmDialog
  - 添加国际化文本 confirm.deleteRecord, confirm.deleteRecordDesc

### 步骤 2.3：更新 CategoryPage 删除确认
- **文件**: `frontend/src/pages/CategoryPage.tsx`
- **修改**: 类似步骤 2.2
- **国际化**: confirm.deleteCategory, confirm.deleteCategoryDesc

### 步骤 2.4：更新 TagPage 删除确认
- **文件**: `frontend/src/pages/TagPage.tsx`
- **修改**: 类似步骤 2.2
- **国际化**: confirm.deleteTag, confirm.deleteTagDesc

### 步骤 2.5：更新 LedgerPage 删除确认
- **文件**: `frontend/src/pages/LedgerPage.tsx`
- **修改**: 类似步骤 2.2
- **国际化**: confirm.deleteLedger, confirm.deleteLedgerDesc

---

## 阶段三：创建图标选择器组件

### 步骤 3.1：创建 IconPicker 组件
- **文件**: `frontend/src/components/IconPicker.tsx`
- **内容**:
  - 100 个预设 Lucide 图标网格展示
  - 搜索功能
  - 按分类筛选（餐饮、交通、购物等）
  - 已选中状态显示
  - 支持触屏滑动

### 步骤 3.2：创建 CategoryIcon 组件
- **文件**: `frontend/src/components/CategoryIcon.tsx`
- **内容**:
  - 接收 icon 名称和 color
  - 渲染 Lucide 图标
  - 圆形背景 + 图标样式

---

## 阶段四：更新分类页面

### 步骤 4.1：更新 CategoryPage 添加图标选择
- **文件**: `frontend/src/pages/CategoryPage.tsx`
- **修改**:
  - 在添加/编辑分类弹窗中添加 IconPicker
  - 预设分类使用指定图标
  - 用户自定义分类可选择图标

### 步骤 4.2：更新类型定义
- **文件**: `frontend/src/types/index.ts`
- **内容**: 确认 Category.icon 类型为 string

---

## 阶段五：预设分类数据更新

### 步骤 5.1：更新数据库预设分类图标
- **文件**: `backend/` (Golang seed 数据)
- **内容**: 为预设分类设置正确的图标名称
- **注意**: 需要运行数据库迁移或 seed 脚本

### 步骤 5.2：更新前端预设分类数据
- **文件**: `frontend/src/pages/CategoryPage.tsx`
- **内容**: 定义预设分类及其图标映射

---

## 阶段六：国际化文本

### 步骤 6.1：添加国际化文本
- **文件**: `frontend/src/i18n/locales/zh.json`
- **文件**: `frontend/src/i18n/locales/en.json`
- **内容**:
  - confirm.delete*, confirm.cancel, confirm.delete (按钮文字)
  - category.selectIcon (图标选择标题)
  - category.iconSearch (搜索 placeholder)

---

## 验证清单

- [ ] AlertDialog 组件安装成功
- [ ] DeleteConfirmDialog 可复用组件创建
- [ ] HomePage 删除记录使用新对话框
- [ ] CategoryPage 删除分类使用新对话框
- [ ] TagPage 删除标签使用新对话框
- [ ] LedgerPage 删除账本使用新对话框
- [ ] IconPicker 组件可选择 100 个图标
- [ ] CategoryIcon 组件正确显示图标
- [ ] 预设分类显示对应图标
- [ ] 用户自定义分类可选择图标
- [ ] 国际化文本完整
- [ ] UI 交互流畅
