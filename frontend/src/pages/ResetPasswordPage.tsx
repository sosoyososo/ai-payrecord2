import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !code || !newPassword) {
      setError(t('settings.updateFailed'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordMismatch'))
      return
    }

    if (newPassword.length < 6) {
      setError(t('settings.passwordTooShort'))
      return
    }

    setLoading(true)

    try {
      await authApi.resetPassword({ email, code, new_password: newPassword })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch {
      setError(t('auth.invalidCode'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6 text-center">
            <div className="text-green-500 text-lg font-medium">
              {t('auth.resetSuccess')}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br dark:from-slate-950 dark:to-slate-900 from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t('auth.resetPasswordTitle')}
          </CardTitle>
          <CardDescription>
            {t('auth.forgotPasswordDesc')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={t('auth.verificationCodePlaceholder')}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                required
                disabled={loading}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={t('auth.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 8 || !email || !newPassword || !confirmPassword}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
            <button
              type="button"
              className="text-muted-foreground hover:text-primary flex items-center justify-center w-full text-sm"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('auth.backToLogin')}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
