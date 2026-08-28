import { doc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'

// ドラッグ&ドロップ後の並び順を、配列のindexどおりにFirestoreへ一括反映する。
export async function persistMaterialOrder(materialsInNewOrder) {
  const batch = writeBatch(db)
  materialsInNewOrder.forEach((material, index) => {
    if (material.order !== index) {
      batch.update(doc(db, 'materials', material.id), { order: index })
    }
  })
  await batch.commit()
}
