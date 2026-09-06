import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
} from 'firebase/firestore'
import { db } from '../firebase'

// フォルダ(下位カテゴリ)を作る。並び順は同じ親を持つ兄弟の最大+1にするので、
// 追加した順に右へ並んでいく。並べ替えたい時はFirestoreの order を直せばよい。
export async function createCategory({ name, icon, parentId, siblings = [] }) {
  const maxOrder = siblings.reduce(
    (max, sibling) => Math.max(max, sibling.order ?? 0),
    0,
  )
  await addDoc(collection(db, 'categories'), {
    name,
    icon: icon || '📁',
    order: maxOrder + 1,
    parentId,
  })
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
