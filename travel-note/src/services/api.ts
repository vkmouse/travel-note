import type { ApiResponse, ChecklistItem, DocumentItem, InfoItem, ItineraryItem } from '../types'
import { getAccessHeaders, refreshAccessToken } from './auth'

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

export function fetchItinerary(): Promise<ItineraryItem[]> {
  return getJson('/api/itinerary', '無法取得每日行程')
}

export function fetchDocuments(): Promise<DocumentItem[]> {
  return getJson('/api/documents', '無法取得旅行文件')
}

export function fetchInfo(): Promise<InfoItem[]> {
  return getJson('/api/info', '無法取得常用資訊')
}

export function fetchChecklist(): Promise<ChecklistItem[]> {
  return getJson('/api/checklist', '無法取得行前清單')
}

export function createItinerary(payload: Omit<ItineraryItem, 'id' | 'order'>) { return mutate<ItineraryItem>('/api/itinerary', 'POST', payload, '新增行程失敗') }
export function updateItinerary(id: string, payload: Partial<Omit<ItineraryItem, 'id' | 'order'>>) { return mutate<ItineraryItem>(`/api/itinerary/${id}`, 'PUT', payload, '更新行程失敗') }
export function deleteItinerary(id: string) { return mutate<{ id: string }>(`/api/itinerary/${id}`, 'DELETE', undefined, '刪除行程失敗') }

export function createDocument(payload: Omit<DocumentItem, 'id' | 'order'>) { return mutate<DocumentItem>('/api/documents', 'POST', payload, '新增文件失敗') }
export function updateDocument(id: string, payload: Partial<Omit<DocumentItem, 'id' | 'order'>>) { return mutate<DocumentItem>(`/api/documents/${id}`, 'PUT', payload, '更新文件失敗') }
export function deleteDocument(id: string) { return mutate<{ id: string }>(`/api/documents/${id}`, 'DELETE', undefined, '刪除文件失敗') }

export function createInfo(payload: Omit<InfoItem, 'id' | 'order' | 'is_checked'>) { return mutate<InfoItem>('/api/info', 'POST', payload, '新增資訊失敗') }
export function updateInfo(id: string, payload: Partial<Omit<InfoItem, 'id' | 'order' | 'is_checked'>>) { return mutate<InfoItem>(`/api/info/${id}`, 'PUT', payload, '更新資訊失敗') }
export function patchInfoChecked(id: string, is_checked: boolean) { return mutate<InfoItem>(`/api/info/${id}`, 'PATCH', { is_checked }, '更新資訊狀態失敗') }
export function deleteInfo(id: string) { return mutate<{ id: string }>(`/api/info/${id}`, 'DELETE', undefined, '刪除資訊失敗') }

export function createChecklist(payload: Omit<ChecklistItem, 'id' | 'order' | 'is_checked'>) { return mutate<ChecklistItem>('/api/checklist', 'POST', payload, '新增清單失敗') }
export function updateChecklist(id: string, payload: Partial<Omit<ChecklistItem, 'id' | 'order' | 'is_checked'>>) { return mutate<ChecklistItem>(`/api/checklist/${id}`, 'PUT', payload, '更新清單失敗') }
export function patchChecklistChecked(id: string, is_checked: boolean) { return mutate<ChecklistItem>(`/api/checklist/${id}`, 'PATCH', { is_checked }, '更新清單狀態失敗') }
export function deleteChecklist(id: string) { return mutate<{ id: string }>(`/api/checklist/${id}`, 'DELETE', undefined, '刪除清單失敗') }
