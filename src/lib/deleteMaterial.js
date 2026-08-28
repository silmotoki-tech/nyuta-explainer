import { deleteDoc, doc } from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { db, storage } from '../firebase'

export async function deleteMaterial(material) {
  await Promise.allSettled([
    deleteObject(ref(storage, material.storagePath)),
    deleteObject(ref(storage, material.thumbnailPath)),
  ])
  await deleteDoc(doc(db, 'materials', material.id))
}
