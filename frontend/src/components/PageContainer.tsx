import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useHeader } from '@/contexts/HeaderContext'
import SwipeBack from './SwipeBack'
import { Plus } from 'lucide-react'

interface PageContainerProps {
  title?: string
  showBackButton?: boolean
  enableSwipeBack?: boolean
  fab?: { to: string }
  children: React.ReactNode
}

export default function PageContainer({
  title,
  showBackButton = false,
  enableSwipeBack = true,
  fab,
  children,
}: PageContainerProps) {
  const { setConfig } = useHeader()

  useEffect(() => {
    setConfig({
      title,
      showBackButton,
    })
    return () => setConfig({})
  }, [title, showBackButton, setConfig])

  // 底部 padding：TabBar 高度 3.5rem + 安全区
  const bottomPadding = 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]'

  // FAB 位置
  const fabBottom = 'bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)]'

  return (
    <SwipeBack enabled={enableSwipeBack}>
      <div className={`flex-1 ${bottomPadding}`}>
        {children}
      </div>
      {fab && (
        <Link
          to={fab.to}
          className={`fixed right-6 ${fabBottom} w-14 h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center btn-press fab-pulse`}
        >
          <Plus className="h-6 w-6" />
        </Link>
      )}
    </SwipeBack>
  )
}
