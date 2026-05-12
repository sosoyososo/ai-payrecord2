import type { Record, Ledger, SummaryStats } from '@/types'

export interface HomeCacheData {
  records: Record[]
  filteredRecords: Record[]
  ledgers: Ledger[]
  currentLedger: Ledger | null
  summary: SummaryStats | null
  searchQuery: string
  currentPage: number
  hasMore: boolean
}

let cache: HomeCacheData | null = null
let stale = false

export function getCache(): HomeCacheData | null {
  return cache
}

export function setCache(data: HomeCacheData): void {
  cache = data
  stale = false
}

export function invalidate(): void {
  stale = true
}

export function isStale(): boolean {
  return stale
}

export function isValid(): boolean {
  return cache !== null
}

export function clear(): void {
  cache = null
  stale = false
}
