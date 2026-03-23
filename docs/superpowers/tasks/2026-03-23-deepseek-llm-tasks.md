# DeepSeek LLM 集成任务清单

## T001 [配置] 扩展 config.go 添加 DeepSeek 配置
- [x] 修改 `backend/internal/config/config.go`
- [x] 添加 `DeepSeekAPIKey`, `DeepSeekAPIUrl`, `DeepSeekModel` 字段
- [x] 在 `Load()` 中添加环境变量读取

## T002 [配置] 更新 .env.example
- [x] 在 `backend/.env.example` 添加 DeepSeek 环境变量

## T003 [代码] 创建 llm_client.go
- [x] 新建 `backend/internal/service/llm_client.go`
- [x] 实现 `LLMClient` 结构体和 API 调用方法

## T004 [代码] 修改 llm.go 集成 DeepSeek
- [x] 修改 `backend/internal/service/llm.go`
- [x] 集成 LLMClient 到 LLMService
- [x] 修改 ParseNaturalLanguage 使用 LLM 解析

## T005 [测试] API 测试验证
- [x] 运行后端服务测试 (go build 成功)
- [x] 使用 curl 测试 LLM parse 接口
- [x] 验证 DeepSeek 解析结果 ✅
