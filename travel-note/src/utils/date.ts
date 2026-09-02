export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function todayDateKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function nowTimeValue(): string {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function weekdayLabel(dateKey: string): string {
  return WEEKDAY_LABELS[new Date(dateKey).getDay()] ?? ''
}

export function daysInMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed + 1, 0).getDate()
}

export function firstWeekdayOfMonth(year: number, monthZeroIndexed: number): number {
  return new Date(year, monthZeroIndexed, 1).getDay()
}

export function buildDateKey(year: number, monthZeroIndexed: number, day: number): string {
  return `${year}-${pad(monthZeroIndexed + 1)}-${pad(day)}`
}
