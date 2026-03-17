import axios from 'axios'
import type {
  AuthResponse,
  User,
  Ledger,
  Category,
  Tag,
  Record,
  PageResponse,
  SummaryStats,
  CategoryStats,
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  register: (data: { username: string; email: string; password: string; nickname?: string }) =>
    api.post<{ code: number; message: string; data: AuthResponse }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ code: number; message: string; data: AuthResponse }>('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post<{ code: number; message: string; data: AuthResponse }>('/auth/refresh', {
      refresh_token: refreshToken,
    }),

  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refresh_token: refreshToken }),
}

// User API
export const userApi = {
  getProfile: () => api.get<{ code: number; message: string; data: User }>('/user/profile'),

  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    api.put<{ code: number; message: string; data: User }>('/user/profile', data),

  changePassword: (data: { old_password: string; new_password: string }) =>
    api.put('/user/password', data),
}

// Ledger API
export const ledgerApi = {
  list: () => api.get<{ code: number; message: string; data: Ledger[] }>('/ledgers'),

  getCurrent: () => api.get<{ code: number; message: string; data: Ledger }>('/ledgers/current'),

  create: (data: { name: string; icon?: string; color?: string; is_default?: boolean }) =>
    api.post<{ code: number; message: string; data: Ledger }>('/ledgers', data),

  update: (id: number, data: Partial<Ledger>) =>
    api.put<{ code: number; message: string; data: Ledger }>(`/ledgers/${id}`, data),

  delete: (id: number) => api.delete(`/ledgers/${id}`),

  setCurrent: (ledgerId: number) =>
    api.put<{ code: number; message: string }>('/ledgers/current', { ledger_id: ledgerId }),
}

// Category API
export const categoryApi = {
  list: (type?: number) =>
    api.get<{ code: number; message: string; data: Category[] }>('/categories', {
      params: type ? { type } : undefined,
    }),

  create: (data: { name: string; icon?: string; color?: string; type: number }) =>
    api.post<{ code: number; message: string; data: Category }>('/categories', data),

  update: (id: number, data: Partial<Category>) =>
    api.put<{ code: number; message: string; data: Category }>(`/categories/${id}`, data),

  delete: (id: number) => api.delete(`/categories/${id}`),
}

// Tag API
export const tagApi = {
  list: () => api.get<{ code: number; message: string; data: Tag[] }>('/tags'),

  create: (data: { name: string; color?: string }) =>
    api.post<{ code: number; message: string; data: Tag }>('/tags', data),

  update: (id: number, data: Partial<Tag>) =>
    api.put<{ code: number; message: string; data: Tag }>(`/tags/${id}`, data),

  delete: (id: number) => api.delete(`/tags/${id}`),
}

// Record API
export const recordApi = {
  list: (params: {
    ledger_id?: number
    start_date?: string
    end_date?: string
    type?: number
    page?: number
    page_size?: number
  }) =>
    api.get<{ code: number; message: string; data: PageResponse<Record> }>('/records', {
      params,
    }),

  get: (id: number) =>
    api.get<{ code: number; message: string; data: Record }>(`/records/${id}`),

  create: (data: {
    ledger_id: number
    category_id: number
    amount: number
    type: number
    date: string
    note?: string
    tag_ids?: number[]
  }) => api.post<{ code: number; message: string; data: Record }>('/records', data),

  update: (id: number, data: Partial<Record> & { tag_ids?: number[] }) =>
    api.put<{ code: number; message: string; data: Record }>(`/records/${id}`, data),

  delete: (id: number) => api.delete(`/records/${id}`),
}

// Stats API
export const statsApi = {
  getSummary: (year?: number, ledger_id?: number) =>
    api.get<{ code: number; message: string; data: SummaryStats }>('/stats/summary', {
      params: { year, ledger_id },
    }),

  getByCategory: (params: { start_date?: string; end_date?: string; ledger_id?: number; type?: number }) =>
    api.get<{ code: number; message: string; data: CategoryStats[] }>('/stats/by-category', {
      params,
    }),

  getMonthly: (year?: number, ledger_id?: number) =>
    api.get<{ code: number; message: string; data: any[] }>('/stats/monthly', {
      params: { year, ledger_id },
    }),
}

// LLM API
export const llmApi = {
  parse: (text: string) =>
    api.post<{ code: number; message: string; data: any }>('/llm/parse', { text }),

  confirmRecord: (data: {
    amount: number
    category_id: number
    type: number
    date: string
    note?: string
    tag_ids?: number[]
    new_category_name?: string
  }) => api.post<{ code: number; message: string; data: Record }>('/llm/records', data),
}

export default api
