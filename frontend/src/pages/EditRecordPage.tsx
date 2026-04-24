import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recordApi, categoryApi, ledgerApi, tagApi } from '@/services/api'
import { RecordForm } from '@/components/RecordForm'
import PageContainer from '@/components/PageContainer'
import type { Category, Ledger, Tag } from '@/types'

export default function EditRecordPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const recordId = parseInt(id || '0', 10)

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
  const [originalDate, setOriginalDate] = useState('')
  const [note, setNote] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [currentRes, categoriesRes, tagsRes, recordRes] = await Promise.all([
        ledgerApi.getCurrent(),
        categoryApi.list(),
        tagApi.list(),
        recordApi.get(recordId),
      ])

      setCurrentLedger(currentRes.data.data)
      setCategories(categoriesRes.data.data || [])
      setTags(tagsRes.data.data || [])

      // Fill form with record data
      if (recordRes.data.data) {
        const record = recordRes.data.data
        const recordDate = new Date(record.date).toISOString().slice(0, 16)
        setAmount(record.amount.toString())
        setType(record.type as 1 | 2)
        setCategoryId(record.category_id)
        setDate(recordDate)
        setOriginalDate(recordDate)
        setNote(record.note || '')
        // Load existing tags for this record
        setTagIds(record.tags?.map(t => t.id) || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!amount || !categoryId || !currentLedger) return

    // Only update date if it changed
    const newDateTime = new Date(date).toISOString()
    const dateChanged = date !== originalDate

    setSaving(true)
    try {
      await recordApi.update(recordId, {
        ledger_id: currentLedger.id,
        category_id: categoryId,
        amount: parseFloat(amount),
        type,
        ...(dateChanged ? { date: newDateTime } : {}),
        note: note || undefined,
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
      })
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to update record:', error)
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
    <PageContainer title={t('editRecord.title')} showBackButton>
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
          submitText={t('editRecord.save')}
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
    </PageContainer>
  )
}
