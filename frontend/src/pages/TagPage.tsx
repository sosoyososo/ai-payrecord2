import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { tagApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { Tag } from '@/types'
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react'

const DEFAULT_COLORS = [
  '#FF5722', '#2196F3', '#E91E63', '#9C27B0', '#795548',
  '#F44336', '#00BCD4', '#607D8B', '#9E9E9E', '#4CAF50',
]

export default function TagPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await tagApi.list()
      setTags(res.data.data || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await tagApi.create({ name: newName, color: newColor })
      setNewName('')
      setNewColor(DEFAULT_COLORS[0])
      setShowAdd(false)
      loadData()
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color || DEFAULT_COLORS[0])
  }

  const handleSave = async (id: number) => {
    if (!editName.trim()) return
    try {
      await tagApi.update(id, { name: editName, color: editColor })
      setEditingId(null)
      loadData()
    } catch (error) {
      console.error('Failed to update tag:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm.deleteTag'))) return
    try {
      await tagApi.delete(id)
      loadData()
    } catch (error) {
      console.error('Failed to delete tag:', error)
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
      {/* 返回导航 */}
      <div className="sticky top-0 z-10 bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 pb-2">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg ml-2">{t('tag.title')}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardContent className="p-4 flex items-center justify-between">
              {editingId === tag.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: editColor }}
                  />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <Button size="icon" variant="ghost" onClick={() => handleSave(tag.id)}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color || '#666' }}
                    />
                    <span>{tag.name}</span>
                    {tag.is_system && (
                      <span className="text-xs text-muted-foreground">{t('tag.systemTag')}</span>
                    )}
                  </div>
                  {!tag.is_system && (
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(tag)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(tag.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {showAdd ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              <Input
                placeholder={t('tag.namePlaceholder')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm">{t('tag.color')}:</span>
                <div className="flex gap-1">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-6 h-6 rounded-full ${
                        newColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  {t('common.save')}
                </Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('tag.addTag')}
          </Button>
        )}
      </div>
    </div>
  )
}
