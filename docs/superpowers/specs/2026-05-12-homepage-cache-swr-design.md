# HomePage 状态保持 + SWR 缓存设计

## 问题

首页（HomePage）在编辑、添加、切换页面后返回时自动重新加载并刷新，导致：
- 搜索结果、滚动位置、分页状态丢失
- 出现 loading skeleton 闪烁
- 不必要的重复网络请求

## 目标

1. **返回不刷新**：从其他页面返回时，保持首页全部状态（搜索、分页、滚动位置）
2. **数据变化自动体现**：数据有变更时（增/删/改），后台静默刷新，React 只更新变化 DOM
3. **手动刷新**：导航栏右侧增加刷新按钮，不干扰当前内容

## 方案：Module-level SWR Cache

利用 ES Module 作用域（跨组件 unmount 持久化）实现 Stale-While-Revalidate 模式。

## 架构

```
HomePage mount
  ├→ cache 有数据？── Yes ──→ 瞬间恢复全部 state (loading=false, 无闪烁)
  │                             └→ isStale? ── Yes ──→ silentRefresh() 后台拉新
  │                                                           └→ React diff 只更新变化 DOM
  └→ cache 无数据？── 首次访问 ──→ loadData() 正常 loading skeleton
                                     └→ 写入 cache

AddRecordPage / EditRecordPage 保存成功
  └→ cache.invalidate() + navigate('/')

HomePage 删除成功
  └→ loadData() → 写入 cache（已在当前页，直接更新）
```

## 文件变更

### 1. 新建 `src/stores/homeCache.ts`

模块级缓存，核心接口：

```typescript
getCache(): HomeCacheData | null      // 读取缓存
setCache(data: HomeCacheData): void   // 写入缓存，重置 stale=false
invalidate(): void                    // 标记为脏（数据可能变了）
isStale(): boolean                    // 是否需要后台刷新
isValid(): boolean                    // 是否有缓存数据（决定是否显示 loading）
clear(): void                         // 完全清除（手动刷新时用）
```

缓存内容 = HomePage 全部 state：records, filteredRecords, ledgers, currentLedger, summary, searchQuery, currentPage, hasMore

两个独立标记：
- `cache !== null` → 有缓存数据，跳过 loading skeleton
- `stale` → 数据可能过时，触发后台静默刷新

### 2. 修改 `src/pages/HomePage.tsx`

**mount 逻辑改为 SWR：**

```typescript
useEffect(() => {
  const cached = homeCache.get()
  if (cached) {
    // 瞬间恢复状态
    setRecords(cached.records)
    setFilteredRecords(cached.filteredRecords)
    setLedgers(cached.ledgers)
    setCurrentLedger(cached.currentLedger)
    setSummary(cached.summary)
    setSearchQuery(cached.searchQuery)
    setCurrentPage(cached.currentPage)
    setHasMore(cached.hasMore)
    // 脏数据后台静默刷新
    if (homeCache.isStale()) {
      silentRefresh() // 不设 loading=true
    }
  } else {
    loadData() // 首次访问，正常 loading
  }
}, [])
```

**silentRefresh** — 调用 loadData 但不设 `setLoading(true)`，数据更新后 React 自动 diff 变化。即时加载前后数据一致，DOM 也不会闪烁，因为 React 不会替换相同的 VDOM 节点。

**手动刷新按钮：**

- 使用 `useHeader().setConfig({ customRight })` 传入 `RefreshCw` 按钮到导航栏右侧
- 点击时：`homeCache.clear()` → `loadData()` → `homeCache.set(data)`
- 按钮自身旋转动画，不影响页面内容
- unmount 时 `useEffect` cleanup 清除 customRight

**confirmDelete 改造：**

删除成功后调用 `loadData()` → `homeCache.set(data)`，确保首页数据同步。

### 3. 修改 `src/pages/AddRecordPage.tsx`

```typescript
// handleSubmit 保存成功后
import { homeCache } from '@/stores/homeCache'

homeCache.invalidate()
navigate('/')  // 替换 window.location.href = '/'
```

### 4. 修改 `src/pages/EditRecordPage.tsx`

同上：

```typescript
homeCache.invalidate()
navigate('/')  // 替换 window.location.href = '/'
```

### 5. 不改

- `src/App.tsx` — 路由不变
- `src/components/AppLayout.tsx` — layout 不变
- `src/components/AppHeader.tsx` — 已支持 customRight

## 边界情况

| 场景 | 行为 |
|------|------|
| 首次访问首页 | 无缓存 → 正常 loading skeleton → 加载 → 写入缓存 |
| 从 Add/Edit 返回 | hit 缓存瞬间恢复 → stale → 静默后台拉新 |
| 首页直接删除 | 调用 loadData → 更新缓存 |
| 切到 Stats 再回首页 | hit 缓存瞬间恢复 → 非 stale → 不请求 |
| 手动刷新按钮 | 清缓存 → loadData → 写入缓存 |
| 其他应用数据被修改后访问首页 | hit 缓存 → stale → 后台静默刷新 → 新数据出现 |
| 硬刷新浏览器 | 模块级缓存丢失 → 首次访问逻辑 |

## 不做

- 不在缓存中保存滚动位置（避免额外复杂度）
- 不退回到 loading skeleton（避免闪烁）
- 不添加额外依赖
- 不修改路由结构
