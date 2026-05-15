# Export Data Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复导出数据功能 — iOS 上点击无反应、Web 上分页限制导致导出不完整

**Architecture:** iOS/Android 使用 Capacitor Filesystem + Share 插件写入临时文件并唤起原生分享面板；Web 保持 blob download 方式并修复竞态条件；后端放松 page_size 限制

**Tech Stack:** React + Capacitor + TypeScript, Go + Gin + Gorm

---

### Task 1: 安装 Capacitor 插件

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: 安装 @capacitor/filesystem 和 @capacitor/share**

```bash
cd frontend && npm install @capacitor/filesystem @capacitor/share
```

- [ ] **Step 2: 同步 iOS 和 Android 项目**

```bash
cd frontend && npx cap sync
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/ios frontend/android
git commit -m "chore: add Capacitor Filesystem and Share plugins for export feature"
```

---

### Task 2: 后端 page_size 上限

**Files:**
- Modify: `backend/internal/service/record.go:86-88`

- [ ] **Step 1: 修改上限**

将第 86-88 行：

```go
if query.PageSize > 100 {
    query.PageSize = 100
}
```

改为：

```go
if query.PageSize > 10000 {
    query.PageSize = 10000
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/internal/service/record.go
git commit -m "fix: raise record list page_size limit from 100 to 10000 for data export"
```

---

### Task 3: 前端 downloadFile 平台感知重写

**Files:**
- Modify: `frontend/src/pages/ExportPage.tsx` (全部)

