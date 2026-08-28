import { Suspense, lazy, useState } from 'react'
import { EditModeProvider } from './hooks/useEditMode'
import HomeScreen from './components/HomeScreen'

// カテゴリ画面(dnd-kit)・PDFビューア(pdf.js)は、ホーム画面の初期表示を
// 軽くするために遅延読み込みする。
const CategoryScreen = lazy(() => import('./components/CategoryScreen'))
const PdfViewer = lazy(() => import('./components/PdfViewer'))

function App() {
  const [category, setCategory] = useState(null)
  const [openMaterial, setOpenMaterial] = useState(null)

  return (
    <EditModeProvider>
      <div className="h-full w-full">
        {!category && <HomeScreen onSelectCategory={setCategory} />}

        <Suspense fallback={null}>
          {category && (
            <CategoryScreen
              category={category}
              onBack={() => setCategory(null)}
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
