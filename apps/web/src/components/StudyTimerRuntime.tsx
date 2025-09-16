import { useEffect } from 'react'
import { timerActions } from '@/store/studyTimerStore'

export function StudyTimerRuntime() {
  // Restaura sessão ao montar
  useEffect(() => {
    timerActions.restoreSession()
  }, [])
  
  // Salva ao desmontar ou ocultar página
  useEffect(() => {
    const saveBeforeUnload = () => {
      const session = timerActions.getActiveSession()
      if (!session) return
      
      // Força salvamento síncrono (melhor esforço)
      const currentDuration = Date.now() - session.startTimestamp
      const deltaToSave = currentDuration - session.savedDuration
      
      if (deltaToSave > 0) {
        // Usa sendBeacon para garantir envio
        const data = JSON.stringify({
          sessionId: session.sessionId,
          deltaMs: Math.round(deltaToSave)
        })
        
        navigator.sendBeacon('/trpc/timer.heartbeat', data)
      }
    }
    
    // Salva quando página fica oculta
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveBeforeUnload()
      }
    }
    
    window.addEventListener('beforeunload', saveBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('beforeunload', saveBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  return null
}