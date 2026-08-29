import { useCategories } from '../hooks/useCategories'

export default function HomeScreen({ onSelectCategory }) {
  const { categories, loading } = useCategories()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-8">
      {loading && <p className="text-brand-ink/50">読み込み中...</p>}

      {!loading && categories.length === 0 && (
        <p className="text-brand-ink/50">
          カテゴリがまだ登録されていません。Firestoreの categories
          コレクションを確認してください。
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-6">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category)}
            className="flex w-64 flex-col items-center gap-3 rounded-3xl border border-brand-brown/10 bg-white px-6 py-10 shadow-sm transition active:scale-95 active:bg-brand-green/5"
          >
            <span className="text-5xl">{category.icon || '📄'}</span>
            <span className="text-lg font-medium text-brand-ink">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
