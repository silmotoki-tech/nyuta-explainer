// 50音順の並べ替え・行分けに使う小物。
//
// 薬剤名はカタカナが多いのでそのまま並ぶが、漢字や英字の名前は
// 読み仮名(reading)がないと正しく並ばない。reading があればそちらを、
// なければ名前そのものを並べ替えのキーにする。

// ひらがなをカタカナに寄せる。「あ」と「ア」が別扱いにならないようにするため。
export function toKatakana(text) {
  return (text || '').replace(/[ぁ-ゖ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60),
  )
}

export function sortKeyOf(entry) {
  return toKatakana(entry.reading || entry.name || '')
}

// 50音の各行。min/max はカタカナのコード範囲(濁音・半濁音・小文字を含む)。
export const KANA_ROWS = [
  { key: 'ア', label: 'あ', min: 0x30a1, max: 0x30aa },
  { key: 'カ', label: 'か', min: 0x30ab, max: 0x30b4 },
  { key: 'サ', label: 'さ', min: 0x30b5, max: 0x30be },
  { key: 'タ', label: 'た', min: 0x30bf, max: 0x30c9 },
  { key: 'ナ', label: 'な', min: 0x30ca, max: 0x30ce },
  { key: 'ハ', label: 'は', min: 0x30cf, max: 0x30dd },
  { key: 'マ', label: 'ま', min: 0x30de, max: 0x30e2 },
  { key: 'ヤ', label: 'や', min: 0x30e3, max: 0x30e8 },
  { key: 'ラ', label: 'ら', min: 0x30e9, max: 0x30ed },
  { key: 'ワ', label: 'わ', min: 0x30ee, max: 0x30f3 },
]

// 読み仮名でない名前(英字・数字・読みが未入力の漢字など)の置き場所。
export const OTHER_ROW = { key: '#', label: 'その他' }

export function kanaRowOf(sortKey) {
  const first = sortKey.charAt(0)
  if (!first) return OTHER_ROW.key
  // ヴ は慣例どおり「う」の位置(ア行)に入れる。
  if (first === 'ヴ') return 'ア'
  const code = first.charCodeAt(0)
  const row = KANA_ROWS.find((r) => code >= r.min && code <= r.max)
  return row ? row.key : OTHER_ROW.key
}

// 50音順に並べ、行ごとにまとめる。空の行は返さない。
export function groupByKanaRow(entries) {
  const sorted = [...entries].sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey, 'ja'),
  )
  const rows = [...KANA_ROWS, OTHER_ROW]
  return rows
    .map((row) => ({
      ...row,
      items: sorted.filter((entry) => kanaRowOf(entry.sortKey) === row.key),
    }))
    .filter((row) => row.items.length > 0)
}
