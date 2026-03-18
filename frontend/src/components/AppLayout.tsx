import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, BarChart3, PiggyBank, Settings, Wallet } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/stats', icon: BarChart3, label: '统计' },
  { path: '/budget', icon: PiggyBank, label: '预算' },
  { path: '/settings', icon: Settings, label: '设置' },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkScreen = () => {
      setIsDesktop(window.innerWidth > 1024)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  // 如果未登录，显示登录页面
  if (!user) {
    return <Outlet />
  }

  // PC: 左侧导航栏
  if (isDesktop) {
    return (
      <div className="flex min-h-screen dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100">
        {/* 左侧导航 */}
        <nav className="fixed left-0 top-0 h-full w-56 bg-white dark:bg-slate-900 border-r dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">账本</span>
            </div>
          </div>
          <div className="flex-1 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
        {/* 主内容区 */}
        <div className="flex-1 ml-56">
          <div className="max-w-3xl mx-auto p-6">
            <Outlet />
          </div>
        </div>
      </div>
    )
  }

  // 手机/平板: 底部导航 + 内容区
  return (
    <div className="min-h-screen pb-16 dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100">
      <Outlet />
      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-700 safe-area-bottom">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
