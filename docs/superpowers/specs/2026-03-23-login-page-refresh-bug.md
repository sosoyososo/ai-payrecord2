# Login页面刷新URL异常 - Spec

## 问题描述
- **现象**：在login页面刷新后，URL变成了 `https://login/`
- **期望**：刷新后应保持在 `/login` 路径

## 问题分析

### 根本原因
1. **Vite base配置缺失**：部署时没有正确配置 `base` 参数
2. **404.html fallback逻辑问题**：假设应用部署在根路径 `/`

### 技术细节
- 当前 `vite.config.ts` 没有 `base` 配置
- 当前 `404.html` 使用 `window.location.replace('/' + path + search)`
- 应用部署在 GitHub Pages，使用 `upload-pages-artifact`

## 解决方案

### 推荐方案：修复404.html + 添加vite base配置

**方案A**：使用相对路径 (`base: './'`)
- 优点：适合部署到任意路径
- 缺点：需要确保所有资源使用相对路径

**方案B**：添加绝对base配置
- 在vite.config.ts中添加 `base: '/'` 或 `base: '/ai-payrecord2/'`
- 同步更新404.html的fallback逻辑

### 实施步骤
1. 修改 `vite.config.ts` - 添加合适的 `base` 配置
2. 修改 `404.html` - 使其正确处理SPA路由fallback
3. 验证：在login页面刷新，URL应保持正确

## 验收标准
- [ ] 在 `/login` 页面刷新，URL保持 `/login`
- [ ] 在其他路由刷新，也能正确保持路径
- [ ] 资源（JS/CSS/图片）正确加载
