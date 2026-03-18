import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recordApi, categoryApi, ledgerApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { Category, Ledger } from '@/types'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'

export default function EditRecordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const recordId = parseInt(id || '0', 10)

  const [currentLedger, setCurrentLedger] = useState<Ledger | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [type, setType] = useState<1 | 2>(1) // 1=expense, 2=income
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [note, setNote] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [currentRes, categoriesRes, recordRes] = await Promise.all([
        ledgerApi.getCurrent(),
        categoryApi.list(),
        recordApi.get(recordId),
      ])

      setCurrentLedger(currentRes.data.data)
      setCategories(categoriesRes.data.data)

      // Fill form with record data
      if (recordRes.data.data) {
        const record = recordRes.data.data
        setAmount(record.amount.toString())
        setType(record.type as 1 | 2)
        setCategoryId(record.category_id)
        setDate(new Date(record.date).toISOString().slice(0, 16))
        setNote(record.note || '')
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !categoryId || !currentLedger) return

    // Convert datetime-local format "YYYY-MM-DDTHH:MM" to ISO format
    const dateTime = new Date(date).toISOString()

    setSaving(true)
    try {
      await recordApi.update(recordId, {
        ledger_id: currentLedger.id,
        category_id: categoryId,
        amount: parseFloat(amount),
        type,
        date: dateTime,
        note: note || undefined,
      })
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to update record:', error)
    } finally {
      setSaving(false)
    }
  }

  // Map form type to category type: form 1=expense -> category 2, form 2=income -> category 1
  const categoryTypeFilter = type === 1 ? 2 : 1
  const filteredCategories = categories.filter((c) => c.type === categoryTypeFilter || c.type === 3)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 pb-24">
      {/* 顶部标题栏 */}
      <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">{t('editRecord.title') || '编辑记录'}</span>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="max-w-md mx-auto px-4 space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 1 ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setType(1)
                setCategoryId(null)
              }}
            >
              {t('addRecord.expense')}
            </Button>
            <Button
              type="button"
              variant={type === 2 ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => {
                setType(2)
                setCategoryId(null)
              }}
            >
              {t('addRecord.income')}
            </Button>
          </div>

          {/* Amount */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">
                {type === 1 ? t('addRecord.expenseAmount') : t('addRecord.incomeAmount')}
              </div>
              <div className="flex items-center gap-1 text-3xl font-bold">
                <span>¥</span>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-3xl font-bold border-0 bg-transparent p-0 focus-visible:ring-0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Date */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">{t('addRecord.date')}</div>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-2">{t('addRecord.category')}</div>
              <div className="grid grid-cols-4 gap-2">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                      categoryId === category.id
                        ? 'bg-primary/10 ring-2 ring-primary'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: category.color || '#666' }}
                    >
                      {category.icon?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="text-xs">{category.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">{t('addRecord.note')}</div>
              <Input
                placeholder={t('addRecord.notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-md w-full px-4">
          <Button
            type="submit"
            className="w-full h-12 text-lg btn-press"
            disabled={saving || !amount || !categoryId}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                {t('editRecord.save') || '保存修改'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
