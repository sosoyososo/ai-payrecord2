# DeepSeek LLM 集成实施计划

## Step 1: 配置扩展

**文件:** `backend/internal/config/config.go`
- 添加 `DeepSeekAPIKey`, `DeepSeekAPIUrl`, `DeepSeekModel` 字段
- 在 `Load()` 中从环境变量读取

**文件:** `backend/.env.example`
- 添加:
  ```
  DEEPSEEK_API_KEY=
  DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
  DEEPSEEK_MODEL=deepseek-chat
  ```

## Step 2: 创建 DeepSeek 客户端

**新建文件:** `backend/internal/service/llm_client.go`

- `LLMClient` 结构体
- `NewLLMClient()` 构造函数
- `CallChatAPI(text, systemPrompt string) (string, error)` 方法
- `ParseWithLLM(userID uint, text string) (*LLMParsedRecord, error)` 方法

## Step 3: 修改 LLM Service

**文件:** `backend/internal/service/llm.go`

- 添加 `llmClient *LLMClient` 字段
- 修改 `NewLLMService()` 初始化客户端
- 修改 `ParseNaturalLanguage()`:
  - 优先调用 DeepSeek API
  - fallback 到规则解析

## Step 4: 测试验证

使用 hurl 测试 API:
```bash
# 测试解析接口
hurl --token <token> tests/llm-parse.hurl
```
