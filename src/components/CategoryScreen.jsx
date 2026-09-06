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
          <div className="grid grid-cols-6 gap-3 p-3">
            {children.map((child) => (
              <div key={child.id} className="relative">
                <button
                  type="button"
                  onClick={() => onOpenCategory(child)}
                  className="flex w-full flex-col items-center gap-2 rounded-2xl border border-brand-brown/10 bg-white px-2 py-6 shadow-sm transition active:scale-95 active:bg-brand-green/5"
                >
                  <span className="text-4xl">{child.icon || '📁'}</span>
                  <span className="text-center text-sm font-medium text-brand-ink">
                    {child.name}
                  </span>
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => handleDeleteFolder(child)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-ink/70 text-sm text-white"
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
