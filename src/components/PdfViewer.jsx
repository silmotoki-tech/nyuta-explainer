import { useEffect, useRef, useState } from 'react'
import pdfjsLib from '../lib/pdfjsSetup'

export default function PdfViewer({ material, onClose }) {
  const canvasRef = useRef(null)
  const pdfRef = useRef(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // PDF本体は開いた瞬間だけ読み込む。一度読み込んだファイルはService Workerの
  // キャッシュ(CacheFirst)が効くので、2回目以降はほぼ通信なしで開ける。
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    pdfjsLib
      // Firebase StorageのバケットはデフォルトでCORSのプリフライト(Rangeヘッダー付き
      // リクエスト)に対応していないため、range/streamを無効化して単純な一括GETに
      // する。どのみちService Workerで丸ごとキャッシュするのでこれで問題ない。
      .getDocument({
        url: material.fileUrl,
        disableRange: true,
        disableStream: true,
      })
      .promise.then((pdf) => {
        if (cancelled) return
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setPageNum(1)
      })
      .catch((err) => {
        console.error('PDFの読み込みに失敗しました', err)
        if (!cancelled) setError(true)
      })

        return () => {
      cancelled = true
      // 後片付け(メモリ解放)が失敗しても、画面が壊れないようにする。
      // (destroyが無いpdf.jsのバージョン/設定があるため)
      try {
        if (
          pdfRef.current &&
          typeof pdfRef.current.destroy === 'function'
        ) {
          pdfRef.current.destroy()
        }
      } catch (err) {
        console.warn('PDFの後片付けに失敗しました(処理は続行します)', err)
      }
      pdfRef.current = null
    }
  }, [material.fileUrl])

  useEffect(() => {
    const pdf = pdfRef.current
    if (!pdf) return
    let cancelled = false

    setLoading(true)
    pdf
      .getPage(pageNum)
      .then((page) => {
        if (cancelled) return
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        const container = canvas.parentElement
        const baseViewport = page.getViewport({ scale: 1 })
        const scale = Math.min(
          container.clientWidth / baseViewport.width,
          container.clientHeight / baseViewport.height,
        )
        const viewport = page.getViewport({ scale })

        canvas.width = viewport.width
        canvas.height = viewport.height

        return page.render({ canvasContext: context, viewport }).promise
      })
      .then(() => {
        if (!cancelled) setLoading(false)
      })
      .catch((err) => {
        console.error('ページの表示に失敗しました', err)
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [pageNum, numPages])

  const goPrev = () => setPageNum((p) => Math.max(1, p - 1))
  const goNext = () => setPageNum((p) => Math.min(numPages, p + 1))

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-brand-ink">
      <div className="flex items-center justify-between px-4 py-2 text-white">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 px-4 py-1.5 text-sm"
        >
          閉じる
        </button>
        <span className="text-sm text-white/70">
          {material.title}
          {numPages > 0 && ` （${pageNum} / ${numPages}）`}
        </span>
        <span className="w-16" />
      </div>

      <div className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white/60">
            読み込み中...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-white/80">
            資料を開けませんでした。通信状況を確認してください。
          </div>
        )}

        <div className="flex h-full w-full items-center justify-center">
          <canvas ref={canvasRef} className="max-h-full max-w-full" />
        </div>

        {/* 左右タップでページ送り */}
        <button
          type="button"
          aria-label="前のページ"
          onClick={goPrev}
          disabled={pageNum <= 1}
          className="absolute inset-y-0 left-0 w-1/4 disabled:opacity-0"
        />
        <button
          type="button"
          aria-label="次のページ"
          onClick={goNext}
          disabled={pageNum >= numPages}
          className="absolute inset-y-0 right-0 w-1/4 disabled:opacity-0"
        />
      </div>

      {numPages > 1 && (
        <div className="flex items-center justify-center gap-6 py-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={pageNum <= 1}
            className="rounded-full bg-white/10 px-6 py-2 text-white disabled:opacity-30"
          >
            ← 前へ
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={pageNum >= numPages}
            className="rounded-full bg-white/10 px-6 py-2 text-white disabled:opacity-30"
          >
            次へ →
          </button>
        </div>
      )}
    </div>
  )
}
