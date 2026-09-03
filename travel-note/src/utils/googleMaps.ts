import { resolveMapRedirect } from '../services/api'

export const GOOGLE_MAPS_SHORT_LINK_PREFIX = 'https://maps.app.goo.gl/'

// https://www.google.com/maps/place/{地點名稱}/... → 地點名稱（空格會被編成 +，要換回來再 decode）
export function parseMapsPlaceName(url: string): string | null {
  const match = url.match(/\/maps\/place\/([^/]+)/)
  return match ? decodeURIComponent(match[1]!.replace(/\+/g, ' ')) : null
}

// 從一個「已經是完整網址」的 Google Maps 連結取地點：先試 /maps/place/ 格式，
// 再退回 ?q= 這種舊格式（sampleTravel.ts 的資料就是這種）
function extractPlaceFromResolvedUrl(url: string): string | null {
  const placeName = parseMapsPlaceName(url)
  if (placeName) return placeName
  try {
    return new URL(url).searchParams.get('q')
  } catch {
    return null
  }
}

// map_url 可能是短網址、完整地點網址、?q= 網址三種形式之一，統一轉成地點名稱；
// 解析不出來就回傳 null，由呼叫端決定要不要跳過
export async function resolvePlaceFromMapUrl(url: string): Promise<string | null> {
  const direct = extractPlaceFromResolvedUrl(url)
  if (direct) return direct
  if (!url.startsWith(GOOGLE_MAPS_SHORT_LINK_PREFIX)) return null
  try {
    const { location } = await resolveMapRedirect(url)
    return location ? extractPlaceFromResolvedUrl(location) : null
  } catch {
    return null
  }
}

// https://developers.google.com/maps/documentation/urls/get-started?hl=zh-tw#more-examples
export function buildDirectionsUrl(places: string[]): string {
  const params = [
    'api=1',
    `origin=${encodeURIComponent(places[0]!)}`,
    `destination=${encodeURIComponent(places[places.length - 1]!)}`,
  ]
  if (places.length > 2) params.push(`waypoints=${encodeURIComponent(places.slice(1, -1).join('|'))}`)
  params.push('travelmode=driving')
  return `https://www.google.com/maps/dir/?${params.join('&')}`
}
