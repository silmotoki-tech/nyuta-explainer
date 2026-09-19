import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../firebase'

// テキスト資料(薬剤ページなど)にぶら下げるPDF。
// 一覧に別項目として並ばないよう、資料そのものではなく
// 親ドキュメントの attachments 配列に持たせている。
// 保存先を materials/ の下にしているのは、Storageのルールを
// 触らずに済ませるため(materials/** は既に書き込み許可がある)。
export async function addAttachment({ material, file, title }) {
  const id = crypto.randomUUID()
  const storagePath = `materials/${material.categoryId}/${material.id}/${id}.pdf`
  const fileRef = ref(storage, storagePath)

  await uploadBytes(fileRef, file, { contentType: 'application/pdf' })
  const fileUrl = await getDownloadURL(fileRef)

  const attachment = { id, title, storagePath, fileUrl }
  await updateDoc(
    doc(db, 'categories', material.categoryId, 'materials', material.id),
    { attachments: arrayUnion(attachment) },
  )
  return attachment
}

export async function removeAttachment(material, attachment) {
  // Firestoreの配列から消すときは、入れたときと同じ形のオブジェクトを渡す。
  await updateDoc(
    doc(db, 'categories', material.categoryId, 'materials', material.id),
    { attachments: arrayRemove(attachment) },
  )
  // ファイル本体の削除は失敗しても画面を止めない(参照は既に外れているため)。
  try {
    await deleteObject(ref(storage, attachment.storagePath))
  } catch (err) {
    console.warn('関連資料のファイル削除に失敗しました', err)
  }
}
