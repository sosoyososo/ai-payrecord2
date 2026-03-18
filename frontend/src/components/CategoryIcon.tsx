import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CategoryIconProps {
  icon: string
  size?: number
  className?: string
}

export function CategoryIcon({
  icon,
  size = 20,
  className = '',
}: CategoryIconProps) {
  // Dynamic icon lookup - Lucide React icons are exported as PascalCase
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[icon]

  if (!IconComponent) {
    // Fallback to HelpCircle if icon not found
    const FallbackIcon = LucideIcons.HelpCircle
    return <FallbackIcon size={size} className={className} />
  }

  return <IconComponent size={size} className={className} />
}
