import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { recordApi, ledgerApi, statsApi } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Record, Ledger, SummaryStats } from '@/types'
import { Plus, TrendingUp, TrendingDown, Wallet, LogOut, BarChart3, Settings, BookOpen, Tag, User } from 'lucide-react'

export default function HomePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [records, setRecords] = useState<Record[]>([])
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [currentLedger, setCurrentLedger] = useState<Ledger | null>(null)
  const [summary, setSummary] = useState<SummaryStats | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ledgersRes, currentRes, recordsRes, summaryRes] = await Promise.all([
        ledgerApi.list(),
        ledgerApi.getCurrent(),
        recordApi.list({ page: 1, page_size: 20 }),
        statsApi.getSummary(new Date().getFullYear()),
      ])

      // Handle ledgers: { code, message, data: Ledger[] }
      setLedgers(ledgersRes.data.data || [])
      setCurrentLedger(currentRes.data.data || null)

      // Handle records: { code, message, data: { total, page, page_size, data: Record[] } }
      const recordsData = recordsRes.data.data
      setRecords(recordsData?.data || [])

      // Handle summary: { code, message, data: SummaryStats }
      setSummary(summaryRes.data.data || null)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const switchLedger = async (ledgerId: number) => {
    await ledgerApi.setCurrent(ledgerId)
    loadData()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const formatAmount = (amount: number, type: number) => {
    const prefix = type === 2 ? '+' : '-'
    return `${prefix}¥${amount.toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">{currentLedger?.name || '账本'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/stats">
                <BarChart3 className="h-5 w-5" />
              </Link>
            </Button>
            <div className="relative group">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border hidden group-hover:block z-50">
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-t-lg"
                >
                  <User className="h-4 w-4" />
                  <span>个人设置</span>
                </Link>
                <Link
                  to="/ledgers"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>账本管理</span>
                </Link>
                <Link
                  to="/categories"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100"
                >
                  <Tag className="h-4 w-4" />
                  <span>分类管理</span>
                </Link>
                <Link
                  to="/tags"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-b-lg"
                >
                  <Tag className="h-4 w-4" />
                  <span>标签管理</span>
                </Link>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Ledger Selector */}
      {ledgers.length > 1 && (
        <div className="max-w-md mx-auto px-4 py-3 overflow-x-auto flex gap-2">
          {ledgers.map((ledger) => (
            <button
              key={ledger.id}
              onClick={() => switchLedger(ledger.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                currentLedger?.id === ledger.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted-foreground hover:bg-slate-100'
              }`}
            >
              {ledger.name}
            </button>
          ))}
        </div>
      )}

      {/* Summary Card */}
      <div className="max-w-md mx-auto px-4 py-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
          <CardContent className="p-6">
            <div className="text-sm opacity-80 mb-1">本月支出</div>
            <div className="text-3xl font-bold mb-4">
              ¥{(summary?.total_expense || 0).toFixed(2)}
            </div>
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 opacity-80" />
                <span className="opacity-80">收入</span>
                <span className="font-medium">¥{(summary?.total_income || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-4 w-4 opacity-80" />
                <span className="opacity-80">结余</span>
                <span className="font-medium">¥{(summary?.balance || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
      <div className="max-w-md mx-auto px-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">最近记录</h2>
        </div>

        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: record.category?.color || '#666' }}
                  >
                    {record.category?.icon?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium">{record.category?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(record.date)}
                      {record.note && ` · ${record.note}`}
                    </div>
                  </div>
                </div>
                <div
                  className={`font-semibold ${
                    record.type === 2 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatAmount(record.amount, record.type)}
                </div>
              </CardContent>
            </Card>
          ))}

          {records.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No records yet</p>
              <p className="text-sm">Click + to add your first record</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <Link
        to="/add"
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center hover:bg-accent/90 transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
