// 顯示區是卡片裡的小字備註，不是長文章，只做 inline 語法 + 清單，不做標題/表格這類 block 語法。
// [text](target) 身兼站內連結與外部連結，靠 target 格式判斷。

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

export type InlineSegment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; text: string; href: string }
  | { type: 'quicklink'; text: string; target: QuickLinkTarget; category: string }

export type NoteBlock =
  | { type: 'paragraph'; lines: InlineSegment[][] }
  | { type: 'list'; ordered: boolean; items: InlineSegment[][] }

const QUICKLINK_TARGET_RE = /^(旅行文件|常用資訊|行前清單)\/(.+)$/
const UL_LINE_RE = /^\s*[-*]\s+(.*)$/
const OL_LINE_RE = /^\s*\d+\.\s+(.*)$/

// code 要最先吃掉且內容不再往下解析，避免代碼片段裡的 * 被誤判成強調語法。
function parseInline(raw: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let buffer = ''
  let i = 0

  const flush = () => {
    if (buffer) segments.push({ type: 'text', value: buffer })
    buffer = ''
  }

  while (i < raw.length) {
    const rest = raw.slice(i)

    const code = /^`([^`]+)`/.exec(rest)
    if (code) {
      flush()
      segments.push({ type: 'code', value: code[1]! })
      i += code[0].length
      continue
    }

    const bold = /^\*\*([^*]+)\*\*/.exec(rest)
    if (bold) {
      flush()
      segments.push({ type: 'bold', value: bold[1]! })
      i += bold[0].length
      continue
    }

    const italic = /^\*([^*]+)\*/.exec(rest)
    if (italic) {
      flush()
      segments.push({ type: 'italic', value: italic[1]! })
      i += italic[0].length
      continue
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)/.exec(rest)
    if (link) {
      flush()
      const text = link[1]!
      const target = link[2]!.trim()
      const quick = QUICKLINK_TARGET_RE.exec(target)
      if (quick) {
        segments.push({ type: 'quicklink', text, target: LABEL_TO_TARGET[quick[1]!]!, category: quick[2]!.trim() })
      } else {
        segments.push({ type: 'link', text, href: target })
      }
      i += link[0].length
      continue
    }

    buffer += raw[i]
    i += 1
  }

  flush()
  return segments
}

// 空白行只用來分隔 block，不會產生空段落。
export function parseNoteBlocks(text: string): NoteBlock[] {
  const lines = text.split('\n')
  const blocks: NoteBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!

    if (line.trim() === '') {
      i += 1
      continue
    }

    const isOl = OL_LINE_RE.test(line)
    const isUl = !isOl && UL_LINE_RE.test(line)

    if (isOl || isUl) {
      const ordered = isOl
      const items: InlineSegment[][] = []
      while (i < lines.length) {
        const current = lines[i]!
        const match = ordered ? OL_LINE_RE.exec(current) : UL_LINE_RE.exec(current)
        if (!match) break
        items.push(parseInline(match[1] ?? ''))
        i += 1
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const paraLines: InlineSegment[][] = []
    while (i < lines.length) {
      const current = lines[i]!
      if (current.trim() === '' || UL_LINE_RE.test(current) || OL_LINE_RE.test(current)) break
      paraLines.push(parseInline(current))
      i += 1
    }
    blocks.push({ type: 'paragraph', lines: paraLines })
  }

  return blocks
}
