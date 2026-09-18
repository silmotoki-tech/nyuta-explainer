// 本文の簡易整形。ライブラリを足さずに済ませるため、使う記法だけ解釈する。
//
//   ## 見出し      → 見出し
//   ### 小見出し   → 小見出し
//   - 項目 / ・項目 → 箇条書き
//   空行           → 段落の区切り
//   http(s)://…    → リンク(参考文献をタップで開けるように)
//
// ブロックの配列を返す。描画側はこれをそのままJSXに落とす。
export function parseText(body) {
  const lines = (body || '').replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let paragraph = []
  let list = []

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'p', text: paragraph.join('\n') })
      paragraph = []
    }
  }
  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: 'ul', items: list })
      list = []
    }
  }
  const flushAll = () => {
    flushParagraph()
    flushList()
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.trim() === '') {
      flushAll()
      continue
    }
    const heading = line.match(/^(#{2,3})\s*(.*)$/)
    if (heading) {
      flushAll()
      blocks.push({
        type: heading[1].length === 2 ? 'h2' : 'h3',
        text: heading[2].trim(),
      })
      continue
    }
    const item = line.match(/^\s*(?:[-*・]|\d+[.)])\s*(.*)$/)
    if (item) {
      flushParagraph()
      list.push(item[1].trim())
      continue
    }
    flushList()
    paragraph.push(line)
  }
  flushAll()

  return blocks
}

// 文字列をテキストとリンクに切り分ける。描画側で <a> にする。
export function splitLinks(text) {
  const parts = []
  const pattern = /https?:\/\/[^\s<>"'）)】」]+/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'link', value: match[0] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return parts
}
