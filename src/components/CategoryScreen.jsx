import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useMaterials } from '../hooks/useMaterials'
import { useEditMode } from '../hooks/useEditMode'
import { deleteCategory } from '../lib/categoryAdmin'
import ThumbnailGrid from './ThumbnailGrid'
import UploadModal from './UploadModal'
import FolderModal from './FolderModal'
import PinPad from './PinPad'

export default function CategoryScreen({
  category,
  onBack,
  onOpenCategory,
  onOpenMaterial,
}) {
  const { categories } = useCategories()
  const { materials, loading } = useMaterials(category.id)
  const { isEditMode, lock } = useEditMode()
  const [showPinPad, setShowPinPad] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)

  // このカテゴリの下位フォルダ(例: 診療資料 → 運動器)。
  // Firestoreへのクエリは orderBy('order') だけに留めて(where と併用すると
  // 複合インデックスが必要になるため)、親子の絞り込みはこちら側で行う。
  // カテゴリは多くても数十件なので、これで十分速い。
  const children = categories.filter((c) => c.parentId === category.id)
  const hasChildren = children.length > 0

  // フォルダと資料が同じ階層に混在すると探しにくいので、
  // 空のカテゴリでだけ「どちらにするか」を選べるようにする。
  const canAddFolder = hasChildren || materials.length === 0
  const canAddMaterial = !hasChildren

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`フォルダ「${folder.name}」を削除しますか？`)) return
    try {
      await deleteCategory(folder, categories)
    } catch (err) {
      console.error('フォルダの削除に失敗しました', err)
      window.alert(err.message || 'フォルダを削除できませんでした。')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-brand-brown/10 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-brand-cream px-4 py-1.5 text-sm text-brand-ink"
        >
          ← 戻る
        </button>

        <h1 className="text-lg font-semibold text-brand-ink">
          {category.name}
        </h1>

        <div className="flex items-center gap-2">
          {isEditMode && canAddFolder && (
            <button
              type="button"
              onClick={() => setShowFolderModal(true)}
              className="rounded-full bg-brand-cream px-4 py-1.5 text-sm font-medium text-brand-ink"
            >
              ＋ フォルダを追加
            </button>
          )}
          {isEditMode && canAddMaterial && (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="rounded-full bg-brand-green px-4 py-1.5 text-sm font-medium text-white"
            >
              ＋ 資料を追加
            </button>
          )}
          <button
            type="button"
            onClick={() => (isEditMode ? lock() : setShowPinPad(true))}
            className="rounded-full bg-brand-cream px-3 py-1.5 text-sm text-brand-ink/70"
            aria-label={isEditMode ? '編集モードを終了' : '編集モード'}
          >
            {isEditMode ? '編集中 🔓' : '🔒'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hasChildren && (
          <div className="grid grid-cols-4 gap-3 p-3">
            {children.map((child) => (
              <div key={child.id} className="relative">
                {/* 横長の帯(左にアイコン、右に名前)。高さは iPad 横向きで
                    7行くらいが画面に収まる寸法に合わせている。 */}
                <button
                  type="button"
                  onClick={() => onOpenCategory(child)}
                  className={
                    isEditMode
                      ? 'flex min-h-[6rem] w-full items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white py-4 pl-5 pr-12 text-left shadow-sm transition active:scale-[0.98] active:bg-brand-green/5'
                      : 'flex min-h-[6rem] w-full items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-4 text-left shadow-sm transition active:scale-[0.98] active:bg-brand-green/5'
                  }
                >
                  <span className="shrink-0 text-4xl leading-none">
                    {child.icon || '📁'}
                  </span>
                  <span className="text-lg font-medium leading-tight text-brand-ink">
                    {child.name}
                  </span>
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => handleDeleteFolder(child)}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-brand-ink/70 text-sm text-white"
                    aria-label="フォルダを削除"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 下位フォルダがあっても、直下に資料が残っている場合は隠さず出す
            (フォルダ分けの途中でも資料が見えなくならないようにする)。 */}
        {hasChildren && !loading && materials.length > 0 && (
          <div className="border-t border-brand-brown/10">
            <ThumbnailGrid
              materials={materials}
              editMode={isEditMode}
              onOpen={onOpenMaterial}
            />
          </div>
        )}

        {!hasChildren &&
          (loading ? (
            <p className="mt-16 text-center text-brand-ink/50">読み込み中...</p>
          ) : (
            <ThumbnailGrid
              materials={materials}
              editMode={isEditMode}
              onOpen={onOpenMaterial}
            />
          ))}
      </div>

      {showPinPad && <PinPad onClose={() => setShowPinPad(false)} />}
      {showUpload && (
        <UploadModal
          categoryId={category.id}
          onClose={() => setShowUpload(false)}
        />
      )}
      {showFolderModal && (
        <FolderModal
          parentId={category.id}
          siblings={children}
          onClose={() => setShowFolderModal(false)}
        />
      )}
    </div>
  )
}
