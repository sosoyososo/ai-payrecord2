import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { recordApi, categoryApi, ledgerApi, tagApi, llmApi } from '@/services/api'
import { homeCache } from '@/stores/homeCache'
import PageContainer from '@/components/PageContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RecordForm } from '@/components/RecordForm'
import { VoiceInput } from '@/components/VoiceInput'
import type { Category, Ledger, Tag } from '@/types'
import { Sparkles, Loader2 } from 'lucide-react'

interface LLMCategorySuggestion {
  name: string
  icon: string
  color: string
  confidence: number
}

// Helper to convert ISO8601 datetime to datetime-local format (YYYY-MM-DDTHH:mm)
// Parses date parts directly from the ISO string to avoid timezone shift from Date/toISOString
const convertToDateTimeLocal = (isoString: string): string => {
  if (!isoString) return ''
  const match = isoString.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (!match) {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 16)
  }
  // If no specific time was extracted (midnight), use current time instead
  if (match[2] === '00:00') {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    return `${match[1]}T${hh}:${mm}`
  }
  return `${match[1]}T${match[2]}`
}

export default function AddRecordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [currentLedger, setCurrentLedger] = useState<Ledger | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [note, setNote] = useState('')
  const [tagIds, setTagIds] = useState<number[]>([])

  // AI parsing
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState<string | null>(null)
  const [suggestedCategories, setSuggestedCategories] = useState<LLMCategorySuggestion[]>([])
  const [newTags, setNewTags] = useState<string[]>([])
  const [creatingTag, setCreatingTag] = useState<string | null>(null)
  const [correcting, setCorrecting] = useState(false)

  const handleVoiceTranscript = useCallback(async (transcript: string) => {
    setAiInput(transcript)
    setCorrecting(true)
    try {
      const response = await llmApi.correctSpeech(transcript)
      const corrected = response.data.data?.corrected_text
      if (corrected && corrected !== transcript) {
        setAiInput(corrected)
      }
    } catch (error) {
      console.error('Speech correction failed, using raw text:', error)
    } finally {
      setCorrecting(false)
    }
  }, [])

  const handleInterimTranscript = useCallback((text: string) => {
    setAiInput(text)
  }, [])

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
      if (data.date) {
        const converted = convertToDateTimeLocal(data.date)
        if (converted) setDate(converted)
      }
      if (data.note) setNote(data.note)

      if (data.category_id && data.category_id > 0) {
        setCategoryId(data.category_id)
        setNewCategoryName(null)
      } else if (data.category_name) {
        const matched = categories.find(c => c.name === data.category_name)
        if (matched) {
          setCategoryId(matched.id)
          setNewCategoryName(null)
        } else {
          setNewCategoryName(data.category_name)
          setCategoryId(0)
        }
      }

      if (data.tags && data.tags.length > 0) {
        const matchedTagIds = tags
          .filter(t => data.tags.includes(t.name))
          .map(t => t.id)
        setTagIds(matchedTagIds)
      }

      if (data.new_tags && data.new_tags.length > 0) {
        setNewTags(data.new_tags)
      }

      if (data.suggested_categories && data.suggested_categories.length > 0) {
        setSuggestedCategories(data.suggested_categories)
      }

      setAiInput('')
    } catch (error) {
      console.error('AI parse failed:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleAiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiInput(e.target.value)
    if (newCategoryName) setNewCategoryName(null)
    if (suggestedCategories.length > 0) setSuggestedCategories([])
    if (newTags.length > 0) setNewTags([])
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
        date: dateTime,
        note: note || undefined,
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
      })
      homeCache.invalidate()
      navigate('/')
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
    <PageContainer title={t('addRecord.title')} showBackButton>
      {/* AI Input Section */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="relative">
          <Input
            placeholder={t('addRecord.voiceInputPlaceholder')}
            value={aiInput}
            onChange={handleAiInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleAiParse()}
            className="pr-20"
            style={correcting ? { opacity: 0.6 } : undefined}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              onInterimTranscript={handleInterimTranscript}
              disabled={aiLoading || correcting}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleAiParse}
              disabled={aiLoading || !aiInput.trim()}
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
            </Button>
          </div>
        </div>
        {/* New Category Suggestion */}
        {newCategoryName && (
          <div className="mt-3 p-3 bg-primary/10 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">
                Create new category: <strong>"{newCategoryName}"</strong>?
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await categoryApi.create({
                      name: newCategoryName,
                      icon: 'folder',
                      color: '#666',
                    })
                    const newCat = res.data.data
                    setCategories(prev => [...prev, newCat])
                    setCategoryId(newCat.id)
                    setNewCategoryName(null)
                  } catch (error) {
                    console.error('Failed to create category:', error)
                  }
                }}
              >
                Create
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNewCategoryName(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        {/* Suggested Categories */}
        {suggestedCategories.length > 0 && !newCategoryName && (
          <div className="mt-3 p-3 bg-primary/5 rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Suggested categories:</div>
            <div className="flex flex-wrap gap-2">
              {suggestedCategories.map((suggestion, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const existing = categories.find(c => c.name === suggestion.name)
                    if (existing) {
                      setCategoryId(existing.id)
                      setSuggestedCategories([])
                    } else {
                      try {
                        const res = await categoryApi.create({
                          name: suggestion.name,
                          icon: suggestion.icon || 'folder',
                          color: suggestion.color || '#666',
                        })
                        const newCat = res.data.data
                        setCategories(prev => [...prev, newCat])
                        setCategoryId(newCat.id)
                        setSuggestedCategories([])
                      } catch (error) {
                        console.error('Failed to create suggested category:', error)
                      }
                    }
                  }}
                >
                  {suggestion.name}
                </Button>
              ))}
            </div>
          </div>
        )}
        {/* New Tags */}
        {newTags.length > 0 && (
          <div className="mt-3 p-3 bg-primary/5 rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">New tags:</div>
            <div className="flex flex-wrap gap-2">
              {newTags.map((tagName) => (
                <button
                  key={tagName}
                  type="button"
                  disabled={creatingTag === tagName}
                  onClick={async () => {
                    setCreatingTag(tagName)
                    try {
                      const res = await tagApi.create({ name: tagName })
                      const newTag = res.data.data
                      setTags(prev => [...prev, newTag])
                      setTagIds(prev => [...prev, newTag.id])
                      setNewTags(prev => prev.filter(t => t !== tagName))
                    } catch (error) {
                      console.error('Failed to create tag:', error)
                    } finally {
                      setCreatingTag(null)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {creatingTag === tagName ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span className="text-primary font-medium">+</span>
                  )}
                  <span>{tagName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-4">
        <RecordForm
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
            amount: t('addRecord.amount'),
            expenseAmount: t('addRecord.expenseAmount'),
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
