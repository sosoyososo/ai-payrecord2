# DeepSeek LLM 集成设计规格

## 概述

将现有的基于规则的自然语言解析替换为 DeepSeek LLM API 调用，提供更智能的记账解析能力。

## 需求

用户配置 DeepSeek API：
```json
{
    "apiKey": "sk-0c40c51a35dc4074a6440b297f523b89",
    "apiUrl": "https://api.deepseek.com/v1/chat/completions",
    "model": "deepseek-chat"
}
```

## 设计

### 1. 配置项扩展

在 `backend/internal/config/config.go` 中添加：
- `DeepSeekAPIKey`
- `DeepSeekAPIUrl`（默认：`https://api.deepseek.com/v1/chat/completions`）
- `DeepSeekModel`（默认：`deepseek-chat`）

在 `.env.example` 中添加对应环境变量。

### 2. LLM 服务层重构

创建 `backend/internal/service/llm_client.go`：
- 实现 DeepSeek API 调用
- 构建提示词（prompt）
- 解析响应

修改 `LLMService.ParseNaturalLanguage()`：
- 保留原有的规则解析作为 fallback
- 主要调用 DeepSeek API
- API 不可用时使用规则解析

### 3. API 接口

保持现有接口不变：
- `POST /api/v1/llm/parse` - 自然语言解析

### 4. 提示词设计

```
你是一个记账助手。用户会输入自然语言描述消费或收入，你需要提取结构化信息。

用户输入: "{text}"

请提取以下信息（如果无法提取则为空/null）：
- amount: 金额（数字）
- type: 类型（1=支出，2=收入）
- category_id: 分类ID（如果匹配）
- category_name: 分类名称
- date: 日期（ISO 8601格式，如2026-03-23）
- note: 备注

如果输入中没有日期，默认使用今天。

只返回JSON格式，不要包含其他文字。
```

### 5. 错误处理

- API 调用失败：返回规则解析结果 + 警告
- API Key 未配置：使用规则解析
- 解析失败：返回规则解析结果

## 文件变更

1. `backend/internal/config/config.go` - 添加 DeepSeek 配置
2. `backend/.env.example` - 添加 DeepSeek 环境变量
3. `backend/internal/service/llm_client.go` - 新建 DeepSeek 客户端
4. `backend/internal/service/llm.go` - 修改 ParseNaturalLanguage 使用 LLM

## 测试用例

- TC-API-LLM-001: 配置 DeepSeek 后解析自然语言
- TC-API-LLM-002: DeepSeek API 不可用时的 fallback
- TC-API-LLM-003: 各类输入场景解析
