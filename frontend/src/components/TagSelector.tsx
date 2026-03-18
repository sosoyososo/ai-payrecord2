import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types'

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: number[]
  onChange: (tagIds: number[]) => void
  className?: string
}

export function TagSelector({
  tags,
  selectedTagIds,
  onChange,
  className,
}: TagSelectorProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id))

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs text-white"
              style={{ backgroundColor: tag.color || '#666' }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? t('tagSelector.collapseTags') : selectedTags.length > 0 ? t('tagSelector.editTags') : t('tagSelector.addTags')}
      </button>

      {/* Tag Selection Grid */}
      {isExpanded && (
        <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg">
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs transition-all',
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-1'
                    : 'hover:opacity-80'
                )}
                style={{
                  backgroundColor: tag.color || '#666',
                  color: '#fff',
                }}
              >
                <span className="truncate">{tag.name}</span>
                {isSelected && (
                  <svg
                    className="w-3 h-3 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
