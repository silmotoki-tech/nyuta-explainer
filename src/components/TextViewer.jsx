import { Suspense, lazy, useState } from 'react'
import { useEditMode } from '../hooks/useEditMode'
import { parseText, splitLinks } from '../lib/renderText'
import { TEXT_TEMPLATE, updateTextMaterialBody } from '../lib/textMaterial'
import { removeAttachment } from '../lib/attachment'
import AttachmentModal from './AttachmentModal'

const PdfViewer = lazy(() => import('./PdfViewer'))

function Inline({ text }) {
  return splitLinks(text).map((part, index) =>
    part.type === 'link' ? (
      <a
        key={index}
        href={part.value}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-brand-green underline"
      >
        {part.value}
      </a>
    ) : (
      <span key={index}>{part.value}</span>
    ),
  )
}

// テキスト資料(type: 'text')の表示。薬剤情報のように、1ページの中に
// 作用・効果／主な適応／…を並べて書いたものを読むための画面。
// 本文の印刷は用意していない(画面で参照する用途のため)が、
// 下にぶら下げた関連資料のPDFは従来どおり印刷できる。
export default function TextViewer({ material, onClose }) {
  const { isEditMode } = useEditMode()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(material.body ?? TEXT_TEMPLATE)
  const [status, setStatus] = useState('idle') // idle | saving | error
  const [errorMessage, setErrorMessage] = useState('')
  // 保存しても material は開いた時点のスナップショットのままなので、
  // 保存後の本文はこちらで保持して表示する(古い本文に戻って見えるのを防ぐ)。
  const [body, setBody] = useState(material.body ?? '')
  // 関連資料も同じ理由で、追加・削除の結果をこちらで持つ。
  const [attachments, setAttachments] = useState(material.attachments ?? [])
  const [showAttachmentModal, setShowAttachmentModal] = useState(false)
  const [openAttachment, setOpenAttachment] = useState(null)
  const blocks = parseText(body)
  const isEmpty = body.replace(/[#\s]/g, '') === ''

  const startEditing = () => {
    setDraft(body || TEXT_TEMPLATE)
    setErrorMessage('')
    setEditing(true)
  }

  const save = async () => {
    setStatus('saving')
    setErrorMessage('')
    try {
      await updateTextMaterialBody(material, draft)
      setBody(draft)
      setStatus('idle')
      setEditing(false)
    } catch (err) {
      console.error('本文の保存に失敗しました', err)
      setStatus('error')
      setErrorMessage('保存に失敗しました。通信状況を確認してください。')
    }
  }

  const handleDeleteAttachment = async (attachment) => {
    if (!window.confirm(`関連資料「${attachment.title}」を削除しますか？`)) return
    try {
      await removeAttachment(material, attachment)
      setAttachments((list) => list.filter((a) => a.id !== attachment.id))
    } catch (err) {
      console.error('関連資料の削除に失敗しました', err)
      window.alert('関連資料を削除できませんでした。')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-brand-cream">
      <div className="flex items-center justify-between border-b border-brand-brown/10 bg-white px-4 py-3">
        <button
          type="button"
          onClick={editing ? () => setEditing(false) : onClose}
          className="rounded-full bg-brand-cream px-4 py-1.5 text-sm text-brand-ink"
        >
          {editing ? 'キャンセル' : '閉じる'}
        </button>

        <h1 className="break-keep text-lg font-semibold text-brand-ink">
          {material.title}
        </h1>

        {editing ? (
          <button
            type="button"
            onClick={save}
            disabled={status === 'saving'}
            className="rounded-full bg-brand-green px-5 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {status === 'saving' ? '保存中...' : '保存'}
          </button>
        ) : isEditMode ? (
          <button
            type="button"
            onClick={startEditing}
            className="rounded-full bg-brand-green px-5 py-1.5 text-sm font-medium text-white"
          >
            編集
          </button>
        ) : (
          <span className="w-16" />
        )}
      </div>

      {errorMessage && (
        <p className="bg-white px-6 pb-2 text-sm text-red-500">{errorMessage}</p>
      )}

      <div className="flex-1 overflow-y-auto">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-full w-full resize-none bg-white p-6 text-base leading-relaxed text-brand-ink outline-none"
            placeholder="「## 見出し」で見出し、「- 」で箇条書きになります。"
          />
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-6">
            {isEmpty && (
              <p className="py-8 text-center text-brand-ink/50">
                まだ何も書かれていません。
                {isEditMode
                  ? '右上の「編集」から書き込めます。'
                  : '編集モードにすると書き込めます。'}
              </p>
            )}

            {blocks.map((block, index) => {
              if (block.type === 'h2') {
                return (
                  <h2
                    key={index}
                    className="mt-6 border-b border-brand-brown/15 pb-1 text-lg font-semibold text-brand-ink first:mt-0"
                  >
                    {block.text}
                  </h2>
                )
              }
              if (block.type === 'h3') {
                return (
                  <h3
                    key={index}
                    className="mt-4 text-base font-semibold text-brand-ink/80"
                  >
                    {block.text}
                  </h3>
                )
              }
              if (block.type === 'ul') {
                return (
                  <ul
                    key={index}
                    className="mt-2 list-disc space-y-1 pl-6 text-base leading-relaxed text-brand-ink"
                  >
                    {block.items.map((item, i) => (
                      <li key={i}>
                        <Inline text={item} />
                      </li>
                    ))}
                  </ul>
                )
              }
              return (
                <p
                  key={index}
                  className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-brand-ink"
                >
                  <Inline text={block.text} />
                </p>
              )
            })}

            {/* 関連資料。薬剤ごとのPDF(添付文書など)をここにぶら下げると、
                50音の一覧には薬剤名が1つ並ぶだけで済む。 */}
            {(attachments.length > 0 || isEditMode) && (
              <div className="mt-10">
                <h2 className="border-b border-brand-brown/15 pb-1 text-lg font-semibold text-brand-ink">
                  関連資料
                </h2>

                {attachments.length === 0 && (
                  <p className="mt-3 text-sm text-brand-ink/50">
                    まだPDFはありません。
                  </p>
                )}

                <ul className="mt-3 space-y-2">
                  {attachments.map((attachment) => (
                    <li key={attachment.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenAttachment(attachment)}
                        className={
                          isEditMode
                            ? 'flex w-full items-center gap-3 rounded-xl border border-brand-brown/10 bg-white py-3 pl-4 pr-12 text-left shadow-sm transition active:scale-[0.99] active:bg-brand-green/5'
                            : 'flex w-full items-center gap-3 rounded-xl border border-brand-brown/10 bg-white px-4 py-3 text-left shadow-sm transition active:scale-[0.99] active:bg-brand-green/5'
                        }
                      >
                        <span className="shrink-0 text-2xl leading-none">
                          📄
                        </span>
                        <span className="break-keep text-base font-medium leading-tight text-brand-ink">
                          {attachment.title}
                        </span>
                      </button>

                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attachment)}
                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-brand-ink/70 text-sm text-white"
                          aria-label="関連資料を削除"
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setShowAttachmentModal(true)}
                    className="mt-3 rounded-full bg-brand-green px-4 py-1.5 text-sm font-medium text-white"
                  >
                    ＋ PDFを追加
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showAttachmentModal && (
        <AttachmentModal
          material={material}
          onAdded={(attachment) =>
            setAttachments((list) => [...list, attachment])
          }
          onClose={() => setShowAttachmentModal(false)}
        />
      )}

      {/* 関連資料のPDFは、このページの上に重ねて開く。閉じると薬剤ページに戻る。
          外側を z-50 にしているので、中のビューア(z-40)がこの画面より前に出る。 */}
      {openAttachment && (
        <div className="fixed inset-0 z-50">
          <Suspense fallback={null}>
            <PdfViewer
              material={openAttachment}
              onClose={() => setOpenAttachment(null)}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
