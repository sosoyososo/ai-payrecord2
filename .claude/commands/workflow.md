---
description: 遵守工作流规范执行新功能开发 - 自动执行 spec → plan → tasks → implement
handoffs:
  - label: 需求澄清 (Brainstorming)
    agent: superpowers:brainstorming
    prompt: |
      用户请求开发新功能。请按照工作流进行需求澄清：
      1. 探索项目上下文
      2. 提问澄清需求
      3. 提出方案并推荐
      4. 编写 spec 文档
    send: true
  - label: 任务规划 (Writing Plans)
    agent: superpowers:writing-plans
    prompt: |
      根据已批准的 spec 文档创建实施计划。
      保存到 docs/superpowers/plans/
    send: true
  - label: 任务生成 (Tasks)
    agent: speckit.tasks
    prompt: |
      基于 spec + plan 生成任务清单。
      保存到 docs/superpowers/tasks/
    send: true
  - label: 执行实现 (Implement)
    agent: speckit.implement
    prompt: |
      按照任务清单执行实现。
      完成后更新文档状态并提交代码。
    send: true
---

## 工作流说明

此命令会自动执行完整的工作流：

1. **superpowers:brainstorming** - 需求澄清
   - 探索项目上下文
   - 提问澄清需求
   - 提出方案并推荐
   - 编写 spec 文档到 `docs/superpowers/specs/`

2. **superpowers:writing-plans** - 任务规划
   - 将 spec 拆解为可执行步骤
   - 生成 plan 文档到 `docs/superpowers/plans/`

3. **speckit.tasks** - 任务生成
   - 基于 spec + plan 生成任务清单
   - 保存到 `docs/superpowers/tasks/`

4. **speckit.implement** - 执行验证
   - 按任务清单顺序执行
   - 每完成一个任务更新 checkbox 状态
   - 提交代码并推送

## 使用方法

```bash
/workflow <功能描述>
```

例如：
```bash
/workflow 添加用户头像上传功能
```

## 重要提示

- **不要在此阶段修改代码** - 代码修改只在第4步执行
- 所有文档必须保存到正确目录
- 任务完成后更新文档状态
