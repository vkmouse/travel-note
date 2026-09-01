// 三個項目類型共用同一組分類，與前端 src/constants/categories.ts 保持一致
export const SHARED_CATEGORIES = [
  '住宿', '機票', '交通', '票券', '火車', '簽證',
  '工具', '靈感', '緊急聯絡',
  '證件', '電子用品', '藥品',
  '其他',
] as const

export const DOCUMENT_CATEGORIES = SHARED_CATEGORIES
export const INFO_CATEGORIES = SHARED_CATEGORIES
export const CHECKLIST_CATEGORIES = SHARED_CATEGORIES

export function isValidCategory(value: unknown, allowed: readonly string[]): value is string {
  return typeof value === 'string' && allowed.includes(value)
}

export function normalizeDocumentCategory(value: unknown): unknown {
  return value === 'KKday' || value === 'Klook' ? '票券' : value
}
