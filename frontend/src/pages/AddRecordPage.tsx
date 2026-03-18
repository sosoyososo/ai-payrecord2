import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recordApi, categoryApi, ledgerApi, llmApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { Category, Ledger } from '@/types'
import { ArrowLeft, Check, Sparkles, Loader2 } from 'lucide-react'

export default function AddRecordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

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

  // AI parsing
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [currentRes, categoriesRes] = await Promise.all([
        ledgerApi.getCurrent(),
        categoryApi.list(),
      ])

      setCurrentLedger(currentRes.data.data)
      setCategories(categoriesRes.data.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAiParse = async () => {
    if (!aiInput.trim()) return
    setAiLoading(true)
    try {
      const response = await llmApi.parse(aiInput)
      const data = response.data.data
      if (data.amount) setAmount(data.amount.toString())
      if (data.type) setType(data.type as 1 | 2)
      if (data.date) setDate(data.date)
      if (data.note) setNote(data.note)
    } catch (error) {
      console.error('AI parse failed:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !categoryId || !currentLedger) return

    // Convert datetime-local format "YYYY-MM-DDTHH:MM" to ISO format
    const dateTime = new Date(date).toISOString()

    setSaving(true)
    try {
      await recordApi.create({
        ledger_id: currentLedger.id,
        category_id: categoryId,
        amount: parseFloat(amount),
        type,
        date: dateTime,
        note: note || undefined,
      })
      navigate('/')
    } catch (error) {
      console.error('Failed to create record:', error)
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">{t('addRecord.title')}</span>
        </div>
      </header>

      {/* AI Input Section */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="relative">
          <Input
            placeholder="语音输入：午餐花费 25 元"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiParse()}
            className="pr-12"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={handleAiParse}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>
      </div>

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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-full px-4">
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
                {t('addRecord.save')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
