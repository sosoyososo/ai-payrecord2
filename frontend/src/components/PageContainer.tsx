import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useHeader } from '@/contexts/HeaderContext'
import { Plus } from 'lucide-react'

interface PageContainerProps {
  title?: string
  showBackButton?: boolean
  headerRight?: React.ReactNode
  fab?: { to: string }
  children: React.ReactNode
}

export default function PageContainer({
  title,
  showBackButton = false,
  headerRight,
  fab,
  children,
}: PageContainerProps) {
  const { setConfig } = useHeader()

  useEffect(() => {
    setConfig({
      title,
      showBackButton,
      customRight: headerRight,
    })
    return () => setConfig({})
  }, [title, showBackButton, headerRight, setConfig])

  // 底部 padding：TabBar 高度 3.5rem + 安全区
  const bottomPadding = 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]'

  // FAB 位置
  const fabBottom = 'bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)]'

  return (
    <div className="flex-1 flex flex-col">
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
    </div>
  )
}
