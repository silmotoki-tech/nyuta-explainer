import { useState } from 'react'
import { moveMaterial } from '../lib/moveMaterial'

export default function MoveMaterialModal({ material, categories, onClose }) {
  const [status, setStatus] = useState('idle') // idle | moving | error
  const [errorMessage, setErrorMessage] = useState('')

  // 移動先に出すのは「下位フォルダを持たないカテゴリ」だけ。
  // フォルダを持つカテゴリに資料を置くと、フォルダと資料が混在して
  // 探しにくくなるため(資料の追加ボタンを隠しているのと同じ理由)。
  const destinations = categories
    .filter((c) => c.id !== material.categoryId)
    .filter((c) => !categories.some((child) => child.parentId === c.id))

  const labelFor = (category) => {
    const parent = categories.find((c) => c.id === category.parentId)
    return parent ? `${parent.name} ＞ ${category.name}` : category.name
  }

  const move = async (toCategoryId) => {
    setStatus('moving')
    try {
      await moveMaterial(material, toCategoryId)
      onClose()
    } catch (err) {
      console.error('資料の移動に失敗しました', err)
      setStatus('error')
      setErrorMessage(
        '移動に失敗しました。通信状況を確認して、もう一度お試しください。',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-brand-ink">移動先を選ぶ</h2>
        <p className="mt-1 break-keep text-sm text-brand-ink/60">
          {material.title}
        </p>

        {status === 'error' && (
          <p className="mt-4 text-sm text-red-500">{errorMessage}</p>
        )}

        <div className="mt-4 flex-1 overflow-y-auto">
          {destinations.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-ink/50">
              移動できるフォルダがありません。先にフォルダを作ってください。
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {destinations.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  disabled={status === 'moving'}
                  onClick={() => move(category.id)}
                  className="flex items-center gap-3 rounded-xl border border-brand-brown/10 px-4 py-3 text-left disabled:opacity-40"
                >
                  <span className="shrink-0 text-2xl leading-none">
                    {category.icon || '📁'}
                  </span>
                  <span className="break-keep text-base text-brand-ink">
                    {labelFor(category)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={status === 'moving'}
            className="rounded-lg px-4 py-2 text-sm text-brand-ink/60"
          >
            {status === 'moving' ? '移動中...' : 'キャンセル'}
          </button>
        </div>
      </div>
    </div>
  )
}
