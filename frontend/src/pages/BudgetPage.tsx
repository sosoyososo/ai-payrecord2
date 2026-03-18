import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { statsApi, ledgerApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'

export default function BudgetPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [monthlyExpense, setMonthlyExpense] = useState(0)
  const [budget, setBudget] = useState(() => {
    return localStorage.getItem('monthly_budget') || '3000'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const ledgerRes = await ledgerApi.getCurrent()
      const ledgerId = ledgerRes.data.data?.id
      const statsRes = await statsApi.getSummary(new Date().getFullYear(), ledgerId)
      const stats = statsRes.data.data
      // Get current month expense
      const currentMonth = new Date().getMonth()
      const monthStats = stats.monthly_stats[currentMonth]
      setMonthlyExpense(monthStats?.expense || 0)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    localStorage.setItem('monthly_budget', budget)
    alert(t('budget.saved'))
  }

  const budgetAmount = parseFloat(budget) || 0
  const percent = budgetAmount > 0 ? (monthlyExpense / budgetAmount) * 100 : 0
  const remaining = budgetAmount - monthlyExpense

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 pb-24">
      <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">{t('budget.title')}</span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Budget Setting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('budget.monthlyBudget')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('budget.budgetAmount')} (¥)</label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={t('budget.description')}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {t('budget.saveBudget')}
            </Button>
          </CardContent>
        </Card>

        {/* Current Month Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('budget.thisMonthExpense')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold">¥{monthlyExpense.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                / ¥{budgetAmount.toFixed(2)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  percent > 100 ? 'bg-red-500' : percent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>

            {percent >= 80 && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                percent > 100 ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400' : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400'
              }`}>
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  {percent > 100
                    ? t('budget.overBudget', { amount: Math.abs(remaining).toFixed(2) })
                    : t('budget.budgetRemaining', { amount: remaining.toFixed(2) })}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('budget.used')} {percent.toFixed(0)}%</span>
              <span>{t('budget.remaining')} ¥{remaining.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {t('budget.description')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
