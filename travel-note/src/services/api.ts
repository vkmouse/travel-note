import type { ApiResponse, ChecklistItem, DocumentItem, InfoItem, ItineraryItem, PendingInvitation, Travel, TravelExportPayload, TravelMembers } from '../types'
import { getAccessHeaders, refreshAccessToken } from './auth'
import { SAMPLE_TRAVEL_PAYLOAD } from '../data/sampleTravel'

async function authorizedFetch(url: string, init: RequestInit = {}) {
  const request = () => fetch(url, {
    ...init,
    credentials: 'include',
    headers: { ...getAccessHeaders(), ...(init.headers ?? {}) },
  })
  let response = await request()
  if (response.status === 401 && await refreshAccessToken()) response = await request()
  return response
}

async function getJson<T>(url: string, errorLabel: string): Promise<T> {
  const res = await authorizedFetch(url)
  if (!res.ok) {
    throw new Error(`${errorLabel}（${res.status}）`)
  }
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) {
    throw new Error(body.error ?? errorLabel)
  }
  return body.data
}

async function sendJson<T>(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', payload: unknown, errorLabel: string): Promise<T> {
  const res = await authorizedFetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'DELETE' ? undefined : JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`${errorLabel}（${res.status}）`)
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) throw new Error(body.error ?? errorLabel)
  return body.data
}

