import pdfjsLib from './pdfjsSetup'

// PDFファイル(File/Blob)の1ページ目を、サムネイル表示用の軽量なJPEG Blobに変換する。
// サムネイル一覧の表示を軽くするため、PDF原本ではなくこの小さい画像だけを一覧に読み込む。
export async function generateThumbnailFromPdf(file, { maxWidth = 480 } = {}) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)

  const baseViewport = page.getViewport({ scale: 1 })
  const scale = maxWidth / baseViewport.width
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const context = canvas.getContext('2d')

  await page.render({ canvasContext: context, viewport }).promise

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.82),
  )

  await pdf.destroy()

  return blob
}
