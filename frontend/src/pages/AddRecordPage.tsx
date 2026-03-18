import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recordApi, categoryApi, ledgerApi, tagApi, llmApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RecordForm } from '@/components/RecordForm'
import type { Category, Ledger, Tag } from '@/types'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

export default function AddRecordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [currentLedger, setCurrentLedger] = useState<Ledger | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [type, setType] = useState<1 | 2>(1)
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [note, setNote] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])

  // AI parsing
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [currentRes, categoriesRes, tagsRes] = await Promise.all([
        ledgerApi.getCurrent(),
        categoryApi.list(),
        tagApi.list(),
      ])

      setCurrentLedger(currentRes.data.data)
      setCategories(categoriesRes.data.data || [])
      setTags(tagsRes.data.data || [])
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

  const handleSubmit = async () => {
    if (!amount || !categoryId || !currentLedger) return

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
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
      })
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to create record:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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

      {/* Form */}
      <div className="max-w-md mx-auto px-4">
        <RecordForm
          type={type}
          onTypeChange={setType}
          amount={amount}
          onAmountChange={setAmount}
          date={date}
          onDateChange={setDate}
          categoryId={categoryId}
          onCategoryChange={(id) => setCategoryId(id)}
          tagIds={tagIds}
          onTagIdsChange={setTagIds}
          note={note}
          onNoteChange={setNote}
          categories={categories}
          tags={tags}
          onSubmit={handleSubmit}
          isLoading={saving}
          isSubmitDisabled={!amount || !categoryId}
          submitText={t('addRecord.save')}
          translations={{
            expense: t('addRecord.expense'),
            income: t('addRecord.income'),
            expenseAmount: t('addRecord.expenseAmount'),
            incomeAmount: t('addRecord.incomeAmount'),
            date: t('addRecord.date'),
            category: t('addRecord.category'),
            note: t('addRecord.note'),
            notePlaceholder: t('addRecord.notePlaceholder'),
            tags: t('tag.title'),
          }}
        />
      </div>
    </div>
  )
}
