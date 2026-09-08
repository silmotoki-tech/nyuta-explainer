import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

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

// 資料を別のカテゴリ(フォルダ)へ移す。
//
// PDFとサムネイルの実体はStorageに置いたままで一切動かさない。
// 画面が参照しているのは fileUrl / thumbnailUrl という絶対URLなので、
// 登録情報(Firestoreのドキュメント)を別のカテゴリの下に移すだけで済む。
// storagePath には移動前のカテゴリIDが含まれたままになるが、削除処理は
// この値をそのまま使うので動作に影響はない。
//
// 「追加」と「削除」は writeBatch で1つにまとめる。こうしないと、
// 追加だけ成功して削除に失敗したときに資料が二重に見えてしまう。
export async function moveMaterial(material, toCategoryId) {
  if (!toCategoryId || material.categoryId === toCategoryId) return

  const order = await getNextOrder(toCategoryId)
  const { id, categoryId, ...fields } = material

  const batch = writeBatch(db)
  batch.set(doc(db, 'categories', toCategoryId, 'materials', id), {
    ...fields,
    order,
  })
  batch.delete(doc(db, 'categories', categoryId, 'materials', id))
  await batch.commit()
}
