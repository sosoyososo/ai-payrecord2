# LLM Prompt 优化：日期/时间与标签提取

## 背景

DeepSeek API Key 已配置，LLM 路径已可用。但当前 prompt 存在三个核心缺陷：

1. **日期编造**：prompt 未注入当前日期，LLM 随意返回 2023-01-01 等虚假日期
2. **时间丢失**：未指导 LLM 提取"下午3点"、"14:30"等时间信息
3. **标签质量差**：无标签定义，LLM 输出不稳定

## 改动范围

仅修改 `backend/internal/service/llm_client.go` 中的 `ParseWithLLM` 方法的 prompt 构建逻辑。

## 核心变化

### 1. 注入当前日期上下文

```go
fmt.Sprintf("当前日期: %s (%s)", time.Now().Format("2006-01-02"), time.Now().Weekday().String())
```

### 2. 日期格式升级

从 `YYYY-MM-DD` 改为完整 ISO8601：`YYYY-MM-DDTHH:mm:ss+08:00`

### 3. 标签明确定义

标签是有意义的实体词：商家名（永辉、星巴克）、地点（机场、北京）、用途（报销、礼物）、品类（书籍、日用品）。不重复分类名，不含金额数字。

### 4. 增加 Few-shot 示例

三个示例覆盖：
- 时间提取 + 标签（昨天下午3点吃饭 → 报销）
- 相对日期 + 商家标签（3天前京东买书 → 京东、书籍）
- X块Y毛Z分 + 新分类建议（永辉日用品136块3毛6 → 日用）

## Prompt 结构

```
系统提示 + 当前日期 + 用户分类列表 + 提取规则 + 输出格式 + 示例
```

## 不做

- 不改规则引擎 fallback（`llm.go`）
- 不改前端代码
- 不改后端 handler

## 实现文件

| 文件 | 改动 |
|------|------|
| `backend/internal/service/llm_client.go` | `ParseWithLLM` 方法的 prompt 构建逻辑 |
