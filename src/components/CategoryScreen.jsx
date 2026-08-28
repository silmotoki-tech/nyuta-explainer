import { useState } from 'react'
import { useMaterials } from '../hooks/useMaterials'
import { useEditMode } from '../hooks/useEditMode'
import ThumbnailGrid from './ThumbnailGrid'
import UploadModal from './UploadModal'
import PinPad from './PinPad'

export default function CategoryScreen({ category, onBack, onOpenMaterial }) {
  const { materials, loading } = useMaterials(category.id)
  const { isEditMode, lock } = useEditMode()
  const [showPinPad, setShowPinPad] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

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
          {isEditMode && (
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
        {loading ? (
          <p className="mt-16 text-center text-brand-ink/50">読み込み中...</p>
        ) : (
          <ThumbnailGrid
            materials={materials}
            editMode={isEditMode}
            onOpen={onOpenMaterial}
          />
        )}
      </div>

      {showPinPad && <PinPad onClose={() => setShowPinPad(false)} />}
      {showUpload && (
        <UploadModal
          categoryId={category.id}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
