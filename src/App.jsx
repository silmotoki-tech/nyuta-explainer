import { Suspense, lazy, useState } from 'react'
import { EditModeProvider } from './hooks/useEditMode'
import HomeScreen from './components/HomeScreen'

// カテゴリ画面(dnd-kit)・PDFビューア(pdf.js)は、ホーム画面の初期表示を
// 軽くするために遅延読み込みする。
const CategoryScreen = lazy(() => import('./components/CategoryScreen'))
const PdfViewer = lazy(() => import('./components/PdfViewer'))

function App() {
  // カテゴリは入れ子にできる(例: 診療資料 → 運動器 → 資料)。
  // 「今どこを開いているか」を配列(パンくず)で持たせることで、
  // 何階層になっても同じ仕組みで1つ上に戻れる。
  const [path, setPath] = useState([])
  const [openMaterial, setOpenMaterial] = useState(null)

  const current = path.length > 0 ? path[path.length - 1] : null

  const openCategory = (category) => setPath((p) => [...p, category])
  const goBack = () => setPath((p) => p.slice(0, -1))

  return (
    <EditModeProvider>
      <div className="h-full w-full">
        {!current && <HomeScreen onSelectCategory={openCategory} />}

        <Suspense fallback={null}>
          {current && (
            <CategoryScreen
              category={current}
              onBack={goBack}
              onOpenCategory={openCategory}
              onOpenMaterial={setOpenMaterial}
            />
          )}

          {openMaterial && (
            <PdfViewer
              material={openMaterial}
              onClose={() => setOpenMaterial(null)}
            />
          )}
        </Suspense>
      </div>
    </EditModeProvider>
  )
}

export default App
