import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  limit,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../firebase'
import { generateThumbnailFromPdf } from './pdfThumbnail'

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

// 資料(現在はPDFのみ)をアップロードし、Firestoreにメタデータを作成する。
// type: 'pdf' 固定だが、将来 'video' や 'slides' を追加する際は
// ここに分岐を足すだけで対応できる想定。
export async function uploadPdfMaterial({ file, categoryId, title }) {
  const id = crypto.randomUUID()
  const pdfPath = `materials/${categoryId}/${id}.pdf`
  const thumbPath = `thumbnails/${categoryId}/${id}.jpg`

  const [thumbnailBlob, order] = await Promise.all([
    generateThumbnailFromPdf(file),
    getNextOrder(categoryId),
  ])

  const pdfRef = ref(storage, pdfPath)
  const thumbRef = ref(storage, thumbPath)

  await uploadBytes(pdfRef, file, { contentType: 'application/pdf' })
  await uploadBytes(thumbRef, thumbnailBlob, { contentType: 'image/jpeg' })

  const [pdfUrl, thumbUrl] = await Promise.all([
    getDownloadURL(pdfRef),
    getDownloadURL(thumbRef),
  ])

  await addDoc(collection(db, 'categories', categoryId, 'materials'), {
    title,
    type: 'pdf',
    storagePath: pdfPath,
    fileUrl: pdfUrl,
    thumbnailPath: thumbPath,
    thumbnailUrl: thumbUrl,
    order,
    createdAt: serverTimestamp(),
  })
}
