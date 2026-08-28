import { createContext, useCallback, useContext, useState } from 'react'

const EditModeContext = createContext(null)

const EDIT_PIN = import.meta.env.VITE_EDIT_PIN || ''

export function EditModeProvider({ children }) {
  const [isEditMode, setIsEditMode] = useState(false)

  const unlock = useCallback((pin) => {
    if (EDIT_PIN && pin === EDIT_PIN) {
      setIsEditMode(true)
      return true
    }
    return false
  }, [])

  const lock = useCallback(() => setIsEditMode(false), [])

  return (
    <EditModeContext.Provider value={{ isEditMode, unlock, lock }}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode() {
  const ctx = useContext(EditModeContext)
  if (!ctx) {
    throw new Error('useEditMode must be used within EditModeProvider')
  }
  return ctx
}
