import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recordApi, ledgerApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react'

export default function ExportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<any[]>([])
  const [currentLedger, setCurrentLedger] = useState<any>(null)

  const handleLoadData = async () => {
    setLoading(true)
    try {
      const ledgerRes = await ledgerApi.getCurrent()
      const ledgerId = ledgerRes.data.data?.id
      const recordsRes = await recordApi.list({ ledger_id: ledgerId, page: 1, page_size: 1000 })
      setCurrentLedger(ledgerRes.data.data)
      setRecords(recordsRes.data.data.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToJSON = () => {
    const data = {
      export_date: new Date().toISOString(),
      ledger: currentLedger?.name,
      record_count: records.length,
      records: records.map((r) => ({
        id: r.id,
        date: r.date,
        type: r.type,
        amount: r.amount,
        category: r.category?.name,
        note: r.note,
        tags: r.tags?.map((t: any) => t.name).join(', '),
      })),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadFile(blob, `账本导出_${new Date().toISOString().split('T')[0]}.json`)
  }

  const exportToCSV = () => {
    const headers = ['日期', '类型', '金额', '分类', '备注', '标签']
    const rows = records.map((r) => [
      new Date(r.date).toLocaleDateString('zh-CN'),
      r.type === 1 ? '支出' : '收入',
      r.amount.toString(),
      r.category?.name || '',
      r.note || '',
      r.tags?.map((t: any) => t.name).join(', ') || '',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `账本导出_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 pb-24">
      {/* 返回导航 */}
      <div className="sticky top-0 z-10 bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 pb-2">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg ml-2">{t('export.title')}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('export.description')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('export.exportDesc')}
            </p>

            {!records.length && (
              <Button onClick={handleLoadData} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                {t('export.loadData')}
              </Button>
            )}

            {records.length > 0 && (
              <>
                <div className="p-3 bg-slate-50 rounded-lg">
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
    </div>
  )
}
