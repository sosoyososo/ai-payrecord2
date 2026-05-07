import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { TagSelector } from '@/components/TagSelector'
import { CategoryIcon } from '@/components/CategoryIcon'
import type { Category, Tag } from '@/types'
import { Check, Loader2 } from 'lucide-react'

interface RecordFormProps {
  amount: string
  onAmountChange: (amount: string) => void
  date: string
  onDateChange: (date: string) => void
  categoryId: number | null
  onCategoryChange: (categoryId: number) => void
  tagIds: number[]
  onTagIdsChange: (tagIds: number[]) => void
  note: string
  onNoteChange: (note: string) => void
  categories: Category[]
  tags: Tag[]
  onSubmit: () => void
  isLoading: boolean
  isSubmitDisabled?: boolean
  submitText: string
  translations: {
    amount: string
    expenseAmount: string
    date: string
    category: string
    note: string
    notePlaceholder: string
    tags: string
  }
}

export function RecordForm({
  amount,
  onAmountChange,
  date,
  onDateChange,
  categoryId,
  onCategoryChange,
  tagIds,
  onTagIdsChange,
  note,
  onNoteChange,
  categories,
  tags,
  onSubmit,
  isLoading,
  isSubmitDisabled,
  submitText,
  translations,
}: RecordFormProps) {
  return (
    <div className="space-y-4">
      {/* Amount */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-1">
            {translations.expenseAmount}
          </div>
          <div className="flex items-center gap-1 text-3xl font-bold">
            <span>¥</span>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
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
          <div className="text-sm text-muted-foreground mb-1">{translations.date}</div>
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required
          />
        </CardContent>
      </Card>

      {/* Category */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-2">{translations.category}</div>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
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
                  <CategoryIcon icon={category.icon || 'HelpCircle'} size={20} />
                </div>
                <span className="text-xs">{category.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-2">{translations.tags}</div>
          <TagSelector
            tags={tags}
            selectedTagIds={tagIds}
            onChange={onTagIdsChange}
          />
        </CardContent>
      </Card>

      {/* Note */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-1">{translations.note}</div>
          <Input
            placeholder={translations.notePlaceholder}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-lg btn-press"
        disabled={isSubmitDisabled || isLoading || !amount || !categoryId}
        onClick={onSubmit}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Check className="h-5 w-5 mr-2" />
            {submitText}
          </>
        )}
      </Button>
    </div>
  )
}
