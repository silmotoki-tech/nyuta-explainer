import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

// 資料はカテゴリの下のサブコレクション(categories/{categoryId}/materials)に
// 保存している。where + orderBy の複合クエリ(複合インデックスが必要になる)を
// 避けるための構造で、単純な orderBy だけで済む。
// type フィールド(今回は 'pdf' のみ)を持たせているので、将来
// 'video' や 'slides' を追加してもビューア側の分岐を足すだけで対応できる。
export function useMaterials(categoryId) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!categoryId) {
      setMaterials([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'categories', categoryId, 'materials'),
      orderBy('order'),
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMaterials(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            categoryId,
            ...doc.data(),
          })),
        )
        setLoading(false)
      },
      (err) => {
        console.error('資料の取得に失敗しました', err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [categoryId])

  return { materials, loading }
}
