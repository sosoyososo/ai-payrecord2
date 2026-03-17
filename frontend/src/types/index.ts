export interface User {
  id: number
  username: string
  email: string
  nickname?: string
  avatar?: string
  status: number
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface Ledger {
  id: number
  user_id: number
  name: string
  icon?: string
  color?: string
  is_default: boolean
  sort_order: number
  status: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  user_id: number
  name: string
  icon?: string
  color?: string
  type: CategoryType
  is_system: boolean
  sort_order: number
  status: number
  created_at: string
  updated_at: string
}

export type CategoryType = 1 | 2 | 3 // 1=income, 2=expense, 3=transfer

export interface Tag {
  id: number
  user_id: number
  name: string
  color?: string
  is_system: boolean
  sort_order: number
  status: number
  created_at: string
  updated_at: string
}

export interface Record {
  id: number
  user_id: number
  ledger_id: number
  category_id: number
  amount: number
  type: RecordType
  date: string
  note?: string
  image_url?: string
  location?: string
  source?: string
  status: number
  category?: Category
  tags?: Tag[]
  created_at: string
  updated_at: string
}

export type RecordType = 1 | 2 | 3 // 1=expense, 2=income, 3=transfer

export interface PageResponse<T> {
  total: number
  page: number
  page_size: number
  data: T[]
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface SummaryStats {
  total_income: number
  total_expense: number
  income_count: number
  expense_count: number
  balance: number
  monthly_stats: MonthlyStats[]
}

export interface MonthlyStats {
  month: string
  income: number
  expense: number
  income_count: number
  expense_count: number
}

export interface CategoryStats {
  category_id: number
  category_name: string
  category_icon?: string
  category_color?: string
  total_amount: number
  count: number
  percentage: number
}
