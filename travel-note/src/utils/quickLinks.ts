export type QuickLinkTarget = 'documents' | 'info' | 'checklist'

// 標籤要跟 AppShell 的分頁名稱完全一致，這樣使用者在 note 裡打字時看得懂、也對得上實際頁面
export const QUICK_LINK_LABELS: Record<QuickLinkTarget, string> = {
  documents: '旅行文件',
  info: '常用資訊',
  checklist: '行前清單',
}

const LABEL_TO_TARGET: Record<string, QuickLinkTarget> = {
  旅行文件: 'documents',
  常用資訊: 'info',
  行前清單: 'checklist',
}

export type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'link'; target: QuickLinkTarget; category: string }

// 例：「機場拿護照 [[旅行文件:證件]] 記得先看一下」→ 拆成文字段落 + 連結段落
export function parseQuickLinks(text: string): TextSegment[] {
  const re = /\[\[(旅行文件|常用資訊|行前清單):([^[\]]+)\]\]/g
  const segments: TextSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    if (match.index > lastIndex) segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    segments.push({ type: 'link', target: LABEL_TO_TARGET[match[1] as string]!, category: match[2]!.trim() })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) segments.push({ type: 'text', value: text.slice(lastIndex) })
  return segments
}

export function hasQuickLinks(text: string): boolean {
  return /\[\[(旅行文件|常用資訊|行前清單):[^[\]]+\]\]/.test(text)
}
