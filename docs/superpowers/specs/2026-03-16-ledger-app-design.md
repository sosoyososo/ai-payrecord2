# 账本 App 项目设计文档

## 1. 项目概述

### 1.1 项目目标
创建一个支持多用户的记账应用，帮助用户分类记录支出和收入，支持多账本管理，提供数据统计和 LLM 智能添加记录功能。

### 1.2 技术栈
- **后端**：Golang + Gin + Gorm + SQLite + JWT
- **前端**：React + Capacitor + TailwindCSS + shadcn/ui
- **支持平台**：Web (PC/手机/平板) + iOS + Android
- **LLM**：OpenAI 格式的国产大模型 API

---

## 2. 功能需求

### 2.1 用户系统
- **注册/登录**：用户名 + 密码
- **认证**：JWT Token（7天过期）+ Refresh Token（30天过期）
- **多设备支持**：支持多个 Refresh Token（每设备一个），可独立 revoke
- **数据隔离**：用户之间数据完全隔离

### 2.2 账本管理
- 每个用户可创建多个账本（如：日常支出、旅行基金）
- 支持切换当前活跃账本，切换成功后返回新账本信息
- 账本包含：名称、创建时间、记录数
- 用户登录后自动使用最近活跃的账本

### 2.3 分类管理
- **预置分类**（14个，带 Emoji 图标和颜色，支出12个 + 收入2个）：
  - 支出类：餐饮 🍜、交通 🚗、购物 🛍️、居住 🏠、教育 📚、医疗 💊、娱乐 🎮、人情 🎁、投资 📈、通讯 📱、日用 📦、其他 ➖
  - 收入类：工资 💰、奖金 🎉（后续可扩展添加兼职、投资收益、礼金、退款等）
- **一级平铺**：不区分支出/收入，通过记录标记
- **用户操作**：可删除（不可恢复），可添加自定义分类

### 2.4 标签管理
- **预置标签**（5个）：重要、报销、定期、人情、刚需
- **用户操作**：可删除（不可恢复），可添加自定义标签
- **多标签**：每条记录支持多个标签

### 2.5 记录管理
- **字段**：金额、分类、标签(多个)、支出/收入标记、备注、创建时间
- **添加方式**：
  1. 手动添加：选择分类、输入金额、选择标签、标记收支
  2. LLM 智能添加：输入自然语言文本，LLM 解析并创建记录
- **LLM 逻辑**：如识别到新分类，弹窗询问是否创建

### 2.6 首页
- **顶部汇总**：显示近12个月的支出/收入（笔数 + 金额），无数据则不显示
- **列表展示**：
  - 无限滚动加载
  - 每条记录单独一行
  - 日度汇总作为单独一行插入（显示日期 + 支出笔数/金额 + 收入笔数/金额）
  - **月度汇总浮层**：点击顶部月份卡片触发浮层，显示该月总支出/收入笔数和金额，可按分类或标签查看明细
- **时间排序**：按创建时间倒序

### 2.7 数据统计
- **饼图/环形图**：按分类查看支出/收入占比
- **折线图**：月度支出/收入趋势
- **交叉统计**：年度中每月可按分类或标签统计
- **范围选择**：全部数据 / 指定年度

---

## 3. 数据库设计

### 3.1 表结构

#### users（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | VARCHAR(50) | 用户名，唯一 |
| password_hash | VARCHAR(255) | 密码哈希 |
| current_ledger_id | INTEGER | 当前活跃账本 ID |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### ledgers（账本表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 所属用户 |
| name | VARCHAR(100) | 账本名称 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### categories（分类表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 所属用户（预置为 NULL） |
| name | VARCHAR(50) | 分类名称 |
| icon | VARCHAR(10) | Emoji 图标 |
| color | VARCHAR(20) | 颜色值 |
| is_system | BOOLEAN | 是否系统预置 |
| created_at | DATETIME | 创建时间 |

#### tags（标签表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 所属用户（预置为 NULL） |
| name | VARCHAR(20) | 标签名称 |
| is_system | BOOLEAN | 是否系统预置 |
| created_at | DATETIME | 创建时间 |

#### records（记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| ledger_id | INTEGER | 所属账本 |
| category_id | INTEGER | 分类 |
| amount | DECIMAL(12,2) | 金额 |
| type | TINYINT | 类型：1=支出，2=收入 |
| remark | VARCHAR(500) | 备注 |
| created_at | DATETIME | 记录时间 |

