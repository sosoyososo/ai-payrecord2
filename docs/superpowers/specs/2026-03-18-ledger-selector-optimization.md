# 账本切换组件优化设计方案

**Created**: 2026-03-18
**Status**: Draft

## 概述

统一并优化账本切换组件，提升用户体验

---

## 1. 创建 LedgerSelector 组件

### 实现方式
新建 `frontend/src/components/LedgerSelector.tsx`，使用 shadcn/ui Select 组件：

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LedgerSelectorProps {
  ledgers: Ledger[]
  currentLedger: Ledger | null
  onChange: (ledgerId: number) => void
}

export function LedgerSelector({ ledgers, currentLedger, onChange }: LedgerSelectorProps) {
  return (
    <Select value={String(currentLedger?.id)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择账本" />
      </SelectTrigger>
      <SelectContent>
        {ledgers.map((ledger) => (
          <SelectItem key={ledger.id} value={String(ledger.id)}>
            {ledger.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

---

## 2. 安装 shadcn/ui Select 组件

```bash
npx shadcn@latest add select
```

---

## 3. 统一 HomePage 和 StatsPage

### HomePage
- 移除原生 `<select>` 元素
- 使用 `<LedgerSelector>` 组件替换

### StatsPage
- 移除按钮组实现
- 使用 `<LedgerSelector>` 组件替换

---

## 4. 动画效果

- shadcn/ui Select 自带动画
- 选中状态过渡效果

---

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| frontend/src/components/ui/select.tsx | 新建 (shadcn/ui) |
| frontend/src/components/LedgerSelector.tsx | 新建 |
| frontend/src/pages/HomePage.tsx | 使用 LedgerSelector |
| frontend/src/pages/StatsPage.tsx | 使用 LedgerSelector |

---

## 验收标准

1. 两个页面使用统一的账本选择器
2. 组件样式美观，支持选中状态动画
3. 功能与原来一致（切换账本）
4. 构建无错误
