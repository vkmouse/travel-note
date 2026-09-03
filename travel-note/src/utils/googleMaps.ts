// https://www.google.com/maps/place/{地點名稱}/... → 地點名稱（空格會被編成 +，要換回來再 decode）
export function parseMapsPlaceName(url: string): string | null {
  const match = url.match(/\/maps\/place\/([^/]+)/)
  return match ? decodeURIComponent(match[1]!.replace(/\+/g, ' ')) : null
}
