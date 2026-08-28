import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

// カテゴリはデータとして持たせているので、Firestoreの categories コレクションに
// ドキュメントを追加するだけで、コードを変更せずに新しいカテゴリ(将来の「マニュアル」等)を
// 追加できる。
export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCategories(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        )
        setLoading(false)
      },
      (err) => {
        console.error('カテゴリの取得に失敗しました', err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  return { categories, loading }
}
