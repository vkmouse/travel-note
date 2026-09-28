// 隱藏旅行的後門手勢：在 windowMs 內連點 count 次就觸發。
// 只在閉包內記時間戳，不存任何全域狀態。
export function useSecretTap(onTrigger: () => void, count = 5, windowMs = 2000) {
  let taps: number[] = []

  function tap() {
    const now = Date.now()
    // 滑動視窗：只保留 windowMs 內的點擊，數量夠了就觸發
    taps = [...taps.filter((t) => now - t <= windowMs), now]
    if (taps.length >= count) {
      taps = []
      onTrigger()
    }
  }

  return { tap }
}
