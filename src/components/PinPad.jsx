import { useState } from 'react'
import { useEditMode } from '../hooks/useEditMode'

export default function PinPad({ onClose }) {
  const { unlock } = useEditMode()
  const [digits, setDigits] = useState('')
  const [error, setError] = useState(false)

  const submit = (value) => {
    if (unlock(value)) {
      onClose()
    } else {
      setError(true)
      setDigits('')
      setTimeout(() => setError(false), 600)
    }
  }

  const press = (n) => {
    const next = (digits + n).slice(0, 6)
    setDigits(next)
    if (next.length === 6) {
      submit(next)
    }
  }

  const backspace = () => setDigits((d) => d.slice(0, -1))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-80 rounded-2xl bg-white p-6 shadow-xl">
        <p className="mb-4 text-center text-sm text-brand-ink/70">
          編集モードのパスコード（6桁）
        </p>
        <div
          className={`mb-5 flex justify-center gap-2 ${error ? 'animate-pulse' : ''}`}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full border ${
                i < digits.length
                  ? 'border-brand-green bg-brand-green'
                  : 'border-brand-ink/20'
              } ${error ? 'border-red-400 bg-red-400' : ''}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => press(String(n))}
              className="rounded-xl bg-brand-cream py-3 text-lg font-medium text-brand-ink active:bg-brand-green/20"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl py-3 text-sm text-brand-ink/50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => press('0')}
            className="rounded-xl bg-brand-cream py-3 text-lg font-medium text-brand-ink active:bg-brand-green/20"
          >
            0
          </button>
          <button
            type="button"
            onClick={backspace}
            className="rounded-xl py-3 text-sm text-brand-ink/50"
          >
            消去
          </button>
        </div>
      </div>
    </div>
  )
}
