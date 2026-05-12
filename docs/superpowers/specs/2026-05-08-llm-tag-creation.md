# LLM 标签提取：已有标签传入 + 新建标签标识

## 背景

目前 LLM prompt 只传入了已有分类，没有传入已有标签。LLM 提取的标签如果不在已有列表中，前端直接静默丢弃。需要与分类逻辑保持一致：传入已有标签列表、优先匹配已有、新建标签可标识和创建。

## 改动范围

| 文件 | 改动 |
|------|------|
| `backend/internal/service/llm_client.go` | 新增 `GetUserTags`，prompt 注入标签列表 + 新规则 |
| `backend/internal/service/llm.go` | `LLMParsedRecord` 增加 `NewTags` 字段 |
| `frontend/src/pages/AddRecordPage.tsx` | 处理 `new_tags` + 新建标签 UI |

## 后端设计

### 1. Prompt 注入已有标签

```go
// 获取已有标签
tags, _ := c.GetUserTags(userID)

var tagContext strings.Builder
tagContext.WriteString("用户已有的标签:\n")
for _, t := range tags {
    tagContext.WriteString(fmt.Sprintf("- ID:%d %s\n", t.ID, t.Name))
}
```

Prompt 中标签规则更新：

```
### 标签
- 标签是有意义的实体词：商家名（永辉、星巴克）、地点（机场、北京）、用途（报销、礼物）、品类（书籍、日用品）等
- 优先使用已有标签（根据上面的用户标签列表匹配）
- 如果提取的标签不在已有列表中，放入 new_tags 数组
- 不要重复分类名作为标签
- 不要包含金额、数字
- 如果无法提取有意义的标签，返回空数组
```

输出格式更新：

```json
{
  "tags": ["标签1", "标签2"],
  "new_tags": ["新标签1", "新标签2"]
}
```

### 2. LLMParsedRecord 增加字段

```go
type LLMParsedRecord struct {
    // ... 现有字段不变
    Tags     []string `json:"tags"`
    NewTags  []string `json:"new_tags,omitempty"`
}
```

### 3. Few-shot 示例更新

在第三个示例（永辉日用品）中添加 `new_tags` 展示：

```json
{
  "amount": 136.36,
  "category_id": 0,
  "category_name": "日用",
  "tags": ["永辉", "日用品"],
  "new_tags": ["永辉", "日用品"],
  "new_category_name": "日用"
}
```

## 前端设计

### 设计约束

必须遵循 APP 现有设计风格：

| 元素 | 现有样式 | 参考 |
|------|---------|------|
| 标签 pill | `rounded-full` + 背景色 + 白色文字 | `TagSelector.tsx:38-44` |
| 新建分类条 | `bg-primary/10 rounded-lg` Card + `size="sm" variant="outline"` Button | `AddRecordPage.tsx:181-215` |
| 建议分类区 | `bg-primary/5 rounded-lg` Card + 多列 pill 按钮 | `AddRecordPage.tsx:218-253` |
| 按钮 | shadcn/ui `Button`（variant: outline/ghost, size: sm） | `button.tsx` |
| 卡片 | shadcn/ui `Card` + `CardContent` + `rounded-lg border bg-card shadow-sm` | `card.tsx` |

### 交互流程

```
用户输入 → 点击 AI 解析 → 后端返回结构化数据
                              ↓
              分类 category_id=0? → 显示新建分类条
                              ↓
              标签 new_tags[] 不为空? → 显示新建标签区
                              ↓
              表单自动填充已有数据
```

### UI 布局

AI 输入框下方，按顺序排列：

```
┌──────────────────────────────────────┐
│ [AI 输入框................] [✨]      │
├──────────────────────────────────────┤
│ ┌─ New items ──────────────────────┐ │
│ │                                   │ │
│ │  New category: "日用" [Create][x] │ │
│ │                                   │ │
│ │  New tags:                        │ │
│ │  [永辉]  [日用品]                  │ │
│ │  (tap to create & select)         │ │
│ │                                   │ │
│ └───────────────────────────────────┘ │
├──────────────────────────────────────┤
│ [RecordForm 表单...]                  │
└──────────────────────────────────────┘
```

### 状态管理

```typescript
// 新增状态
const [newTags, setNewTags] = useState<string[]>([])

// AI 解析后处理
const handleAiParse = async () => {
  // ... 现有逻辑
  
  // 处理已有标签匹配
  if (data.tags) {
    const matchedTagIds = tags
      .filter(t => data.tags.includes(t.name))
      .map(t => t.id)
    setTagIds(matchedTagIds)
  }
  
  // 处理新建标签
  if (data.new_tags && data.new_tags.length > 0) {
    setNewTags(data.new_tags)
  }
}
```

### 新建标签 UI 组件

在新建分类条（`newCategoryName`）下方，用 Card 包裹标签区。新建标签 pill 设计遵循 `TagSelector` 的 `rounded-full` 样式，但增加 `+` 前缀和 `variant="outline"` 以区分已创建的标签：

```tsx
{newTags.length > 0 && (
  <div className="mt-3 p-3 bg-primary/5 rounded-lg">
    <div className="text-sm text-muted-foreground mb-2">New tags:</div>
    <div className="flex flex-wrap gap-2">
      {newTags.map((tagName) => (
        <button
          key={tagName}
          type="button"
          onClick={async () => {
            try {
              const res = await tagApi.create({ name: tagName })
              const newTag = res.data.data
              setTags(prev => [...prev, newTag])
              setTagIds(prev => [...prev, newTag.id])
              setNewTags(prev => prev.filter(t => t !== tagName))
            } catch (error) {
              console.error('Failed to create tag:', error)
            }
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border border-input bg-background hover:bg-accent transition-colors"
        >
          <span>+</span>
          <span>{tagName}</span>
        </button>
      ))}
    </div>
  </div>
)}
```

样式说明：
- `rounded-full` — 与 `TagSelector` 标签 pill 风格一致
- `border border-input bg-background` — 可点击态，区别于已选中的实色标签
- `hover:bg-accent` — 悬停反馈
- `gap-2` flex 布局自动换行

### 交互细节

- **点击标签 pill** → 调用 API 创建标签 → 更新本地 tags 列表 → 选中该标签（加入 tagIds）→ 从 newTags 中移除
- **所有 newTags 处理完后** → 该区域自动消失
- **分类和标签互不阻塞** → 分类 Create 按钮和标签 pill 各自独立，可任意顺序操作
- **清除逻辑**（`handleAiInputChange` 重置输入） → 同时清空 `newTags`

### 实现时的 Skill 使用

| 阶段 | Skill | 用途 |
|------|-------|------|
| 前端实现 | `/frontend-design` | 优化新建标签 pill 的视觉细节、hover 状态、间距、对齐，确保与 `TagSelector` 风格统一 |
| 前端实现 | `/ui-ux-pro-max` | 确保交互流程符合移动端最佳实践（触摸区域大小、反馈、可访问性） |

## 不做

- 不改动 RecordForm 组件
- 不改动规则引擎 fallback（`llm.go`）
- 不改动 i18n 翻译（暂用英文标签）
- 不改动 LLM 确认记录流程（`ConfirmRecord`）

## 实现顺序

1. 后端：`llm_client.go` — 注入标签 + 更新 prompt
2. 后端：`llm.go` — 添加 NewTags 字段
3. 构建验证
4. 后端重启 + API 测试
5. 前端：`AddRecordPage.tsx` — 处理 new_tags + UI
6. 端到端验证
