import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { navItems } from '@/config/navigation'
import AppHeader from './AppHeader'
import { HeaderProvider } from '@/contexts/HeaderContext'

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [isDesktop, setIsDesktop] = useState(false)

  // Screen size check - must be called on every render before conditionals
  useEffect(() => {
    const checkScreen = () => {
      setIsDesktop(window.innerWidth > 1024)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  // Handle loading state - after all hooks
  if (loading) {
    return <Loading />
  }

  // Handle not authenticated - after all hooks
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Desktop layout with sidebar nav
  if (isDesktop) {
    return (
      <div className="flex min-h-screen dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100">
        <nav className="fixed left-0 top-0 h-full w-56 bg-white dark:bg-slate-900 border-r dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">{t('nav.appName')}</span>
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
                  <span>{t(item.labelKey)}</span>
                </button>
              )
            })}
          </div>
        </nav>
        <div className="flex-1 ml-56">
          <div className="max-w-3xl mx-auto p-6">
            <Outlet />
          </div>
        </div>
      </div>
    )
  }

  // Mobile layout with TabBar
  return (
    <HeaderProvider>
      <div className="h-screen dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 flex flex-col">
        <div className="pt-[env(safe-area-inset-top)] bg-white dark:bg-slate-900 shadow-sm">
          <AppHeader />
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
        <div className="pb-[env(safe-area-inset-bottom)] bg-white dark:bg-slate-900 border-t dark:border-slate-700">
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
                  <span className="text-xs mt-1">{t(item.labelKey)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </HeaderProvider>
  )
}