import { ref, type Ref } from 'vue'

// 手機上使用者會想直接拖曳頂部握把把 sheet 往下滑掉；只綁在握把區域，
// 不影響 .drawer-body 內容本身的捲動手勢
export function useSheetDrag(sheetEl: Ref<HTMLElement | null>, onDismiss: () => void) {
  const dragY = ref(0)
  const dragging = ref(false)
  let startY = 0

  function onTouchStart(e: TouchEvent) {
    startY = e.touches[0]!.clientY
    dragging.value = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging.value) return
    dragY.value = Math.max(0, e.touches[0]!.clientY - startY)
  }

  // 拖過面板高度的三分之一（或原本就拖得夠遠）視為手勢意圖是關閉，否則彈回原位
  function onTouchEnd() {
    if (!dragging.value) return
    dragging.value = false
    const threshold = Math.min((sheetEl.value?.offsetHeight ?? 0) / 3, 120)
    if (dragY.value > threshold) onDismiss()
    dragY.value = 0
  }

  return { dragY, dragging, onTouchStart, onTouchMove, onTouchEnd }
}
