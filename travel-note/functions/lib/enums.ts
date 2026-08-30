export const DOCUMENT_CATEGORIES = ['住宿', '機票', '交通', 'KKday', 'Klook', '火車', '簽證', '其他'] as const
export const INFO_CATEGORIES = ['工具', '靈感', '緊急聯絡'] as const
export const CHECKLIST_CATEGORIES = ['證件', '電子用品', '藥品'] as const

export function isValidCategory(value: unknown, allowed: readonly string[]): value is string {
  return typeof value === 'string' && allowed.includes(value)
}
