import { Home, BarChart3, Settings } from 'lucide-react'

export interface NavItem {
  path: string
  labelKey: string
  icon: typeof Home
}

export const navItems: NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/stats', labelKey: 'nav.stats', icon: BarChart3 },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
]
