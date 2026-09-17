import { useState } from 'react'
import { createCategoriesBulk, createCategory } from '../lib/categoryAdmin'

// iPadで絵文字キーボードを探さずに選べるよう、診療科でよく使うものを並べておく。
const ICON_PRESETS = [
  '📁',
  '❤️',
  '🫁',
  '🍽️',
  '💧',
  '🧪',
  '🧠',
  '🦴',
  '🐾',
  '👁️',
  '🦷',
  '🎗️',
  '🍼',
  '🦠',
  '💉',
  '🏥',
  '🔬',
  '🥣',
  '🚑',
  '🐶',
]

// listMode: 親カテゴリが50音リスト表示のとき。アイコンは表示に使われないので
// アイコン選択を出さず、代わりに並べ替え用の「よみ」を入力してもらう。
export default function FolderModal({ parentId, siblings, listMode, onClose }) {
  const [mode, setMode] = useState('single') // single | bulk
  const [name, setName] = useState('')
  const [reading, setReading] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [icon, setIcon] = useState('📁')
  const [status, setStatus] = useState('idle') // idle | saving | error
  const [message, setMessage] = useState('')

  const canSubmit =
    status !== 'saving' &&
    (mode === 'single' ? name.trim().length > 0 : bulkText.trim().length > 0)

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('saving')
    setMessage('')
    try {
      if (mode === 'single') {
        await createCategory({
          name: name.trim(),
          reading: listMode ? reading.trim() : '',
          icon: listMode ? '' : icon,
          parentId,
          siblings,
        })
        onClose()
        return
      }
      const result = await createCategoriesBulk({
        text: bulkText,
        parentId,
        siblings,
      })
      if (result.skipped > 0) {
        setStatus('idle')
        setMessage(
          `${result.created}件を追加しました（同じ名前の${result.skipped}件は飛ばしました）。`,
        )
        setBulkText('')
        return
      }
      onClose()
    } catch (err) {
      console.error('フォルダの作成に失敗しました', err)
      setStatus('error')
      setMessage(err.message || '保存に失敗しました。もう一度お試しください。')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <form
        onSubmit={submit}
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-brand-ink">
          フォルダを追加
        </h2>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={
              mode === 'single'
                ? 'rounded-full bg-brand-green px-4 py-1.5 text-sm font-medium text-white'
                : 'rounded-full bg-brand-cream px-4 py-1.5 text-sm text-brand-ink/70'
            }
          >
            1件ずつ
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={
              mode === 'bulk'
                ? 'rounded-full bg-brand-green px-4 py-1.5 text-sm font-medium text-white'
                : 'rounded-full bg-brand-cream px-4 py-1.5 text-sm text-brand-ink/70'
            }
          >
            まとめて追加
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === 'single' ? (
            <>
              <label className="mb-4 block">
                <span className="mb-1 block text-sm text-brand-ink/70">
                  フォルダ名
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={listMode ? '例：アモキシシリン' : '例：運動器'}
                  className="w-full rounded-lg border border-brand-brown/20 px-3 py-2 text-brand-ink"
                />
              </label>

              {listMode ? (
                <label className="mb-4 block">
                  <span className="mb-1 block text-sm text-brand-ink/70">
                    よみ（任意・漢字や英字の名前のときだけ）
                  </span>
                  <input
                    type="text"
                    value={reading}
                    onChange={(e) => setReading(e.target.value)}
                    placeholder="例：リックンシトウ"
                    className="w-full rounded-lg border border-brand-brown/20 px-3 py-2 text-brand-ink"
                  />
                </label>
              ) : (
                <div className="mb-4">
                  <span className="mb-2 block text-sm text-brand-ink/70">
                    アイコン
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ICON_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setIcon(preset)}
                        className={
                          icon === preset
                            ? 'flex h-11 w-11 items-center justify-center rounded-lg border-2 border-brand-green bg-brand-green/10 text-xl'
                            : 'flex h-11 w-11 items-center justify-center rounded-lg border border-brand-brown/20 text-xl'
                        }
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <label className="mb-4 block">
              <span className="mb-1 block text-sm text-brand-ink/70">
                1行に1件。「名前」または「名前,よみ」の形で貼り付け
              </span>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={12}
                placeholder={'アモキシシリン\nフロセミド\n六君子湯,リックンシトウ'}
                className="w-full rounded-lg border border-brand-brown/20 px-3 py-2 font-mono text-sm text-brand-ink"
              />
              <span className="mt-1 block text-xs text-brand-ink/50">
                同じ名前が既にあるものは飛ばします。アイコンは付きません。
              </span>
            </label>
          )}
        </div>

        {message && (
          <p
            className={
              status === 'error'
                ? 'mt-2 text-sm text-red-500'
                : 'mt-2 text-sm text-brand-ink/70'
            }
          >
            {message}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-brand-ink/60"
          >
            閉じる
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-brand-green px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {status === 'saving' ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
