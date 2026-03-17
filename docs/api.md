# 账本 App API 文档

## 基础信息

- 基础 URL: `http://localhost:8080`
- 所有受保护的接口需要在 Header 中携带 `Authorization: Bearer <token>`

## 响应格式

### 成功响应
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 分页响应
```json
{
  "total": 100,
  "page": 1,
  "page_size": 20,
  "data": []
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "error message"
}
```

---

## 认证接口

### 注册用户
```
POST /api/v1/auth/register
```

**请求体:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "nickname": "Test User"
}
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": { ... },
    "access_token": "eyJ...",
    "refresh_token": "36e...",
    "expires_in": 86400
  }
}
```

---

### 用户登录
```
POST /api/v1/auth/login
```

**请求体:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**响应:** 同注册接口

---

### 刷新 Token
```
POST /api/v1/auth/refresh
```

**请求体:**
```json
{
  "refresh_token": "36ee..."
}
```

---

### 用户登出
```
POST /api/v1/auth/logout
```

**请求体:**
```json
{
  "refresh_token": "36ee..."
}
```

**需要认证**

---

## 用户接口

### 获取用户资料
```
GET /api/v1/user/profile
```

**需要认证**

---

### 更新用户资料
```
PUT /api/v1/user/profile
```

**请求体:**
```json
{
  "nickname": "New Nickname",
  "avatar": "https://..."
}
```

**需要认证**

---

### 修改密码
```
PUT /api/v1/user/password
```

**请求体:**
```json
{
  "old_password": "old123",
  "new_password": "new123"
}
```

**需要认证**

---

## 账本接口

### 获取账本列表
```
GET /api/v1/ledgers
```

**需要认证**

---

### 创建账本
```
POST /api/v1/ledgers
```

**请求体:**
```json
{
  "name": "旅行账本",
  "icon": "airplane",
  "color": "#FF5722",
  "is_default": false
}
```

**需要认证**

---

### 获取当前账本
```
GET /api/v1/ledgers/current
```

**需要认证**

---

### 切换当前账本
```
PUT /api/v1/ledgers/current
```

**请求体:**
```json
{
  "ledger_id": 2
}
```

**需要认证**

---

### 更新账本
```
PUT /api/v1/ledgers/:id
```

**需要认证**

---

### 删除账本
```
DELETE /api/v1/ledgers/:id
```

**需要认证** (不能删除默认账本)

---

## 分类接口

### 获取分类列表
```
GET /api/v1/categories
```

**查询参数:**
- `type`: 1=收入, 2=支出

**需要认证**

---

### 创建分类
```
POST /api/v1/categories
```

**请求体:**
```json
{
  "name": "新分类",
  "icon": "icon-name",
  "color": "#FF5722",
  "type": 2
}
```

**需要认证**

---

### 更新分类
```
PUT /api/v1/categories/:id
```

**需要认证**

---

### 删除分类
```
DELETE /api/v1/categories/:id
```

**需要认证** (不能删除系统分类)

---

## 标签接口

### 获取标签列表
```
GET /api/v1/tags
```

**需要认证**

---

### 创建标签
```
POST /api/v1/tags
```

**请求体:**
```json
{
  "name": "新标签",
  "color": "#2196F3"
}
```

**需要认证**

---

### 更新标签
```
PUT /api/v1/tags/:id
```

**需要认证**

---

### 删除标签
```
DELETE /api/v1/tags/:id
```

**需要认证** (不能删除系统标签)

---

## 记录接口

### 获取记录列表
```
GET /api/v1/records
```

**查询参数:**
- `ledger_id`: 账本 ID
- `start_date`: 开始日期 (YYYY-MM-DD)
- `end_date`: 结束日期 (YYYY-MM-DD)
- `type`: 1=支出, 2=收入
- `page`: 页码 (默认 1)
- `page_size`: 每页数量 (默认 20)

**需要认证**

---

### 获取单条记录
```
GET /api/v1/records/:id
```

**需要认证**

---

### 创建记录
```
POST /api/v1/records
```

**请求体:**
```json
{
  "ledger_id": 1,
  "category_id": 1,
  "amount": 100.00,
  "type": 1,
  "date": "2026-03-17T10:00:00Z",
  "note": "午餐",
  "image_url": "",
  "location": "",
  "source": "manual",
  "tag_ids": [1, 2]
}
```

**需要认证**

---

### 更新记录
```
PUT /api/v1/records/:id
```

**需要认证**

---

### 删除记录
```
DELETE /api/v1/records/:id
```

**需要认证**

---

## LLM 接口

### 获取分类列表 (给 LLM 使用)
```
GET /api/v1/llm/categories
```

**需要认证**

---

### 解析自然语言
```
POST /api/v1/llm/parse
```

**请求体:**
```json
{
  "text": "今天中午吃饭花了50块钱"
}
```

**响应:**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "amount": 50,
    "category_id": 1,
    "category_name": "餐饮",
    "type": 1,
    "date": "2026-03-17T...",
    "note": "今天中午吃饭",
    "tags": [],
    "suggested_categories": [],
    "new_category_name": ""
  }
}
```

**需要认证**

---

### 确认并创建记录
```
POST /api/v1/llm/records
```

**请求体:**
```json
{
  "amount": 50,
  "category_id": 1,
  "type": 1,
  "date": "2026-03-17T10:00:00Z",
  "note": "午餐",
  "tag_ids": [],
  "new_category_name": ""
}
```

**需要认证**

---

## 统计接口

### 年度汇总
```
GET /api/v1/stats/summary
```

**查询参数:**
- `year`: 年份 (默认当前年)
- `ledger_id`: 账本 ID

**需要认证**

---

### 日度统计
```
GET /api/v1/stats/daily
```

**查询参数:**
- `start_date`: 开始日期
- `end_date`: 结束日期
- `ledger_id`: 账本 ID

**需要认证**

---

### 分类统计
```
GET /api/v1/stats/by-category
```

**查询参数:**
- `start_date`: 开始日期
- `end_date`: 结束日期
- `ledger_id`: 账本 ID
- `type`: 1=支出, 2=收入

**需要认证**

---

### 月度趋势
```
GET /api/v1/stats/monthly
```

**查询参数:**
- `year`: 年份
- `ledger_id`: 账本 ID

**需要认证**

---

### 标签统计
```
GET /api/v1/stats/by-tag
```

**查询参数:**
- `start_date`: 开始日期
- `end_date`: 结束日期
- `ledger_id`: 账本 ID

**需要认证**

---

### 月度详情
```
GET /api/v1/stats/monthly-detail
```

**查询参数:**
- `year`: 年份
- `month`: 月份 (1-12)
- `ledger_id`: 账本 ID

**需要认证**

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 (token 无效或过期) |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
