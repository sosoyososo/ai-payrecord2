import { useNavigate } from 'react-router-dom'
import { useHeader } from '@/contexts/HeaderContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Wallet } from 'lucide-react'

export default function AppHeader() {
  const navigate = useNavigate()
  const { config } = useHeader()

  if (config.customLeft || config.customRight) {
    return (
      <header className="bg-white dark:bg-slate-900 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.customLeft}
          </div>
          <div className="flex items-center gap-2">
            {config.customRight}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        {config.showBackButton && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {config.title ? (
          <span className="font-semibold text-lg">{config.title}</span>
        ) : (
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>
    </header>
  )
}
