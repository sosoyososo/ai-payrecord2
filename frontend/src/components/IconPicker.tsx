import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// 100 preset icons for category selection
const ICON_LIST = [
  // 餐饮类 (15)
  'Utensils', 'Coffee', 'Pizza', 'IceCream', 'Cake', 'Beer', 'Wine', 'Sandwich', 'Apple', 'Cookie', 'ChefHat', 'UtensilsCrossed', 'GlassWater', 'BowlRice', 'Soup',
  // 交通类 (10)
  'Car', 'Bus', 'Train', 'Plane', 'Bike', 'Ship', 'Truck', 'Fuel', 'Gauge', 'Navigation',
  // 购物类 (10)
  'ShoppingBag', 'ShoppingCart', 'CreditCard', 'Gift', 'Package', 'Store', 'Tag', 'Percent', 'Ticket', 'Wallet',
  // 居住类 (10)
  'Home', 'Lamp', 'Sofa', 'Bed', 'Bath', 'WashingMachine', 'Refrigerator', 'Microwave', 'Flame', 'Plug',
  // 娱乐类 (10)
  'Gamepad2', 'Music', 'Film', 'Tv', 'BookOpen', 'Newspaper', 'Camera', 'Images', 'Headphones', 'Mic',
  // 健康类 (8)
  'HeartPulse', 'Stethoscope', 'Pill', 'Syringe', 'Thermometer', 'Activity', 'Wind', 'Eye',
  // 教育类 (8)
  'GraduationCap', 'Book', 'Lightbulb', 'Pen', 'Ruler', 'Calculator', 'Globe', 'Languages',
  // 通讯类 (5)
  'Smartphone', 'Mail', 'Phone', 'MessageCircle', 'Signal',
  // 金融类 (8)
  'TrendingUp', 'TrendingDown', 'DollarSign', 'Euro', 'Bitcoin', 'Landmark', 'Receipt', 'PiggyBank',
  // 生活类 (8)
  'MoreHorizontal', 'MoreVertical', 'Smile', 'Sun', 'Moon', 'Cloud', 'Umbrella', 'Leaf',
  // 服饰类 (4)
  'Shirt', 'Watch', 'Gem', 'Crown',
  // 宠物类 (4)
  'Dog', 'Cat', 'Bird', 'Fish',
]

const ICON_CATEGORIES: Record<string, string[]> = {
  'food': ['Utensils', 'Coffee', 'Pizza', 'IceCream', 'Cake', 'Beer', 'Wine', 'Sandwich', 'Apple', 'Cookie', 'ChefHat', 'UtensilsCrossed', 'GlassWater', 'BowlRice', 'Soup'],
  'transport': ['Car', 'Bus', 'Train', 'Plane', 'Bike', 'Ship', 'Truck', 'Fuel', 'Gauge', 'Navigation'],
  'shopping': ['ShoppingBag', 'ShoppingCart', 'CreditCard', 'Gift', 'Package', 'Store', 'Tag', 'Percent', 'Ticket', 'Wallet'],
  'home': ['Home', 'Lamp', 'Sofa', 'Bed', 'Bath', 'WashingMachine', 'Refrigerator', 'Microwave', 'Flame', 'Plug'],
  'entertainment': ['Gamepad2', 'Music', 'Film', 'Tv', 'BookOpen', 'Newspaper', 'Camera', 'Images', 'Headphones', 'Mic'],
  'health': ['HeartPulse', 'Stethoscope', 'Pill', 'Syringe', 'Thermometer', 'Activity', 'Wind', 'Eye'],
  'education': ['GraduationCap', 'Book', 'Lightbulb', 'Pen', 'Ruler', 'Calculator', 'Globe', 'Languages'],
  'communication': ['Smartphone', 'Mail', 'Phone', 'MessageCircle', 'Signal'],
  'finance': ['TrendingUp', 'TrendingDown', 'DollarSign', 'Euro', 'Bitcoin', 'Landmark', 'Receipt', 'PiggyBank'],
  'lifestyle': ['MoreHorizontal', 'MoreVertical', 'Smile', 'Sun', 'Moon', 'Cloud', 'Umbrella', 'Leaf'],
  'fashion': ['Shirt', 'Watch', 'Gem', 'Crown'],
  'pets': ['Dog', 'Cat', 'Bird', 'Fish'],
}

interface IconPickerProps {
  selectedIcon: string
  onSelect: (icon: string) => void
  className?: string
}

export function IconPicker({ selectedIcon, onSelect, className }: IconPickerProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredIcons = useMemo(() => {
    let icons = ICON_LIST

    // Filter by category
    if (activeCategory) {
      icons = ICON_CATEGORIES[activeCategory] || []
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      icons = icons.filter(icon => icon.toLowerCase().includes(query))
    }

    return icons
  }, [searchQuery, activeCategory])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('iconPicker.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={activeCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory(null)}
        >
          {t('iconPicker.all')}
        </Button>
        {Object.entries(ICON_CATEGORIES).map(([key]) => (
          <Button
            key={key}
            variant={activeCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(key)}
          >
            {t(`iconPicker.${key}`)}
          </Button>
        ))}
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
        {filteredIcons.map((iconName) => {
          const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ size?: number }>
          if (!IconComponent) return null

          const isSelected = selectedIcon === iconName

          return (
            <button
              key={iconName}
              onClick={() => onSelect(iconName)}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              <IconComponent size={20} />
            </button>
          )
        })}
      </div>

      {filteredIcons.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t('iconPicker.noMatch')}
        </div>
      )}
    </div>
  )
}