#### record_tags（记录-标签关联表）
| 字段 | 类型 | 说明 |
|------|------|------|
| record_id | INTEGER | 记录 ID |
| tag_id | INTEGER | 标签 ID |

#### refresh_tokens（刷新令牌表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 所属用户 |
| token | VARCHAR(255) | 令牌哈希 |
| expires_at | DATETIME | 过期时间 |
| created_at | DATETIME | 创建时间 |

---

## 4. API 设计

### 4.1 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/register | 注册 |
| POST | /api/v1/auth/login | 登录 |
| POST | /api/v1/auth/refresh | 刷新 Token |
| POST | /api/v1/auth/logout | 登出 |

### 4.2 用户接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/user/profile | 获取个人信息 |

### 4.3 账本接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/ledgers | 获取账本列表 |
| GET | /api/v1/ledgers/current | 获取当前活跃账本 |
| POST | /api/v1/ledgers | 创建账本 |
| PUT | /api/v1/ledgers/:id | 更新账本 |
| DELETE | /api/v1/ledgers/:id | 删除账本 |
| POST | /api/v1/ledgers/:id/switch | 切换当前账本 |

### 4.4 分类接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/categories | 获取分类列表 |
| POST | /api/v1/categories | 创建分类 |
| PUT | /api/v1/categories/:id | 更新分类（仅限用户自定义） |
| DELETE | /api/v1/categories/:id | 删除分类 |

### 4.5 标签接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/tags | 获取标签列表 |
| POST | /api/v1/tags | 创建标签 |
| PUT | /api/v1/tags/:id | 更新标签（仅限用户自定义） |
| DELETE | /api/v1/tags/:id | 删除标签 |

### 4.6 记录接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/records | 获取记录列表（分页，无限滚动） |
| GET | /api/v1/records/:id | 获取单条记录 |
| POST | /api/v1/records | 创建记录 |
| PUT | /api/v1/records/:id | 更新记录 |
| DELETE | /api/v1/records/:id | 删除记录 |

#### 分页参数
- `cursor`：游标分页，传入上页返回的最后一条记录的 ID
- `limit`：每页返回记录数，默认 20 条

#### GET /api/v1/records 响应示例
```json
{
  "data": [
    {
      "id": 100,
      "category_id": 1,
      "category_name": "餐饮",
      "category_icon": "🍜",
      "category_color": "#FF6B6B",
      "amount": 25.00,
      "type": 1,
      "tags": [{"id": 1, "name": "重要"}],
      "remark": "午餐",
      "created_at": "2025-03-15T12:30:00Z"
    }
  ],
  "pagination": {
    "next_cursor": 75,
    "has_more": true
  }
}
```

### 4.7 LLM 接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/llm/parse | 解析自然语言，生成记录预览 |
| POST | /api/v1/llm/records | 确认创建记录 |

#### POST /api/v1/llm/parse
请求：
```json
{
  "text": "今天中午吃了碗牛肉面花了25元"
}
```

响应：
```json
{
  "data": {
    "amount": 25.00,
    "type": 1,
    "category": {
      "name": "餐饮",
      "icon": "🍜",
      "color": "#FF6B6B",
      "is_new": false
    },
    "tags": [],
    "remark": "牛肉面"
  },
  "needs_category_confirm": false
}
```

当 `needs_category_confirm: true` 时，前端弹窗询问用户是否创建新分类。

#### POST /api/v1/llm/records
当用户确认后，调用此接口创建记录：

**场景1：使用已有分类**
```json
{
  "amount": 25.00,
  "type": 1,
  "category_id": 1,
  "tag_ids": [1, 2],
  "remark": "牛肉面"
}
```

**场景2：创建新分类**
当 `needs_category_confirm: true` 且用户确认创建时：
```json
{
  "amount": 25.00,
  "type": 1,
  "category_name": "咖啡",
  "category_icon": "☕",
  "category_color": "#8B4513",
  "tag_ids": [],
  "remark": "星巴克拿铁"
}
```
后端收到 `category_name`（无 `category_id`）时，自动创建新分类后再创建记录。

#### LLM 错误处理
- API 调用失败：返回错误信息，提示用户手动添加
- 解析失败：提示无法识别，请手动输入

### 4.8 统计接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/stats/summary | 顶部汇总数据（基于当前活跃账本） |
| GET | /api/v1/stats/by-category | 按分类统计 |
| GET | /api/v1/stats/by-tag | 按标签统计 |
| GET | /api/v1/stats/monthly | 月度趋势 |

