import { useState } from 'react'
import { createCategory } from '../lib/categoryAdmin'

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

export default function FolderModal({ parentId, siblings, onClose }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📁')
  const [status, setStatus] = useState('idle') // idle | saving | error
  const [errorMessage, setErrorMessage] = useState('')

  const canSubmit = name.trim().length > 0 && status !== 'saving'

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('saving')
    try {
      await createCategory({ name: name.trim(), icon, parentId, siblings })
      onClose()
    } catch (err) {
      console.error('フォルダの作成に失敗しました', err)
      setStatus('error')
      setErrorMessage(
        '保存に失敗しました。通信状況を確認して、もう一度お試しください。',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold text-brand-ink">
          フォルダを追加
        </h2>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-brand-ink/70">
            フォルダ名
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：運動器"
            className="w-full rounded-lg border border-brand-brown/20 px-3 py-2 text-brand-ink"
          />
        </label>

        <div className="mb-6">
          <span className="mb-2 block text-sm text-brand-ink/70">アイコン</span>
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

        {status === 'error' && (
          <p className="mb-4 text-sm text-red-500">{errorMessage}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-brand-ink/60"
          >
            キャンセル
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
