import { reactive } from 'vue'
import { resolvePlaceFromMapUrl } from '../utils/googleMaps'

// 卡片上顯示的地點名稱：即時從 map_url 查出來，不寫回任何欄位、也不存資料庫。
// 用模組層級的快取，同一個 map_url 不管出現在行程/文件/資訊哪張卡片上都只查一次；
// resolvePlaceFromMapUrl 對短網址展開本身也有 localStorage 快取，這裡只是再擋一層重複查詢與重複渲染。
const placeNameCache = reactive<Record<string, string | null>>({})
const pending = new Set<string>()

function fetchPlaceName(url: string) {
  if (url in placeNameCache || pending.has(url)) return
  pending.add(url)
  resolvePlaceFromMapUrl(url)
    .then((name) => { placeNameCache[url] = name })
    .catch(() => { placeNameCache[url] = null })
    .finally(() => pending.delete(url))
}

export function useMapPlaceName() {
  // 卡片渲染時呼叫：還沒查過就順便觸發查詢，查完後 placeNameCache 更新會讓卡片自動重新渲染出結果
  function placeNameOf(url: string | null | undefined): string | null {
    if (!url) return null
    if (!(url in placeNameCache)) fetchPlaceName(url)
    return placeNameCache[url] ?? null
  }
  return { placeNameOf }
}
