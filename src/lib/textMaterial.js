import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

// 新規作成時にあらかじめ入れておく見出し。
// 入力欄を項目ごとに分けると開くのが面倒になるので、1ページの中に
// 見出しだけ用意して、その下に書き足してもらう形にしている。
// こうすると入力は自由なまま、どの薬剤も同じ並びになる。
export const TEXT_TEMPLATE = [
  '## 作用・効果',
  '',
  '## 主な適応',
  '',
  '## 主な副反応',
  '',
  '## 禁忌・注意',
  '',
  '## モニタリング',
  '',
  '## 参考文献',
  '',
].join('\n')

async function getNextOrder(categoryId) {
  const q = query(
    collection(db, 'categories', categoryId, 'materials'),
    orderBy('order', 'desc'),
    limit(1),
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return 0
  return (snapshot.docs[0].data().order ?? 0) + 1
}

function textMaterialFields({ title, reading, group, body, order }) {
  return {
    title,
    ...(reading ? { reading } : {}),
    ...(group ? { group } : {}),
    // type を見て表示側がビューアを切り替える('pdf' は従来どおりPDF表示)。
    type: 'text',
    // 本文はFirestoreのドキュメントにそのまま持たせる。Storageを使わないので
    // アップロードもサムネイル生成も要らず、表示も速い。
    body: body ?? TEXT_TEMPLATE,
    order,
    createdAt: serverTimestamp(),
  }
}

export async function createTextMaterial({ categoryId, title, reading, group }) {
  const order = await getNextOrder(categoryId)
  const batch = writeBatch(db)
  batch.set(
    doc(collection(db, 'categories', categoryId, 'materials')),
    textMaterialFields({ title, reading, group, order }),
  )
  await batch.commit()
}

// 薬剤名の一覧から、中身が見出しだけのページをまとめて作る。
// 1行1件で「名前」「名前,よみ」「名前,よみ,グループ」を受け付ける。
export async function createTextMaterialsBulk({
  categoryId,
  text,
  existingTitles = [],
}) {
  const parsed = (text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, reading, group] = line
        .split(/[,，\t]/)
        .map((s) => (s || '').trim())
      return { title, reading: reading || '', group: group || '' }
    })
    .filter((entry) => entry.title)

  if (parsed.length === 0) {
    throw new Error('追加する名前がありません。')
  }
  if (parsed.length > 400) {
    throw new Error('一度に登録できるのは400件までです。分けて登録してください。')
  }

  const existing = new Set(existingTitles)
  const toCreate = parsed.filter((entry) => !existing.has(entry.title))
  let order = await getNextOrder(categoryId)

  const batch = writeBatch(db)
  for (const entry of toCreate) {
    batch.set(
      doc(collection(db, 'categories', categoryId, 'materials')),
      textMaterialFields({ ...entry, order }),
    )
    order += 1
  }
  await batch.commit()

  return { created: toCreate.length, skipped: parsed.length - toCreate.length }
}

export async function updateTextMaterialBody(material, body) {
  await updateDoc(
    doc(db, 'categories', material.categoryId, 'materials', material.id),
    { body },
  )
}
