import { useState } from 'react'
import {
  createTextMaterial,
  createTextMaterialsBulk,
} from '../lib/textMaterial'

// テキスト資料(PDFではなく本文をそのまま持つ資料)を作る。
// 薬剤情報のように、138品目ぶんの空ページを先に用意しておいて
// あとから中身を書き足していく使い方を想定している。
export default function TextMaterialModal({
  categoryId,
  existingTitles,
  onClose,
}) {
  const [mode, setMode] = useState('single') // single | bulk
  const [title, setTitle] = useState('')
  const [reading, setReading] = useState('')
  const [group, setGroup] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | error
  const [message, setMessage] = useState('')

  const canSubmit =
    status !== 'saving' &&
    (mode === 'single' ? title.trim().length > 0 : bulkText.trim().length > 0)

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('saving')
    setMessage('')
    try {
      if (mode === 'single') {
        await createTextMaterial({
          categoryId,
          title: title.trim(),
          reading: reading.trim(),
          group: group.trim(),
        })
        onClose()
        return
      }
      const result = await createTextMaterialsBulk({
        categoryId,
        text: bulkText,
        existingTitles,
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
      console.error('テキスト資料の作成に失敗しました', err)
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
        <h2 className="mb-1 text-lg font-semibold text-brand-ink">
          テキスト資料を追加
        </h2>
        <p className="mb-4 text-sm text-brand-ink/60">
          作用・効果／主な適応／主な副反応／禁忌・注意／モニタリング／参考文献の見出しが入った空のページを作ります。
        </p>

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
                  タイトル
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：アモキシシリン"
                  className="w-full rounded-lg border border-brand-brown/20 px-3 py-2 text-brand-ink"
                />
              </label>
              <label className="mb-4 block">
                <span className="mb-1 block text-sm text-brand-ink/70">
                  よみ（任意・漢字や英字の名前のときだけ）
                </span>
                <input
                  type="text"
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                  placeholder="例：シギャクサン"
                  className="w-full rounded-lg border border-brand-brown/20 px-3 py-2 text-brand-ink"
                />
              </label>
              <label className="mb-4 block">
                <span className="mb-1 block text-sm text-brand-ink/70">
                  グループ（任意・一覧の最後に別枠でまとめたいとき）
                </span>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="例：漢方薬"
                  className="w-full rounded-lg border border-brand-brown/20 px-3 py-2 text-brand-ink"
                />
              </label>
            </>
          ) : (
            <label className="mb-4 block">
              <span className="mb-1 block text-sm text-brand-ink/70">
                1行に1件。「名前」「名前,よみ」「名前,よみ,グループ」の形で貼り付け
              </span>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={12}
                placeholder={
                  'アモキシシリン\nフロセミド\n四逆散,シギャクサン,漢方薬'
                }
                className="w-full rounded-lg border border-brand-brown/20 px-3 py-2 font-mono text-sm text-brand-ink"
              />
              <span className="mt-1 block text-xs text-brand-ink/50">
                同じ名前が既にあるものは飛ばします。中身は空（見出しだけ）で作られるので、あとから開いて書き足してください。
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
