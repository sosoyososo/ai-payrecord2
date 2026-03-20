import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setError('')
    setLoading(true)

    try {
      await authApi.forgotPassword({ email })
      setSuccess(true)
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
              {t('auth.resetCodeSent')}
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              {t('auth.verifyEmailDesc')}
            </p>
            <Button
              variant="link"
              className="mt-4"
              onClick={() => navigate('/reset-password')}
            >
              {t('auth.resetPasswordTitle')}
            </Button>
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
            {t('auth.forgotPasswordTitle')}
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.forgotPassword')}
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
