import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { statsApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'

export default function BudgetPage() {
  const navigate = useNavigate()
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
      const statsRes = await statsApi.getSummary(new Date().getFullYear())
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
    alert('预算已保存')
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">预算设置</span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Budget Setting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">月度预算</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">预算金额 (¥)</label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="设置每月预算"
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              保存预算
            </Button>
          </CardContent>
        </Card>

        {/* Current Month Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">本月支出</CardTitle>
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
                percent > 100 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
              }`}>
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  {percent > 100
                    ? `已超出预算 ¥${Math.abs(remaining).toFixed(2)}`
                    : `预算剩余 ¥${remaining.toFixed(2)}`}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>已使用 {percent.toFixed(0)}%</span>
              <span>剩余 ¥{remaining.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              设置月度预算可以帮助您更好地控制支出。当支出达到预算的 80% 时会提醒您。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