**通用参数**：
- `ledger_id`（可选）：指定账本 ID，不传则使用当前活跃账本
- `year`（可选）：指定年份，不传则使用全部数据

### 4.9 通用响应格式

#### 成功响应
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "错误描述信息"
}
```

#### HTTP 状态码
- 200：成功
- 400：请求参数错误
- 401：未认证
- 403：无权限
- 404：资源不存在
- 500：服务器内部错误

---

## 5. 前端设计

### 5.1 页面结构
- **登录/注册页**：表单页面
- **首页**：汇总卡片 + 无限滚动列表
- **统计页**：图表展示
- **账本管理页**：账本列表和切换
- **分类/标签管理页**：CRUD 操作
- **LLM 添加页**：文本输入 + 结果确认

### 5.2 UI 组件（使用 shadcn/ui）
- 卡片组件展示汇总
- 表格/列表展示记录
- 饼图、折线图（使用 Recharts）
- 表单组件（输入框、下拉选择、多选）
- 对话框/浮层用于确认和详情

### 5.3 响应式设计
- **PC 端**：左侧导航栏 + 右侧内容区
- **移动端**：底部 Tab 导航

---

## 6. 安全设计

### 6.1 认证
- 密码使用 bcrypt 哈希存储
- JWT Token 包含 user_id，过期时间 7 天
- Refresh Token 存储哈希值，支持续期

### 6.2 权限
- 所有数据操作验证 user_id
- API 层面检查资源所有权

### 6.3 边界情况处理
- **删除分类**：如果该分类下有记录，提示用户先转移或删除记录
- **删除标签**：直接从关联表中移除，不影响记录
- **删除账本**：同时删除该账本下所有记录，提示用户确认
- **分页大小**：每页默认 20 条，无限滚动加载
- **LLM 解析失败**：返回友好错误信息，引导用户手动添加

---

## 7. 预置数据

预置数据在**用户首次注册时自动创建**（每用户独立副本），用户可删除但不影响系统预置数据本身。

### 7.1 预置分类（14个）
| 名称 | 图标 | 颜色 | 类型 |
|------|------|------|------|
| 餐饮 | 🍜 | #FF6B6B | 支出 |
| 交通 | 🚗 | #4ECDC4 | 支出 |
| 购物 | 🛍️ | #45B7D1 | 支出 |
| 居住 | 🏠 | #96CEB4 | 支出 |
| 教育 | 📚 | #FFEAA7 | 支出 |
| 医疗 | 💊 | #DDA0DD | 支出 |
| 娱乐 | 🎮 | #98D8C8 | 支出 |
| 人情 | 🎁 | #F7DC6F | 支出 |
| 投资 | 📈 | #BB8FCE | 支出 |
| 通讯 | 📱 | #85C1E9 | 支出 |
| 日用 | 📦 | #F8B500 | 支出 |
| 其他 | ➖ | #95A5A6 | 支出 |
| 工资 | 💰 | #2ECC71 | 收入 |
| 奖金 | 🎉 | #1ABC9C | 收入 |

### 7.2 预置标签（5个）
- 重要（#E74C3C）
- 报销（#3498DB）
- 定期（#27AE60）
- 人情（#E91E63）
- 刚需（#F39C12）

---

## 8. 配置项

### 8.1 LLM 配置
- **API Key**：通过环境变量 `LLM_API_KEY` 配置
- **API Base URL**：通过环境变量 `LLM_API_BASE` 配置（默认为 OpenAI 兼容地址）
- **模型名称**：通过环境变量 `LLM_MODEL` 配置
- **温度**：0.3（确保输出确定性）
- **最大 Token**：500

### 8.2 分页配置
- **默认每页条数**：20 条
- **最大每页条数**：100 条

### 8.3 日志配置
- **级别**：INFO（生产环境）/ DEBUG（开发环境）
- **输出**：stdout
- **格式**：JSON 格式

### 8.4 数据库索引建议
- `records.ledger_id`：账本查询
- `records.created_at`：时间排序
- `record_tags.record_id`：标签关联查询

---

## 9. 未涵盖功能

本项目**不包含**以下功能：
- 数据导出（Excel/CSV）
- 预算功能（超支提醒）
- 数据备份/恢复
- 账本共享/协作
- 多设备同步
- 数据导入
