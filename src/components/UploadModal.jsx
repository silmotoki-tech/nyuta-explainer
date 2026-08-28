import { useState } from 'react'
import { uploadPdfMaterial } from '../lib/uploadMaterial'

export default function UploadModal({ categoryId, onClose }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('idle') // idle | uploading | error
  const [errorMessage, setErrorMessage] = useState('')

  const canSubmit = file && title.trim().length > 0 && status !== 'uploading'

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('uploading')
    try {
      await uploadPdfMaterial({ file, categoryId, title: title.trim() })
      onClose()
    } catch (err) {
      console.error('アップロードに失敗しました', err)
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
          資料を追加
        </h2>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-brand-ink/70">
            PDFファイル
          </span>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-brand-ink/70">
            タイトル
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：フィラリア予防について"
            className="w-full rounded-lg border border-brand-brown/20 px-3 py-2 text-brand-ink"
          />
        </label>

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
            {status === 'uploading' ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
