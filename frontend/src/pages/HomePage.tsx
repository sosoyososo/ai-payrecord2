import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recordApi, ledgerApi, statsApi } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { LedgerSelector } from '@/components/LedgerSelector'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { CategoryIcon } from '@/components/CategoryIcon'
import type { Record, Ledger, SummaryStats } from '@/types'
import PageContainer from '@/components/PageContainer'
import { TrendingDown, Search, X, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { homeCache } from '@/stores/homeCache'

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [records, setRecords] = useState<Record[]>([])
  const [filteredRecords, setFilteredRecords] = useState<Record[]>([])
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [currentLedger, setCurrentLedger] = useState<Ledger | null>(null)
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    homeCache.clear()
    try {
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async (id: number) => {
    setPendingDeleteId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    setDeleteDialogOpen(false)
    try {
      await recordApi.delete(id)
      await loadData()
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  }

  useEffect(() => {
    const cached = homeCache.getCache()
    if (cached) {
      setRecords(cached.records)
      setFilteredRecords(cached.filteredRecords)
      setLedgers(cached.ledgers)
      setCurrentLedger(cached.currentLedger)
      setSummary(cached.summary)
      setSearchQuery(cached.searchQuery)
      setCurrentPage(cached.currentPage)
      setHasMore(cached.hasMore)
      setLoading(false)
      if (homeCache.isStale()) {
        loadData()
      }
    } else {
      loadData()
    }
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredRecords(filterRecords(records, searchQuery))
    } else {
      setFilteredRecords(records)
    }
  }, [searchQuery, records])

  const filterRecords = (recs: Record[], query: string) => {
    const q = query.toLowerCase()
    return recs.filter(
      (r) =>
        r.note?.toLowerCase().includes(q) ||
        r.category?.name.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.name.toLowerCase().includes(q))
    )
  }

  const loadData = async (targetLedgerId?: number, page: number = 1) => {
    try {
      const [ledgersRes, currentRes] = await Promise.all([
        ledgerApi.list(),
        ledgerApi.getCurrent(),
      ])
      const currentLedgerId = targetLedgerId ?? currentRes.data.data?.id
      const [recordsRes, summaryRes] = await Promise.all([
        recordApi.list({ ledger_id: currentLedgerId, page: page, page_size: 100 }),
        statsApi.getSummary(new Date().getFullYear(), currentLedgerId),
      ])

      setLedgers(ledgersRes.data.data || [])
      setCurrentLedger(currentRes.data.data || null)

      const recordsData = recordsRes.data.data
      const newRecords = recordsData?.data || []

      if (page === 1) {
        setRecords(newRecords)
        setFilteredRecords(searchQuery ? filterRecords(newRecords, searchQuery) : newRecords)
      } else {
        setRecords(prev => [...prev, ...newRecords])
        setFilteredRecords(prev => searchQuery ? filterRecords([...prev, ...newRecords], searchQuery) : [...prev, ...newRecords])
      }

      setCurrentPage(page)
      const total = recordsData?.total || 0
      const hasMoreData = (recordsData?.data?.length ?? 0) > 0 && (page * 100) < total
      setHasMore(hasMoreData)

      setSummary(summaryRes.data.data || null)

      // Cache successful first-page loads
      if (page === 1) {
        homeCache.setCache({
          records: newRecords,
          filteredRecords: searchQuery ? filterRecords(newRecords, searchQuery) : newRecords,
          ledgers: ledgersRes.data.data || [],
          currentLedger: currentRes.data.data || null,
          summary: summaryRes.data.data || null,
          searchQuery,
          currentPage: 1,
          hasMore: hasMoreData,
        })
      }

      setLoading(false)
      setLoadingMore(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
  if (!loadingMore && hasMore) {
    setLoadingMore(true)
    loadData(currentLedger?.id, currentPage + 1)
  }
}

const switchLedger = async (ledgerId: number) => {
  await ledgerApi.setCurrent(ledgerId)
  const newLedger = ledgers.find(l => l.id === ledgerId)
  setCurrentLedger(newLedger || null)
  setCurrentPage(1)
  setHasMore(true)
  loadData(ledgerId, 1)
}

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const formatAmount = (amount: number) => {
    return `-¥${amount.toFixed(2)}`
  }

  return (
    <PageContainer
      title={currentLedger?.name || t('nav.ledgers')}
      fab={{ to: '/add' }}
      headerRight={
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1 rounded-md hover:bg-accent transition-colors"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      {/* Ledger Selector */}
      <div className="max-w-md mx-auto px-4 py-3">
        <LedgerSelector
          ledgers={ledgers}
          currentLedger={currentLedger}
          onChange={switchLedger}
        />
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="max-w-md mx-auto px-4 py-4">
        {loading ? (
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-1 bg-white/20" />
              <Skeleton className="h-8 w-32 mb-4 bg-white/20" />
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden scale-enter">
            <CardContent className="p-6">
              <div className="text-sm opacity-80 mb-1">{t('home.monthlyExpense')}</div>
              <div className="text-3xl font-bold mb-4">
                ¥{(summary?.total_expense || 0).toFixed(2)}
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 opacity-80" />
                  <span className="font-medium">¥{(summary?.total_expense || 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Records List */}
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {searchQuery ? `${t('home.searchResults')} (${filteredRecords.length})` : t('home.recentRecords')}
          </h2>
        </div>

        <div className="space-y-3 stagger-children">
          {loading && (
            <>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-2/3" /></div></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-2/3" /></div></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-2/3" /></div></div></CardContent></Card>
            </>
          )}
          {filteredRecords.map((record) => (
            <Card key={record.id} className="card-hover cursor-pointer scale-enter">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                    style={{ backgroundColor: record.category?.color || '#666' }}
                  >
                    <CategoryIcon icon={record.category?.icon || 'HelpCircle'} size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{record.category?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {formatDate(record.date)}
                      {record.note && ` · ${record.note}`}
                    </div>
                    {record.tags && record.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {record.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: tag.color || '#666', color: '#fff' }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="font-semibold amount-animate text-red-600">
                    {formatAmount(record.amount)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/edit/${record.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(record.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && filteredRecords.length > 0 && hasMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  加载中...
                </span>
              ) : (
                '加载更多'
              )}
            </Button>
          </div>
        )}

          {!loading && filteredRecords.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>{searchQuery ? t('home.noMatchRecords') : t('home.noRecords')}</p>
              <p className="text-sm">{searchQuery ? t('home.tryOtherKeywords') : t('home.addFirst')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t('confirm.deleteRecord')}
        description={t('confirm.deleteRecordDesc')}
        confirmText={t('confirm.delete')}
        cancelText={t('confirm.cancel')}
      />
    </PageContainer>
  )
}
