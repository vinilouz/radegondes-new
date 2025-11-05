import { useEffect } from 'react'
import { cycleActions } from '@/store/cycleStore'

export function CycleTimerRuntime() {
  // Restaura sessão ao montar
  useEffect(() => {
    cycleActions.restoreSession()
  }, [])

  return null // Componente runtime, não renderiza nada
}