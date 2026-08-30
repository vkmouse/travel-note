import type { ApiResponse, ChecklistItem, DocumentItem, InfoItem, ItineraryItem } from '../types'

async function getJson<T>(url: string, errorLabel: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${errorLabel}（${res.status}）`)
  }
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) {
    throw new Error(body.error ?? errorLabel)
  }
  return body.data
}

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
