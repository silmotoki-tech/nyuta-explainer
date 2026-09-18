import { useRef, useState } from 'react'
import { deleteCategory } from '../lib/categoryAdmin'
import { deleteMaterial } from '../lib/deleteMaterial'
import { groupEntries, sortKeyOf, toKatakana } from '../lib/kana'
import MoveMaterialModal from './MoveMaterialModal'

// 薬剤情報のように品目が多く、アイコンより名前で探すカテゴリ用の表示。
// カテゴリの layout が 'list' のときにこちらが使われる。
//
// フォルダと資料を混ぜて50音順に並べるので、資料が1つしかない薬剤は
// フォルダを作らずPDFを直接置けば1タップで開き、複数ある薬剤だけ
// フォルダにする、という運用ができる。
export default function ListCategoryView({
  categories,
  folders,
  materials,
  editMode,
  onOpenCategory,
  onOpenMaterial,
}) {
  const [search, setSearch] = useState('')
  const [movingMaterial, setMovingMaterial] = useState(null)
  const rowRefs = useRef({})

  const entries = [
    ...folders.map((category) => ({
      id: category.id,
      kind: 'folder',
      name: category.name,
      reading: category.reading,
      group: category.group,
      source: category,
    })),
    ...materials.map((material) => ({
      id: material.id,
      kind: 'material',
      name: material.title,
      reading: material.reading,
      group: material.group,
      source: material,
    })),
  ].map((entry) => ({ ...entry, sortKey: sortKeyOf(entry) }))

  // 検索はひらがな/カタカナの違いと英字の大小を無視して照合する。
  const keyword = search.trim()
  const matched = keyword
    ? entries.filter((entry) => {
        const haystack = `${entry.name} ${entry.reading || ''}`
        return (
          haystack.includes(keyword) ||
          toKatakana(haystack).includes(toKatakana(keyword)) ||
          haystack.toLowerCase().includes(keyword.toLowerCase())
        )
      })
    : entries

  const rows = groupEntries(matched)

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`「${folder.name}」を削除しますか？`)) return
    try {
      await deleteCategory(folder, categories)
    } catch (err) {
      console.error('フォルダの削除に失敗しました', err)
      window.alert(err.message || 'フォルダを削除できませんでした。')
    }
  }

  const handleDeleteMaterial = (material) => {
    if (!window.confirm(`「${material.title}」を削除しますか？`)) return
    deleteMaterial(material).catch((err) =>
      console.error('削除に失敗しました', err),
    )
  }

  const jumpTo = (rowKey) => {
    rowRefs.current[rowKey]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="px-3 pb-8">
      {/* 検索と50音ジャンプバー。スクロールしても上に残す。 */}
      <div className="sticky top-0 z-10 bg-brand-cream/95 py-3 backdrop-blur">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="薬剤名で検索（ひらがな・カタカナどちらでも）"
          className="w-full rounded-full border border-brand-brown/20 bg-white px-5 py-2.5 text-base text-brand-ink"
        />

        {!keyword && rows.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rows.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => jumpTo(row.key)}
                className="min-w-11 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-brand-ink shadow-sm"
              >
                {row.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 && (
        <p className="mt-16 text-center text-brand-ink/50">
          {keyword
            ? `「${keyword}」に一致するものがありません。`
            : 'まだ登録されていません。'}
        </p>
      )}

      {rows.map((row) => (
        <div
          key={row.key}
          ref={(el) => {
            rowRefs.current[row.key] = el
          }}
          className="scroll-mt-28 pt-4"
        >
          <h2 className="mb-2 border-b border-brand-brown/10 pb-1 text-sm font-semibold text-brand-ink/50">
            {row.label}
          </h2>

          <div className="grid grid-cols-4 gap-2">
            {row.items.map((entry) => (
              <div key={`${entry.kind}-${entry.id}`} className="relative">
                <button
                  type="button"
                  onClick={() =>
                    entry.kind === 'folder'
                      ? onOpenCategory(entry.source)
                      : onOpenMaterial(entry.source)
                  }
                  className={
                    editMode
                      ? 'flex w-full items-center justify-between gap-2 rounded-xl border border-brand-brown/10 bg-white py-3 pl-4 pr-20 text-left shadow-sm transition active:scale-[0.98] active:bg-brand-green/5'
                      : 'flex w-full items-center justify-between gap-2 rounded-xl border border-brand-brown/10 bg-white px-4 py-3 text-left shadow-sm transition active:scale-[0.98] active:bg-brand-green/5'
                  }
                >
                  <span className="break-keep text-base text-brand-ink">
                    {entry.name}
                  </span>
                  {entry.kind === 'folder' && (
                    <span className="shrink-0 text-brand-ink/30">›</span>
                  )}
                </button>

                {editMode && (
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {entry.kind === 'material' && (
                      <button
                        type="button"
                        onClick={() => setMovingMaterial(entry.source)}
                        className="rounded-full bg-brand-ink/70 px-2.5 py-1 text-xs font-medium text-white"
                      >
                        移動
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        entry.kind === 'folder'
                          ? handleDeleteFolder(entry.source)
                          : handleDeleteMaterial(entry.source)
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-ink/70 text-xs text-white"
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {movingMaterial && (
        <MoveMaterialModal
          material={movingMaterial}
          categories={categories}
          onClose={() => setMovingMaterial(null)}
        />
      )}
    </div>
  )
}
