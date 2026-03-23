# Login页面刷新URL异常修复 - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复login页面刷新后URL变成 `https://login/` 的问题

**Architecture:**
- 修改 Vite 配置添加正确的 `base` 参数
- 修复 404.html SPA fallback 脚本，确保路由正确恢复
- 验证部署后各路由刷新行为

**Tech Stack:** Vite 8.0.0, React 19.2.4, React Router DOM 7.13.1

---

## 文件变更映射

| 文件 | 变更类型 | 责任 |
|------|----------|------|
| `frontend/vite.config.ts` | 修改 | 添加 base 配置 |
| `frontend/public/404.html` | 修改 | 修复 SPA fallback 逻辑 |

---

## Task 1: 修复 vite.config.ts 添加 base 配置

**Files:**
- Modify: `frontend/vite.config.ts:1-34`

- [ ] **Step 1: 添加 base 配置到 vite.config.ts**

修改 `frontend/vite.config.ts`，在 `defineConfig` 中添加 `base: './'`：

```ts
export default defineConfig({
  base: './',  // 添加这一行 - 使用相对路径
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('lucide') || id.includes('recharts')) {
              return 'vendor-ui'
            }
            if (id.includes('axios') || id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-utils'
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
```

- [ ] **Step 2: 验证配置语法**

运行: `cd frontend && npx tsc --noEmit vite.config.ts`
预期: 无编译错误

---

## Task 2: 修复 404.html SPA fallback 逻辑

**Files:**
- Modify: `frontend/public/404.html:1-16`

- [ ] **Step 1: 更新 404.html 使用更健壮的 fallback 逻辑**

修改 `frontend/public/404.html`：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // SPA fallback - redirect to index.html with original path
    (function() {
      var path = window.location.pathname;
      var search = window.location.search || '';
      var hash = window.location.hash || '';

      // 构建目标路径 - 使用相对路径
      var dest = 'index.html';
      if (path !== '/' && path.length > 1) {
        // 保留路径信息，但交给前端路由处理
        dest = 'index.html';
      }
      // 追加原始查询参数和hash
      if (search) dest += search;
      if (hash) dest += hash;

      window.location.replace(dest);
    })();
  </script>
</head>
<body>
  <p>Redirecting to app...</p>
</body>
</html>
```

- [ ] **Step 2: 验证 404.html 语法**

检查HTML结构完整性和JavaScript语法

---

## Task 3: 本地验证

- [ ] **Step 1: 构建项目验证无错误**

运行: `cd frontend && npm run build`
预期: 构建成功，生成 dist 目录

- [ ] **Step 2: 本地预览验证路由**

运行: `cd frontend && npm run preview`
预期: 启动预览服务器，访问 http://localhost:4173/login 刷新后URL保持正确

---

## Task 4: 更新测试用例文档

**Files:**
- Modify: `docs/superpowers/test-cases/ui-test-cases.md`

- [ ] **Step 1: 添加 SPA 路由刷新测试用例**

在测试文档中添加：
```
- [ ] TC-UI-SPA-001 [UI] Login页面刷新后URL保持正确
  - 描述: 在 /login 页面刷新后，URL应保持 /login
  - 步骤: 访问 /login -> 刷新页面 -> 检查URL
  - 预期: URL保持 /login
```

---

## 风险与注意事项

1. **相对路径 vs 绝对路径**: 使用 `base: './'` 可确保资源使用相对路径，适合部署到任意路径
2. **GitHub Pages 兼容性**: `404.html` fallback 在 GitHub Pages 上工作，但需要确保 `base` 配置与部署路径匹配
3. **子目录部署**: 如果将来部署到子目录（如 `/ai-payrecord2/`），需要相应修改 `base` 配置

---

## 验证命令

```bash
# 本地构建
cd frontend && npm run build

# 本地预览
npm run preview

# 打开浏览器访问
open http://localhost:4173/login
# 刷新页面，检查URL是否保持 /login
```
