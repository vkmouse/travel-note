import { onUnmounted, ref, watch, type Ref } from 'vue'

// 用計數而非布林值鎖 body 捲動：確認框會疊在另一個 sheet 之上，
// 內層關閉時不能連帶把外層還開著的 sheet 背景解鎖
let scrollLockCount = 0
function lockBodyScroll() {
  if (scrollLockCount === 0) document.body.style.overflow = 'hidden'
  scrollLockCount++
}
function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount === 0) document.body.style.overflow = ''
}

// 手機上使用者會想直接拖曳頂部握把把 sheet 往下滑掉；只綁在握把區域，
// 不影響 .drawer-body 內容本身的捲動手勢
export function useSheetDrag(sheetEl: Ref<HTMLElement | null>, onDismiss: () => void, open: Ref<boolean>) {
  const dragY = ref(0)
  const dragging = ref(false)
  let startY = 0
  let holdingLock = false

  watch(
    open,
    (isOpen) => {
      if (isOpen === holdingLock) return
      holdingLock = isOpen
      if (isOpen) lockBodyScroll()
      else unlockBodyScroll()
    },
    { immediate: true },
  )
  // 元件在 sheet 還開著時就被移除（例如父層直接砍掉整棵樹）也要記得解鎖
  onUnmounted(() => {
    if (holdingLock) unlockBodyScroll()
  })

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