用以下完整文件替换 `frontend/src/pages/ExportPage.tsx`：

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { recordApi, ledgerApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import PageContainer from '@/components/PageContainer'
import { Download, FileJson, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function ExportPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<any[]>([])
  const [currentLedger, setCurrentLedger] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLoadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const ledgerRes = await ledgerApi.getCurrent()
      const ledgerId = ledgerRes.data.data?.id
      const recordsRes = await recordApi.list({ ledger_id: ledgerId, page: 1, page_size: 10000 })
      setCurrentLedger(ledgerRes.data.data)
      setRecords(recordsRes.data.data.data || [])
    } catch (err) {
      setError(t('export.loadFailed'))
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const buildExportData = () => ({
    export_date: new Date().toISOString(),
    ledger: currentLedger?.name,
    record_count: records.length,
    records: records.map((r) => ({
      id: r.id,
      date: r.date,
      amount: r.amount,
      category: r.category?.name,
      note: r.note,
      tags: r.tags?.map((t: any) => t.name).join(', '),
    })),
  })

  const exportToJSON = async () => {
    const data = buildExportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const filename = `${t('export.exportFilePrefix')}_${new Date().toISOString().split('T')[0]}.json`
    await downloadFile(blob, filename)
  }

  const exportToCSV = async () => {
    const headers = [t('export.date'), t('addRecord.amount'), t('addRecord.category'), t('addRecord.note'), t('tag.title')]
    const rows = records.map((r) => [
      new Date(r.date).toLocaleDateString(),
      r.amount.toString(),
      r.category?.name || '',
      r.note || '',
      r.tags?.map((t: any) => t.name).join(', ') || '',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const BOM = '﻿'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const filename = `${t('export.exportFilePrefix')}_${new Date().toISOString().split('T')[0]}.csv`
    await downloadFile(blob, filename)
  }

  const downloadFile = async (blob: Blob, filename: string) => {
    if (Capacitor.isNativePlatform()) {
      const base64Data = await blobToBase64(blob)
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      })
      await Share.share({
        title: filename,
        url: result.uri,
        dialogTitle: t('export.title'),
      })
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    }
  }

  return (
    <PageContainer title={t('export.title')} showBackButton>
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('export.description')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('export.exportDesc')}
            </p>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {!records.length && (
              <Button onClick={handleLoadData} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                {t('export.loadData')}
              </Button>
            )}

            {records.length > 0 && (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">{t('export.ledger')}:</span> {currentLedger?.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{t('export.recordCount')}:</span> {records.length}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={exportToJSON}
                    disabled={loading}
                    className="w-full"
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    {t('export.exportJson')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    disabled={loading}
                    className="w-full"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {t('export.exportCsv')}
                  </Button>
                </div>

                <Button variant="ghost" onClick={handleLoadData} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  {t('export.reloadData')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground text-center">
              {t('export.warning')}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
```

**关键改动说明：**
1. `downloadFile` 变为 `async`，通过 `Capacitor.isNativePlatform()` 分支
2. 原生平台：blob → base64 → Filesystem.writeFile(Cache) → Share.share
3. Web 平台：保留原逻辑，延迟 100ms 清理避免竞态，`a.style.display = 'none'` 避免闪烁
4. 新增 `buildExportData` 提取公共逻辑，JSON/CSV 复用
5. 新增 `error` 状态，catch 中设置错误信息并在 UI 显示
6. `page_size` 从 1000 改为 10000 以匹配后端新上限

- [ ] **Step 1: 替换 ExportPage.tsx**

使用上面的完整代码替换 `frontend/src/pages/ExportPage.tsx`。

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd frontend && npx tsc --noEmit
```

预期：无类型错误。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/ExportPage.tsx
git commit -m "fix: rewrite export download to use native share sheet on iOS/Android and fix blob download on web"
```

---

### Task 4: 添加错误提示 i18n key

**Files:**
- Modify: `frontend/src/i18n/locales/en.json`
- Modify: `frontend/src/i18n/locales/zh.json`

- [ ] **Step 1: 添加英文翻译**

在 `export` 对象中添加 `"loadFailed": "Failed to load data. Please try again."`

```bash
# 在 en.json 的 export 块中，找到 "exportFilePrefix" 行后面插入
```

**文件位置**: `frontend/src/i18n/locales/en.json`，`export` 节点内，`"exportFilePrefix"` 后面添加：

```json
"loadFailed": "Failed to load data. Please try again.",
```

- [ ] **Step 2: 添加中文翻译**

**文件位置**: `frontend/src/i18n/locales/zh.json`，`export` 节点内，`"exportFilePrefix"` 后面添加：

```json
"loadFailed": "加载数据失败，请重试",
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/i18n/locales/en.json frontend/src/i18n/locales/zh.json
git commit -m "feat: add loadFailed i18n key for export page error handling"
```

---

### Task 5: Web 端验证

- [ ] **Step 1: 启动开发服务器**

```bash
cd frontend && npm run dev
```

- [ ] **Step 2: Playwright 测试 — 导航到导出页面**

使用 Playwright 导航到 `/export`，点击 "Load Data"，等待加载完成，然后点击 "Export JSON"，验证浏览器下载行为：

```
npx playwright test --grep "export"
```

如果不存在对应的 Playwright 测试文件，则手动验证：

1. 打开 `http://localhost:5173/export`
2. 登录（如需要）
3. 点击 "加载数据"
4. 点击 "导出 JSON" — 确认触发浏览器下载
5. 点击 "导出 CSV" — 确认触发浏览器下载

- [ ] **Step 3: 更新测试用例文档**

在 `docs/superpowers/test-cases/ui-test-cases.md` 中添加：

```markdown
- [ ] TC-UI-EXPORT-001 导出页面 — 加载数据正常显示记录数和账本名
- [ ] TC-UI-EXPORT-002 导出 JSON — Web 端触发浏览器下载
- [ ] TC-UI-EXPORT-003 导出 CSV — Web 端触发浏览器下载
- [ ] TC-UI-EXPORT-004 导出 JSON — iOS/Android 端弹出原生分享面板
- [ ] TC-UI-EXPORT-005 导出 CSV — iOS/Android 端弹出原生分享面板
- [ ] TC-UI-EXPORT-006 加载失败 — 显示错误提示
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/test-cases/ui-test-cases.md
git commit -m "docs: add export page UI test cases"
```

---

### Task 6: iOS 端验证（需用户手动）

由于无法在开发环境运行 iOS 模拟器，请用户手动验证：

1. `cd frontend && npx cap copy && npx cap open ios`
2. 在 Xcode 中运行到模拟器或真机
3. 导航到 Settings → Export Data
4. 点击 Load Data → 确认数据加载成功
5. 点击 Export JSON → 确认弹出原生分享面板
6. 点击 Export CSV → 确认弹出原生分享面板