const mutate = <T>(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', payload: unknown, label: string) =>
  sendJson<T>(url, method, payload, label)

export function fetchTravels(): Promise<Travel[]> {
  return getJson('/api/travels', '無法取得旅行清單')
}

// POST /api/travels 除了 title/date_start/date_end，也可以一次帶入
// itinerary / documents / info / checklist 陣列，用同一支 API 建立完整內容的旅行
// （不帶就等於建立空白旅行，帶了就等於「範例行程」「匯入旅行」）
export interface CreateTravelPayload {
  title: string
  date_start?: string
  date_end?: string
  itinerary?: TravelExportPayload['itinerary']
  documents?: TravelExportPayload['documents']
  info?: TravelExportPayload['info']
  checklist?: TravelExportPayload['checklist']
}
export interface CreateTravelResult {
  travel: Travel
  inserted: Record<string, number>
}

export function createTravel(payload: CreateTravelPayload): Promise<CreateTravelResult> {
  return mutate<CreateTravelResult>('/api/travels', 'POST', payload, '新增旅行失敗')
}
export function updateTravel(id: string, payload: Partial<{ title: string; date_start: string; date_end: string }>) {
  return mutate<Travel>(`/api/travels/${id}`, 'PUT', payload, '更新旅行失敗')
}
export function deleteTravel(id: string) {
  return mutate<{ id: string }>(`/api/travels/${id}`, 'DELETE', undefined, '刪除旅行失敗')
}

// 範例行程：資料本身寫在前端 src/data/sampleTravel.ts，
// 跟「匯入旅行」一樣都是組出完整 payload 後呼叫 createTravel()
export function loadSampleTravel(): Promise<CreateTravelResult> {
  return createTravel(SAMPLE_TRAVEL_PAYLOAD)
}

export function exportTravel(travelId: string): Promise<TravelExportPayload> {
  return getJson(`/api/travels/${travelId}/export`, '匯出失敗')
}
// 使用者貼上的是匯出格式（{ travel: {...}, itinerary, documents, info, checklist }），
// 這裡轉成 createTravel() 需要的扁平 payload，一樣打 POST /api/travels
export function importTravel(payload: unknown): Promise<CreateTravelResult> {
  const parsed = (payload ?? {}) as Record<string, unknown>
  const travel = (parsed.travel ?? {}) as Record<string, unknown>
  return createTravel({
    title: String(travel.title ?? ''),
    date_start: (travel.date_start as string | undefined) ?? undefined,
    date_end: (travel.date_end as string | undefined) ?? undefined,
    itinerary: parsed.itinerary as TravelExportPayload['itinerary'],
    documents: parsed.documents as TravelExportPayload['documents'],
    info: parsed.info as TravelExportPayload['info'],
    checklist: parsed.checklist as TravelExportPayload['checklist'],
  })
}

export function fetchTravelMembers(travelId: string): Promise<TravelMembers> {
  return getJson(`/api/travels/${travelId}/members`, '無法取得成員列表')
}
export function inviteMember(travelId: string, email: string) {
  return mutate<{ id: string; travel_id: string; email: string; status: string }>(
    `/api/travels/${travelId}/invitations`, 'POST', { email }, '邀請失敗',
  )
}
export function fetchMyInvitations(): Promise<PendingInvitation[]> {
  return getJson('/api/invitations', '無法取得邀請列表')
}
export function acceptInvitation(id: string) {
  return mutate<{ id: string; status: string }>(`/api/invitations/${id}/accept`, 'POST', undefined, '接受邀請失敗')
}
// 拒絕邀請、擁有者收回邀請、成員自行離開旅行，共用同一支 DELETE
export function declineInvitation(id: string) {
  return mutate<{ id: string }>(`/api/invitations/${id}`, 'DELETE', undefined, '操作失敗')
}

export function fetchItinerary(travelId: string): Promise<ItineraryItem[]> {
  return getJson(`/api/travels/${travelId}/itinerary`, '無法取得每日行程')
}

export function fetchDocuments(travelId: string): Promise<DocumentItem[]> {
  return getJson(`/api/travels/${travelId}/documents`, '無法取得旅行文件')
}

export function fetchInfo(travelId: string): Promise<InfoItem[]> {
  return getJson(`/api/travels/${travelId}/info`, '無法取得常用資訊')
}

export function fetchChecklist(travelId: string): Promise<ChecklistItem[]> {
  return getJson(`/api/travels/${travelId}/checklist`, '無法取得行前清單')
}

export function createItinerary(travelId: string, payload: Omit<ItineraryItem, 'id' | 'order'>) { return mutate<ItineraryItem>(`/api/travels/${travelId}/itinerary`, 'POST', payload, '新增行程失敗') }
export function updateItinerary(travelId: string, id: string, payload: Partial<Omit<ItineraryItem, 'id' | 'order'>>) { return mutate<ItineraryItem>(`/api/travels/${travelId}/itinerary/${id}`, 'PUT', payload, '更新行程失敗') }
export function deleteItinerary(travelId: string, id: string) { return mutate<{ id: string }>(`/api/travels/${travelId}/itinerary/${id}`, 'DELETE', undefined, '刪除行程失敗') }

export function createDocument(travelId: string, payload: Omit<DocumentItem, 'id' | 'order'>) { return mutate<DocumentItem>(`/api/travels/${travelId}/documents`, 'POST', payload, '新增文件失敗') }
export function updateDocument(travelId: string, id: string, payload: Partial<Omit<DocumentItem, 'id' | 'order'>>) { return mutate<DocumentItem>(`/api/travels/${travelId}/documents/${id}`, 'PUT', payload, '更新文件失敗') }
export function deleteDocument(travelId: string, id: string) { return mutate<{ id: string }>(`/api/travels/${travelId}/documents/${id}`, 'DELETE', undefined, '刪除文件失敗') }

export function createInfo(travelId: string, payload: Omit<InfoItem, 'id' | 'order' | 'is_checked'>) { return mutate<InfoItem>(`/api/travels/${travelId}/info`, 'POST', payload, '新增資訊失敗') }
export function updateInfo(travelId: string, id: string, payload: Partial<Omit<InfoItem, 'id' | 'order' | 'is_checked'>>) { return mutate<InfoItem>(`/api/travels/${travelId}/info/${id}`, 'PUT', payload, '更新資訊失敗') }
export function patchInfoChecked(travelId: string, id: string, is_checked: boolean) { return mutate<InfoItem>(`/api/travels/${travelId}/info/${id}`, 'PATCH', { is_checked }, '更新資訊狀態失敗') }
export function deleteInfo(travelId: string, id: string) { return mutate<{ id: string }>(`/api/travels/${travelId}/info/${id}`, 'DELETE', undefined, '刪除資訊失敗') }

export function createChecklist(travelId: string, payload: Omit<ChecklistItem, 'id' | 'order' | 'is_checked'>) { return mutate<ChecklistItem>(`/api/travels/${travelId}/checklist`, 'POST', payload, '新增清單失敗') }
export function updateChecklist(travelId: string, id: string, payload: Partial<Omit<ChecklistItem, 'id' | 'order' | 'is_checked'>>) { return mutate<ChecklistItem>(`/api/travels/${travelId}/checklist/${id}`, 'PUT', payload, '更新清單失敗') }
export function patchChecklistChecked(travelId: string, id: string, is_checked: boolean) { return mutate<ChecklistItem>(`/api/travels/${travelId}/checklist/${id}`, 'PATCH', { is_checked }, '更新清單狀態失敗') }
export function deleteChecklist(travelId: string, id: string) { return mutate<{ id: string }>(`/api/travels/${travelId}/checklist/${id}`, 'DELETE', undefined, '刪除清單失敗') }
