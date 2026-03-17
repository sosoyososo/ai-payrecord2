import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { userApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, User, Lock, Save, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Profile form
  const [nickname, setNickname] = useState(user?.nickname || '')

  // Password form
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await userApi.updateProfile({ nickname: nickname || undefined })
      await refreshUser()
      setMessage('个人信息已更新')
    } catch (error: any) {
      setMessage(error.response?.data?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setMessage('两次输入的密码不一致')
      return
    }

    if (newPassword.length < 6) {
      setMessage('密码长度至少6位')
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
      setMessage('密码已修改')
    } catch (error: any) {
      setMessage(error.response?.data?.message || '修改密码失败')
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
          <span className="font-semibold text-lg">设置</span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('失败') || message.includes('不一致') || message.includes('至少')
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
              个人信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">用户名</label>
                <Input value={user?.username || ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">邮箱</label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">昵称</label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="设置昵称"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                保存
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />
              修改密码
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">当前密码</label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="输入当前密码"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">新密码</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">确认新密码</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !oldPassword || !newPassword}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                修改密码
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>账本 App</p>
              <p className="text-xs mt-1">Version 1.0.0</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
