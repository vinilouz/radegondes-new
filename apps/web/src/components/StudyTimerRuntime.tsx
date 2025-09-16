
import { useEffect, useRef } from 'react'
import { studyTimerStore, timerActions, selectors } from '@/store/studyTimerStore'
import { useStore } from '@tanstack/react-store'
import { trpcClient } from '@/utils/trpc'
import { useRouterState } from '@tanstack/react-router'

const AUTOSAVE_INTERVAL = 1_000
const CHANNEL_NAME = 'study_timer_v1'

export function StudyTimerRuntime() {
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)
  const lastTickRef = useRef<number | null>(null)
  const autosaveAccumRef = useRef(0)
  const bcRef = useRef<BroadcastChannel | null>(null)
  const pendingHeartbeatsRef = useRef<Array<{ sessionId: string; deltaMs: number; reason: string }>>([])

  // Restaura sessão ao inicializar
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const restored = await timerActions.restoreSession(trpcClient)
        if (restored) {
          console.log('Timer session restored successfully')
        }
      } catch (e) {
        console.warn('Failed to restore timer session:', e)
      }
    }

    restoreSession()
  }, [])

  // Monitora mudanças de rota para forçar salvamento
  const currentPath = useRouterState({
    select: (s) => s.location.pathname,
  })

  // Força salvamento ao alterar rota (apenas uma vez por mudança)
  const lastPathRef = useRef<string>('')
  useEffect(() => {
    // Evita múltiplas execuções para mesma rota
    if (!activeSession || currentPath === lastPathRef.current) return

    lastPathRef.current = currentPath

    // Só salva se tiver tempo acumulado no acumulador
    if (autosaveAccumRef.current <= 100) return // mínimo 100ms

    const deltaToSend = Math.round(autosaveAccumRef.current) // SEMPRE integer

    console.log('Route change detected - saving accumulated time:', deltaToSend, 'ms')

    // Salvamento simples usando apenas o acumulador
    void timerActions.heartbeat(deltaToSend, trpcClient)
      .then(() => {
        console.log('Timer saved on route change')
        autosaveAccumRef.current = 0
      })
      .catch((e) => {
        console.warn('Failed to save timer on route change:', e)
      })
  }, [currentPath, activeSession])

  // BroadcastChannel para coordenar multiabas
  useEffect(() => {
    bcRef.current = new BroadcastChannel(CHANNEL_NAME)
    bcRef.current.onmessage = (e) => {
      const { type, payload } = e.data || {}
      if (type === 'session-stop' && activeSession?.topicId === payload?.topicId) {
        timerActions.stopSession()
      }
    }
    return () => bcRef.current?.close()
  }, [activeSession?.topicId])

  // Tick do cronômetro (1s para UI, timestamp para precisão)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeSession) {
        lastTickRef.current = null
        return
      }

      const now = performance.now()
      const lastTick = lastTickRef.current ?? now
      const delta = now - lastTick
      lastTickRef.current = now

      timerActions.tick(delta)
      autosaveAccumRef.current += delta

      // Autosave a cada 1s
      if (autosaveAccumRef.current >= AUTOSAVE_INTERVAL) {
        void timerActions.heartbeat(Math.round(autosaveAccumRef.current), trpcClient) // SEMPRE integer
        autosaveAccumRef.current = 0
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession?.sessionId])

  // Cleanup de pendentes no unmount
  useEffect(() => {
    return () => {
      // Cancela pendentes ao desmontar
      pendingHeartbeatsRef.current.forEach(heartbeat => {
        try {
          trpcClient.timer.heartbeat.mutate({
            sessionId: heartbeat.sessionId,
            deltaMs: heartbeat.deltaMs
          }).catch(() => {})
        } catch {
          // Ignora erros de cleanup
        }
      })
      pendingHeartbeatsRef.current = []
    }
  }, [])

  // Page Visibility + Beacon para flush
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushBeacon('visibility')
    }

    const handleBeforeUnload = () => flushBeacon('beforeunload')

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [activeSession])

  function flushBeacon(reason: string) {
    if (!activeSession || autosaveAccumRef.current <= 0) return

    const deltaToSend = Math.round(autosaveAccumRef.current) // SEMPRE integer

    console.log(`${reason} - flushing accumulated time:`, deltaToSend, 'ms')

    // Tenta heartbeat via tRPC
    void timerActions.heartbeat(deltaToSend, trpcClient)
      .catch(() => {
        // Se falhar, adiciona à lista de pendentes
        pendingHeartbeatsRef.current.push({
          sessionId: activeSession.sessionId,
          deltaMs: deltaToSend,
          reason: `${reason}_failed`
        })

        // Limpa pendentes antigos (máximo 3 pendentes)
        if (pendingHeartbeatsRef.current.length > 3) {
          pendingHeartbeatsRef.current = pendingHeartbeatsRef.current.slice(-3)
        }
      })

    autosaveAccumRef.current = 0
    lastTickRef.current = performance.now()
  }

  return null
}
