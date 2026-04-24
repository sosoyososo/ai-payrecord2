import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface SwipeBackProps {
  enabled?: boolean
  children: React.ReactNode
}

export default function SwipeBack({ enabled = true, children }: SwipeBackProps) {
  const navigate = useNavigate()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // 只在左侧边缘触发
    if (e.touches[0].clientX > 50) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return
    if (e.touches[0].clientX > 50) return

    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = e.touches[0].clientY - touchStartY.current

    // 必须是左滑（deltaX > 0）
    if (deltaX < 0) return

    // 判断是否是左滑而非上下滑（水平距离 > 垂直距离）
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      // 可以添加视觉反馈，这里暂时不做
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return

    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current

    // 左滑超过 50px 且水平距离大于垂直距离
    if (deltaX > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      navigate(-1)
    }

    touchStartX.current = null
    touchStartY.current = null
  }, [navigate])

  useEffect(() => {
    if (!enabled) return

    const content = contentRef.current
    if (!content) return

    content.addEventListener('touchstart', handleTouchStart, { passive: true })
    content.addEventListener('touchmove', handleTouchMove, { passive: true })
    content.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      content.removeEventListener('touchstart', handleTouchStart)
      content.removeEventListener('touchmove', handleTouchMove)
      content.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div ref={contentRef} className="flex-1 flex flex-col">
      {children}
    </div>
  )
}
