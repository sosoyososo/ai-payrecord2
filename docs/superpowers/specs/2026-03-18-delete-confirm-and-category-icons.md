# 规格说明书：删除确认优化与分类图标支持

## 1. 概述

### 问题背景
1. **删除确认**：当前使用浏览器原生 `window.confirm()`，样式简陋，影响用户体验
2. **分类图标**：现有分类系统只有字母和背景色，缺少图标支持，需要为预设分类和用户自定义分类提供图标选择

### 目标
- 将删除确认替换为 shadcn/ui AlertDialog 组件，提供更好的 UX
- 为预设分类添加图标，为用户自定义分类提供图标库选择

---

## 2. 功能需求

### 2.1 删除确认对话框优化

**当前行为：**
- 使用 `window.confirm()` 浏览器原生对话框
- 位置：`HomePage.tsx`, `CategoryPage.tsx`, `TagPage.tsx`, `LedgerPage.tsx`

**期望行为：**
- 使用 shadcn/ui AlertDialog 组件
- 统一风格，与应用设计语言一致
- 支持国际化文本

**涉及文件：**
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/CategoryPage.tsx`
- `frontend/src/pages/TagPage.tsx`
- `frontend/src/pages/LedgerPage.tsx`

### 2.2 分类图标系统

#### 2.2.1 图标来源选择

**推荐方案：Lucide React**
- 理由：
  - 已集成到项目中（用于 UI 图标如 Trash2, Pencil, Plus）
  - 账本常用图标丰富（food, car, home, shopping-cart 等）
  - 树摇优化，包体积小
  - 维护活跃，图标风格统一

#### 2.2.2 预设分类图标

**预设支出分类（10个）：**
| 分类名 | 图标 | 说明 |
|--------|------|------|
| 餐饮 | Utensils | 餐厅、食物 |
| 交通 | Car | 出行、加油 |
| 购物 | ShoppingBag | 消费、网购 |
| 居住 | Home | 房租、水电 |
| 娱乐 | Gamepad2 | 游戏、娱乐 |
| 医疗 | HeartPulse | 医疗、健康 |
| 教育 | GraduationCap | 学习、书籍 |
| 通讯 | Smartphone | 手机话费 |
| 旅行 | Plane | 出行、旅游 |
| 其他 | MoreHorizontal | 杂项 |

**预设收入分类（5个）：**
| 分类名 | 图标 | 说明 |
|--------|------|------|
| 工资 | Briefcase | 工作收入 |
| 奖金 | Gift | 奖金、奖励 |
| 投资 | TrendingUp | 理财、投资 |
| 兑换 | Repeat | 兑换、转账 |
| 其他 | MoreHorizontal | 杂项 |

#### 2.2.3 用户自定义分类图标库

**推荐：预设 100 个常用账本图标**

**图标分类清单：**

**餐饮类 (15个)**
Utensils, Coffee, Pizza, IceCream, Cake, Beer, Wine, Sandwich, Apple, Cookie, ChefHat, UtensilsCrossed, GlassWater, BowlRice, Soup

**交通类 (10个)**
Car, Bus, Train, Plane, Bike, Ship, Truck, Fuel, Gauge, Navigation

**购物类 (10个)**
ShoppingBag, ShoppingCart, CreditCard, Gift, Package, Store, Tag, Percent, Ticket, Wallet

**居住类 (10个)**
Home, Lamp, Sofa, Bed, Bath, WashingMachine, Refrigerator, Microwave, Flame, Plug

**娱乐类 (10个)**
Gamepad2, Music, Film, Tv, BookOpen, Newspaper, Camera, Images, Headphones, Mic

**健康类 (8个)**
HeartPulse, Stethoscope, Pill, Syringe, Thermometer, Activity, Wind, Eye

**教育类 (8个)**
GraduationCap, Book, Lightbulb, Pen, Ruler, Calculator, Globe, Languages

**通讯类 (5个)**
Smartphone, Mail, Phone, MessageCircle, Signal

**金融类 (8个)**
TrendingUp, TrendingDown, DollarSign, Euro, Bitcoin, Landmark, Receipt, PiggyBank

**生活类 (8个)**
MoreHorizontal, MoreVertical, Smile, Sun, Moon, Cloud, Umbrella, Leaf

**服饰类 (4个)**
Shirt, Watch, Gem, Crown

**宠物类 (4个)**
Dog, Cat, Bird, Fish

---

## 3. 技术方案

### 3.1 AlertDialog 组件安装

```bash
cd frontend
npx shadcn@latest add alert-dialog
```

### 3.2 删除确认重构

**创建统一的可复用删除确认组件：**
```tsx
// components/DeleteConfirmDialog.tsx
interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
}
```

**使用方式：**
```tsx
<DeleteConfirmDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onConfirm={handleDelete}
  title={t('confirm.deleteRecord')}
  description={t('confirm.deleteRecordDesc')}
/>
```

### 3.3 分类图标系统

**数据库变更：**
- `Category.icon` 字段用途改变：从存储单字符变为存储 Lucide 图标名称（如 "Utensils"）

**前端变更：**
1. 创建 `IconPicker` 组件用于选择图标
2. 创建 `CategoryIcon` 组件用于展示分类图标
3. 修改 `CategoryPage.tsx` 添加图标选择功能

---

## 4. 国际化文本

需要新增以下翻译键：
```json
{
  "confirm": {
    "deleteRecord": "确定删除这条记录吗？",
    "deleteRecordDesc": "此操作无法撤销。",
    "deleteCategory": "确定删除这个分类吗？",
    "deleteCategoryDesc": "此操作无法撤销。",
    "deleteTag": "确定删除这个标签吗？",
    "deleteTagDesc": "此操作无法撤销。",
    "deleteLedger": "确定删除这个账本吗？",
    "deleteLedgerDesc": "此操作无法撤销。",
    "cancel": "取消",
    "delete": "删除"
  }
}
```

---

## 5. 预期效果

### 删除确认
- 美观的 AlertDialog 弹窗
- 与应用风格统一
- 支持按钮 loading 状态

### 分类图标
- 预设分类显示对应图标
- 用户可从 100 个图标中选择自定义分类图标
- 图标与颜色组合展示

---

## 6. 非功能需求

- 性能：图标使用 Lucide 树摇，不影响包体积
- 兼容性：支持 iOS/Android (Capacitor)
- 国际化：支持中英文
