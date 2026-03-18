import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { statsApi, ledgerApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { SummaryStats, CategoryStats, Ledger } from '@/types'
import { LedgerSelector } from '@/components/LedgerSelector'
import { ArrowLeft } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export default function StatsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [currentLedger, setCurrentLedger] = useState<Ledger | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'category' | 'monthly'>('overview')

  useEffect(() => {
    loadData()
  }, [year, currentLedger?.id])

  const loadData = async (ledgerId?: number) => {
    setLoading(true)
    try {
      const targetLedgerId = ledgerId ?? currentLedger?.id
      const [ledgersRes, currentRes, summaryRes, categoryRes] = await Promise.all([
        ledgerApi.list(),
        ledgerApi.getCurrent(),
        statsApi.getSummary(year, targetLedgerId),
        statsApi.getByCategory({
          ledger_id: targetLedgerId,
          type: 1, // expense
        }),
      ])

      setLedgers(ledgersRes.data.data)
      if (!ledgerId) {
        setCurrentLedger(currentRes.data.data)
      }
      setSummary(summaryRes.data.data)
      setCategoryStats(categoryRes.data.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchLedger = async (ledgerId: number) => {
    await ledgerApi.setCurrent(ledgerId)
    const newLedger = ledgers.find(l => l.id === ledgerId)
    setCurrentLedger(newLedger || null)
    loadData(ledgerId)
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (loading && !summary) {
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
          <span className="font-semibold text-lg">{t('stats.title')}</span>
        </div>
      </header>

      {/* Year Selector */}
      <div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('stats.year')}</span>
        <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
          <SelectTrigger className="ml-auto w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ledger Selector */}
      <div className="max-w-md mx-auto px-4 py-3">
        <LedgerSelector
          ledgers={ledgers}
          currentLedger={currentLedger}
          onChange={switchLedger}
        />
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-4 py-2 flex gap-2">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          {t('stats.overview')}
        </Button>
        <Button
          variant={activeTab === 'category' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('category')}
        >
          {t('stats.byCategory')}
        </Button>
        <Button
          variant={activeTab === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('monthly')}
        >
          {t('stats.monthly')}
        </Button>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {activeTab === 'overview' && summary && summary.monthly_stats && summary.monthly_stats.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1">{t('home.income')}</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    ¥{formatAmount(summary.total_income)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-red-600 dark:text-red-400 mb-1">{t('addRecord.expense')}</div>
                  <div className="text-lg font-bold text-red-700 dark:text-red-300">
                    ¥{formatAmount(summary.total_expense)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">{t('home.balance')}</div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    ¥{formatAmount(summary.balance)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('stats.monthlyTrend')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summary.monthly_stats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => `¥${formatAmount(Number(value) || 0)}`}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: '#10B981' }}
                        name={t('home.income')}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={{ fill: '#EF4444' }}
                        name={t('addRecord.expense')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'category' && categoryStats && categoryStats.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('category.expenseCategory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="total_amount"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `¥${formatAmount(Number(value) || 0)}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category List */}
              <div className="mt-4 space-y-2">
                {categoryStats.map((stat, index) => (
                  <div key={stat.category_id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="flex-1 text-sm">{stat.category_name}</span>
                    <span className="text-sm font-medium">¥{formatAmount(stat.total_amount)}</span>
                    <span className="text-xs text-muted-foreground">({stat.percentage.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'monthly' && summary && summary.monthly_stats && summary.monthly_stats.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('stats.monthly')} {t('stats.overview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.monthly_stats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => `¥${formatAmount(Number(value) || 0)}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="expense" fill="#EF4444" name={t('addRecord.expense')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="income" fill="#10B981" name={t('home.income')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
