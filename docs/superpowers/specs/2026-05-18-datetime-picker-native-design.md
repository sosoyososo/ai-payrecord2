# Native DateTimePicker 替代 datetime-local 设计

## 问题

`RecordForm.tsx` 中使用 `<Input type="datetime-local">`，在真机上出现宽度溢出 container 的问题。`datetime-local` 内部结构（日期段 + 时间段）在不同设备/OS 上渲染宽度不一致，CSS 无法完全约束。

## 方案

用 `@capacitor-community/date-picker` (v7.1.0) 原生插件替代 `datetime-local` input。

- 显示区域改为可点击的只读文本，点击触发原生选择器
- iOS/Android/Web 三端一致的原生体验
- 彻底消除 CSS 布局问题

## 组件改动

### RecordForm.tsx

- 移除 `<Input type="datetime-local">`
- 替换为可点击显示框：展示当前 `date` 格式化后的可读文本（如 "2026-05-18 14:30"）
- 点击调用 `DatePicker.present({ mode: 'dateAndTime', date, format })`
- `onDateChange` 接口不变，插件返回的 `value` 直接传入

### AddRecordPage.tsx

- 移除 `convertToDateTimeLocal` 辅助函数（不再需要 `datetime-local` 格式转换）
- `date` state 和 `onDateChange` 保持原样

## 数据流

```
用户点击日期区域 → DatePicker.present({ mode: 'dateAndTime', date, format })
  → 原生选择器弹出 → 用户选择日期时间
  → 返回 { value: '2026-05-18T14:30:00.000Z' }
  → onDateChange(value) → setDate(value)
```

插件配置：
- `mode: 'dateAndTime'`（默认）
- `format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"`（ISO8601，与后端接口一致）
- `date`: 传入当前选中的日期作为初始值

## 错误处理

- 插件在 Web 端提供 fallback 支持
- `present()` 返回 Promise，用户取消不调用 `onDateChange`
- 无需额外 try-catch，插件内部已处理

## 文件清单

| 文件 | 操作 |
|------|------|
| `frontend/package.json` | 添加 `@capacitor-community/date-picker` 依赖 |
| `frontend/src/components/RecordForm.tsx` | 替换 datetime-local input 为原生 picker 触发按钮 |
| `frontend/src/pages/AddRecordPage.tsx` | 移除 `convertToDateTimeLocal` |

## 依赖

- `@capacitor-community/date-picker@^7.1.0`
- 安装后需执行 `npx cap sync`
