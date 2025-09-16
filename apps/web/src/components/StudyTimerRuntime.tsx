import { useEffect } from 'react'
import { timerActions } from '@/store/studyTimerStore'

export function StudyTimerRuntime() {
  // Restaura sessão ao montar
  useEffect(() => {
    timerActions.restoreSession()
  }, [])
  
  // GARANTE salvamento ao desmontar/fechar
  useEffect(() => {
    const saveOnUnload = (e: BeforeUnloadEvent) => {
      // Tenta salvar de forma SÍNCRONA
      const session = localStorage.getItem('timer_session_v2')
      if (!session) return
      
      const parsed = JSON.parse(session)
      const duration = Math.round(Date.now() - parsed.startTime)
      
      // Usa sendBeacon para garantir envio
      const url = `${import.meta.env.VITE_SERVER_URL}/trpc/timer.stopSession`
      const data = JSON.stringify({
        sessionId: parsed.sessionId,
        duration: duration
      })
      
      navigator.sendBeacon(url, data)
      
      // Também tenta salvar via fetch síncrono (backup)
      try {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url, false) // false = síncrono
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(data)
      } catch (error) {
        // Ignora erro, sendBeacon já deve ter funcionado
      }
      
      // Remove do localStorage para evitar duplicação
      localStorage.removeItem('timer_session_v2')
    }
    
    // Salva quando aba fica oculta
    const saveOnHide = () => {
      if (document.visibilityState === 'hidden') {
        timerActions.stopSession().catch(console.error)
      }
    }
    
    window.addEventListener('beforeunload', saveOnUnload)
    window.addEventListener('unload', saveOnUnload) // Backup
    document.addEventListener('visibilitychange', saveOnHide)
    
    return () => {
      window.removeEventListener('beforeunload', saveOnUnload)
      window.removeEventListener('unload', saveOnUnload)
      document.removeEventListener('visibilitychange', saveOnHide)
    }
  }, [])
  
  return null
}