import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

// フォルダ(下位カテゴリ)を作る。並び順は同じ親を持つ兄弟の最大+1にするので、
// 追加した順に右へ並んでいく。並べ替えたい時はFirestoreの order を直せばよい。
export async function createCategory({
  name,
  icon,
  reading,
  parentId,
  siblings = [],
}) {
  const maxOrder = siblings.reduce(
    (max, sibling) => Math.max(max, sibling.order ?? 0),
    0,
  )
  await addDoc(collection(db, 'categories'), {
    name,
    // 50音リスト表示のカテゴリではアイコンを使わないので、その場合は持たせない。
    ...(icon ? { icon } : {}),
    // reading は50音順の並べ替え用。カタカナ名なら不要。
    ...(reading ? { reading } : {}),
    order: maxOrder + 1,
    parentId,
  })
}

// 薬剤名のように数十件をまとめて登録したいとき用。1行1件で、
// 「名前」または「名前,よみ」の形式を受け付ける(読点・タブ区切りも可)。
// 漢字や英字の名前は「よみ」を入れないと50音順に正しく並ばない。
//
// writeBatch で一度に書き込むので、途中まで作られて止まることがない。
// (Firestoreのバッチ上限は500件。数百件を超えるなら分割が必要)
export async function createCategoriesBulk({ text, parentId, siblings = [] }) {
  const parsed = (text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, reading] = line.split(/[,，\t]/).map((s) => (s || '').trim())
      return { name, reading: reading || '' }
    })
    .filter((entry) => entry.name)

  if (parsed.length === 0) {
    throw new Error('追加する名前がありません。')
  }
  if (parsed.length > 400) {
    throw new Error('一度に登録できるのは400件までです。分けて登録してください。')
  }

  // 既にある名前は飛ばす(二重登録を防ぐ)
  const existing = new Set(siblings.map((sibling) => sibling.name))
  const toCreate = parsed.filter((entry) => !existing.has(entry.name))
  let order = siblings.reduce(
    (max, sibling) => Math.max(max, sibling.order ?? 0),
    0,
  )

  const batch = writeBatch(db)
  for (const entry of toCreate) {
    order += 1
    batch.set(doc(collection(db, 'categories')), {
      name: entry.name,
      ...(entry.reading ? { reading: entry.reading } : {}),
      order,
      parentId,
    })
  }
  await batch.commit()

  return { created: toCreate.length, skipped: parsed.length - toCreate.length }
}

// 中身が残っているフォルダを消すと資料が迷子になる(Firestoreはサブコレクションを
// 一緒に消してくれない)ので、「下位フォルダなし」かつ「資料なし」の時だけ
// 削除を許す。誤操作でごっそり消えるのを防ぐための安全弁。
export async function deleteCategory(category, allCategories) {
  const hasChildren = allCategories.some((c) => c.parentId === category.id)
  if (hasChildren) {
    throw new Error(
      '中にフォルダが入っています。先にそちらを削除してください。',
    )
  }

  const snapshot = await getDocs(
    query(collection(db, 'categories', category.id, 'materials'), limit(1)),
  )
  if (!snapshot.empty) {
    throw new Error('中に資料が入っています。先に資料を削除してください。')
  }

  await deleteDoc(doc(db, 'categories', category.id))
}
