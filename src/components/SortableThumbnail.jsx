import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableThumbnail({
  material,
  editMode,
  onOpen,
  onDelete,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: material.id, disabled: !editMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(editMode ? { ...attributes, ...listeners } : {})}
      className="relative flex aspect-[3/4] flex-col overflow-hidden rounded-2xl border border-brand-brown/10 bg-white shadow-sm"
    >
      <button
        type="button"
        onClick={() => onOpen(material)}
        className="flex flex-1 flex-col"
      >
        <div className="flex-1 overflow-hidden bg-brand-cream">
          {material.thumbnailUrl ? (
            <img
              src={material.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl">
              📄
            </div>
          )}
        </div>
        <div className="border-t border-brand-brown/10 px-2 py-2 text-center text-sm font-medium leading-tight text-brand-ink">
          {material.title}
        </div>
      </button>

      {editMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(material)
          }}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-ink/70 text-sm text-white"
          aria-label="削除"
        >
          ×
        </button>
      )}
    </div>
  )
}
