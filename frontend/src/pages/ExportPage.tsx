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
      setRecords(recordsRes.data?.data?.data || [])
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
    try {
      const data = buildExportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const filename = `${t('export.exportFilePrefix')}_${new Date().toISOString().split('T')[0]}.json`
      await downloadFile(blob, filename, 'application/json')
    } catch (err) {
      setError(t('export.loadFailed'))
      console.error('Failed to export JSON:', err)
    }
  }

  const exportToCSV = async () => {
    try {
      const headers = [t('export.date'), t('addRecord.amount'), t('addRecord.category'), t('addRecord.note'), t('tag.title')]
      const rows = records.map((r) => [
        new Date(r.date).toLocaleDateString(),
        r.amount.toString(),
        r.category?.name || '',
        r.note || '',
        r.tags?.map((t: any) => t.name).join(', ') || '',
      ])

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
      const BOM = '﻿'
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
      const filename = `${t('export.exportFilePrefix')}_${new Date().toISOString().split('T')[0]}.csv`
      await downloadFile(blob, filename, 'text/csv')
    } catch (err) {
      setError(t('export.loadFailed'))
      console.error('Failed to export CSV:', err)
    }
  }

  const downloadFile = async (blob: Blob, filename: string, mimeType: string) => {
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
      // Try File System Access API first (Chrome/Edge) — opens native Save As dialog
      if ('showSaveFilePicker' in window) {
        try {
          const ext = mimeType === 'text/csv' ? '.csv' : '.json'
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: ext === '.json' ? 'JSON File' : 'CSV File',
              accept: { [mimeType]: [ext] as string[] },
            }],
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          return
        } catch (err) {
          // User cancelled or API failed — fall through to anchor download
          if ((err as DOMException).name === 'AbortError') return
        }
      }
      // Fallback: anchor download for Firefox/Safari
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
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
