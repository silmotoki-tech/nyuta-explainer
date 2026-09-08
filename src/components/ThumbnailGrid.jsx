import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import SortableThumbnail from './SortableThumbnail'
import MoveMaterialModal from './MoveMaterialModal'
import { useCategories } from '../hooks/useCategories'
import { persistMaterialOrder } from '../lib/reorderMaterials'
import { deleteMaterial } from '../lib/deleteMaterial'

// iPad横向きで 横6×縦3 を基準にした、縦スクロールのサムネイルグリッド。
export default function ThumbnailGrid({ materials, editMode, onOpen }) {
  const [items, setItems] = useState(materials)
  const [movingMaterial, setMovingMaterial] = useState(null)
  const { categories } = useCategories()

  // Firestoreからの最新スナップショットと同期する。
  // 並び順の違いは編集モード中は無視する(自分がドラッグ中の並びを
  // サーバー側の古い並びで上書きしないため)が、件数が変わったときは
  // 追加・削除・移動が起きたということなので編集モード中でも反映する。
  const countChanged = items.length !== materials.length
  const orderChanged = items.some((m, i) => m.id !== materials[i]?.id)
  if (countChanged || (!editMode && orderChanged)) {
    setItems(materials)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((m) => m.id === active.id)
    const newIndex = items.findIndex((m) => m.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    persistMaterialOrder(reordered).catch((err) =>
      console.error('並び替えの保存に失敗しました', err),
    )
  }

  const handleDelete = (material) => {
    if (!window.confirm(`「${material.title}」を削除しますか？`)) return
    deleteMaterial(material).catch((err) =>
      console.error('削除に失敗しました', err),
    )
  }

  if (materials.length === 0) {
    return (
      <p className="mt-16 text-center text-brand-ink/50">
        まだ資料が登録されていません。
      </p>
    )
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((m) => m.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-6 gap-3 p-3 justify-items-center">
            {items.map((material) => (
              <SortableThumbnail
                key={material.id}
                material={material}
                editMode={editMode}
                onOpen={onOpen}
                onDelete={handleDelete}
                onMove={setMovingMaterial}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {movingMaterial && (
        <MoveMaterialModal
          material={movingMaterial}
          categories={categories}
          onClose={() => setMovingMaterial(null)}
        />
      )}
    </>
  )
}
