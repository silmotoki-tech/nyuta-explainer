// A4のサイズ(ポイント単位)。縦向きなら 595.28 × 841.89。
const A4_SHORT = 595.28
const A4_LONG = 841.89

// 用紙のふち。ふちなし印刷でないプリンタでも切れないよう少し余白を取る。
const MARGIN = 14 // 約5mm

// 元のPDFをA4に整え直した「印刷用PDF」を作る。
//
// スライド(16:9)で作られた資料をA4縦で印刷すると幅がはみ出して切れるため、
// 横長のページはA4横、縦長のページはA4縦の用紙を用意して、中身を余白付きで
// 収まるように縮小して貼り直す。用紙と中身のサイズが必ず一致するので、
// プリンタ側の設定に関係なく切れなくなる。
//
// pdf-lib は容量が大きいので、印刷を使うときだけ読み込む(動的import)。
export async function buildPrintablePdf(material) {
  const response = await fetch(material.fileUrl)
  if (!response.ok) {
    throw new Error(`PDFの取得に失敗しました (${response.status})`)
  }
  const sourceBytes = await response.arrayBuffer()

  const { PDFDocument } = await import('pdf-lib')
  const source = await PDFDocument.load(sourceBytes)
  const output = await PDFDocument.create()
  const embeddedPages = await output.embedPdf(source, source.getPageIndices())

  for (const embedded of embeddedPages) {
    const isLandscape = embedded.width > embedded.height
    const pageWidth = isLandscape ? A4_LONG : A4_SHORT
    const pageHeight = isLandscape ? A4_SHORT : A4_LONG
    const page = output.addPage([pageWidth, pageHeight])

    const scale = Math.min(
      (pageWidth - MARGIN * 2) / embedded.width,
      (pageHeight - MARGIN * 2) / embedded.height,
    )
    const width = embedded.width * scale
    const height = embedded.height * scale

    page.drawPage(embedded, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    })
  }

  const bytes = await output.save()
  // ファイル名は共有シートやプリンタの履歴に出るので、資料名をそのまま使う。
  const safeTitle = (material.title || '資料').replace(/[/\\?%*:|"<>]/g, '-')
  return new File([bytes], `${safeTitle}.pdf`, { type: 'application/pdf' })
}
