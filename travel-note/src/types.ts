export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export interface Travel {
  id: string
  title: string
  date_start: string | null
  date_end: string | null
  order: number
}

export interface ItineraryItem {
  id: string
  order: number
  date: string
  time: string | null
  title: string
  location: string | null
  map_url: string | null
  note: string | null
}

export type DocumentCategory = '住宿' | '機票' | '交通' | '票券' | '火車' | '簽證' | '其他'

export interface DocumentItem {
  id: string
  order: number
  category: DocumentCategory | string
  title: string
  date_start: string | null
  date_end: string | null
  link: string | null
  note: string | null
}

export type InfoCategory = '工具' | '靈感' | '緊急聯絡' | string

export interface InfoItem {
  id: string
  order: number
  category: InfoCategory
  title: string
  link: string | null
  note: string | null
  is_checked: boolean
}

export interface ChecklistItem {
  id: string
  order: number
  category: string | null
  title: string
  note: string | null
  is_checked: boolean
}
