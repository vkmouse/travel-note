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
  is_owner: boolean
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

export interface TravelOwner {
  user_id: string
  email: string
}

export interface TravelMember {
  id: string
  user_id: string
  email: string
  status: 'pending' | 'accepted'
  invited_at: string
  accepted_at: string | null
}

export interface TravelMembers {
  owner: TravelOwner
  members: TravelMember[]
}

export interface PendingInvitation {
  id: string
  travel_id: string
  travel_title: string
  invited_by: string
  invited_by_email: string
  invited_at: string
}

// 匯出/匯入格式不帶 order：陣列順序本身就代表 order，匯入時依位置重新編號
export interface TravelExportPayload {
  type: 'travel-note.export'
  version: number
  travel_id: string
  travel: { title: string; date_start: string | null; date_end: string | null }
  itinerary: Array<{ date: string; time: string | null; title: string; location: string | null; map_url: string | null; note: string | null }>
  documents: Array<{ category: string; title: string; date_start: string | null; date_end: string | null; link: string | null; note: string | null }>
  info: Array<{ category: string; title: string; link: string | null; note: string | null; is_checked: boolean }>
  checklist: Array<{ category: string | null; title: string; note: string | null; is_checked: boolean }>
}
