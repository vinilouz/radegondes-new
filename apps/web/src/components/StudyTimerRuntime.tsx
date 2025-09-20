import { useEffect, useState, useRef } from 'react'
import { useStore } from '@tanstack/react-store'
import { timerActions, studyTimerStore, selectors } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils'

export function StudyTimerRuntime() {
  const [originalTitle] = useState(() => document.title)
  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)
  const sessionTime = useStore(studyTimerStore, selectors.getCurrentSessionTime)

  // Restaura sessão ao montar
  useEffect(() => {
    timerActions.restoreSession()
  }, [])

  // Atualiza título da página quando timer está ativo
  useEffect(() => {
    if (activeSession) {
      const updateTitle = () => {
        const currentTime = Date.now() - activeSession.startTime
        document.title = `${formatTime(currentTime)} - ${originalTitle}`
      }

      updateTitle()
      titleIntervalRef.current = setInterval(updateTitle, 1000)

      return () => {
        if (titleIntervalRef.current) {
          clearInterval(titleIntervalRef.current)
        }
      }
    } else {
      document.title = originalTitle
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current)
      }
    }
  }, [activeSession, originalTitle])
  
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
    
    
    window.addEventListener('beforeunload', saveOnUnload)
    window.addEventListener('unload', saveOnUnload) // Backup
    
    return () => {
      window.removeEventListener('beforeunload', saveOnUnload)
      window.removeEventListener('unload', saveOnUnload)
      document.title = originalTitle
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current)
      }
    }
  }, [originalTitle])
  
  return null
}