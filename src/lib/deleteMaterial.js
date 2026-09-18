import { deleteDoc, doc } from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { db, storage } from '../firebase'

export async function deleteMaterial(material) {
  // テキスト資料はStorageにファイルを持たないので、あるものだけ消す。
  const paths = [material.storagePath, material.thumbnailPath].filter(Boolean)
  await Promise.allSettled(
    paths.map((path) => deleteObject(ref(storage, path))),
  )
  await deleteDoc(
    doc(db, 'categories', material.categoryId, 'materials', material.id),
  )
}
