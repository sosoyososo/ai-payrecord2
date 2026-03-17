import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { userApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, User, Lock, Save, Loader2, Download, Moon, Sun, Monitor, Wallet, Globe } from 'lucide-react'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Profile form
  const [nickname, setNickname] = useState(user?.nickname || '')

  // Password form
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await userApi.updateProfile({ nickname: nickname || undefined })
      await refreshUser()
      setMessage(t('settings.profileUpdated'))
    } catch (error: any) {
      setMessage(error.response?.data?.message || t('settings.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setMessage(t('settings.passwordMismatch'))
      return
    }

    if (newPassword.length < 6) {
      setMessage(t('settings.passwordTooShort'))
      return
    }

    setLoading(true)
    setMessage('')
    try {
      await userApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage(t('settings.passwordChanged'))
    } catch (error: any) {
      setMessage(error.response?.data?.message || t('settings.passwordChangeFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">{t('settings.title')}</span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Theme Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              {t('settings.appearance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-2" />
                {t('settings.light')}
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-2" />
                {t('settings.dark')}
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="flex-1"
              >
                <Monitor className="h-4 w-4 mr-2" />
                {t('settings.system')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('settings.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={i18n.language === 'zh' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLanguageChange('zh')}
                className="flex-1"
              >
                中文
              </Button>
              <Button
                variant={i18n.language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLanguageChange('en')}
                className="flex-1"
              >
                English
              </Button>
            </div>
          </CardContent>
        </Card>

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('失败') || message.includes('不一致') || message.includes('至少') || message.includes('Failed') || message.includes('mismatch') || message.includes('short')
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-600'
          }`}>
            {message}
          </div>
        )}

        {/* Profile Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('settings.profile')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('settings.username')}</label>
                <Input value={user?.username || ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('settings.email')}</label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('settings.nickname')}</label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('settings.nicknamePlaceholder')}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {t('common.save')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('settings.changePassword')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('settings.currentPassword')}</label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder={t('settings.currentPasswordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('settings.newPassword')}</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.newPasswordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">{t('settings.confirmPassword')}</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !oldPassword || !newPassword}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                {t('settings.changePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <Link
              to="/budget"
              className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span>{t('settings.budgetSettings')}</span>
              </div>
            </Link>
            <Link
              to="/export"
              className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span>{t('settings.exportData')}</span>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Ledger App</p>
              <p className="text-xs mt-1">Version 1.0.0</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
