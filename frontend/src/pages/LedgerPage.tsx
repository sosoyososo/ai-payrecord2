import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ledgerApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import type { Ledger } from '@/types'
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react'

export default function LedgerPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await ledgerApi.list()
      setLedgers(res.data.data || [])
    } catch (error) {
      console.error('Failed to load ledgers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      await ledgerApi.create({ name: newName })
      setNewName('')
      setShowAdd(false)
      loadData()
    } catch (error) {
      console.error('Failed to create ledger:', error)
    }
  }

  const handleEdit = (ledger: Ledger) => {
    setEditingId(ledger.id)
    setEditName(ledger.name)
  }

  const handleSave = async (id: number) => {
    if (!editName.trim()) return
    try {
      await ledgerApi.update(id, { name: editName })
      setEditingId(null)
      loadData()
    } catch (error) {
      console.error('Failed to update ledger:', error)
    }
  }

  const handleDelete = async (id: number) => {
    setPendingDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return
    try {
      await ledgerApi.delete(pendingDeleteId)
      loadData()
    } catch (error) {
      console.error('Failed to delete ledger:', error)
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
      {/* 顶部标题栏 */}
      <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">{t('ledger.title')}</span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {ledgers.map((ledger) => (
          <Card key={ledger.id}>
            <CardContent className="p-4 flex items-center justify-between">
              {editingId === ledger.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost" onClick={() => handleSave(ledger.id)}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="font-medium">{ledger.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ledger.is_default ? t('ledger.default') : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(ledger)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!ledger.is_default && (
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(ledger.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {showAdd ? (
          <Card>
            <CardContent className="p-4 flex items-center gap-2">
              <Input
                placeholder={t('ledger.namePlaceholder')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
              />
              <Button size="icon" variant="ghost" onClick={handleAdd}>
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setShowAdd(false)}>
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('ledger.addLedger')}
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t('confirm.deleteLedger')}
        description={t('confirm.deleteLedgerDesc')}
        confirmText={t('confirm.delete')}
        cancelText={t('confirm.cancel')}
      />
    </div>
  )
}
