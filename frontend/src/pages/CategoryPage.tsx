import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { IconPicker } from '@/components/IconPicker'
import { CategoryIcon } from '@/components/CategoryIcon'
import PageContainer from '@/components/PageContainer'
import type { Category } from '@/types'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

const DEFAULT_COLORS = [
  '#FF5722', '#2196F3', '#E91E63', '#9C27B0', '#795548',
  '#F44336', '#00BCD4', '#607D8B', '#9E9E9E', '#4CAF50',
]

export default function CategoryPage() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0])
  const [newIcon, setNewIcon] = useState('MoreHorizontal')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await categoryApi.list()
      setCategories(res.data.data || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await categoryApi.create({ name: newName, color: newColor, icon: newIcon })
      setNewName('')
      setNewColor(DEFAULT_COLORS[0])
      setNewIcon('MoreHorizontal')
      setShowAdd(false)
      loadData()
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
    setEditColor(category.color || DEFAULT_COLORS[0])
    setEditIcon(category.icon || 'MoreHorizontal')
  }

  const handleSave = async (id: number) => {
    if (!editName.trim()) return
    try {
      await categoryApi.update(id, { name: editName, color: editColor, icon: editIcon })
      setEditingId(null)
      loadData()
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }

  const handleDelete = async (id: number) => {
    setPendingDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return
    try {
      await categoryApi.delete(pendingDeleteId)
      loadData()
    } catch (error) {
      console.error('Failed to delete category:', error)
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
    <PageContainer title={t('category.title')} showBackButton>
      <div className="max-w-md mx-auto px-4 py-4 space-y-6">
        {/* Expense Categories */}
        <div>
          <h3 className="font-medium mb-3 text-red-600">{t('category.expenseCategory')}</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  {editingId === category.id ? (
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
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
                        <Button size="icon" variant="ghost" onClick={() => handleSave(category.id)}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      <IconPicker selectedIcon={editIcon} onSelect={setEditIcon} />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: category.color || '#666' }}
                        >
                          <CategoryIcon icon={category.icon || 'MoreHorizontal'} />
                        </div>
                        <span>{category.name}</span>
                        {category.is_system && (
                          <span className="text-xs text-muted-foreground">{t('category.systemCategory')}</span>
                        )}
                      </div>
                      {!category.is_system && (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(category.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add New Category */}
        {showAdd ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              <Input
                placeholder={t('category.namePlaceholder')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm">{t('category.color')}:</span>
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
              <div className="space-y-2">
                <span className="text-sm">{t('category.selectIcon')}:</span>
                <IconPicker selectedIcon={newIcon} onSelect={setNewIcon} />
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
            {t('category.addCategory')}
          </Button>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title={t('confirm.deleteCategory')}
          description={t('confirm.deleteCategoryDesc')}
          confirmText={t('confirm.delete')}
          cancelText={t('confirm.cancel')}
        />
      </div>
    </PageContainer>
  )
}
