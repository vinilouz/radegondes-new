
import { useEffect, useRef } from 'react'
import { studyTimerStore, timerActions, selectors } from '@/store/studyTimerStore'
import { useStore } from '@tanstack/react-store'
import { trpcClient } from '@/utils/trpc'

const AUTOSAVE_INTERVAL = 20_000
const CHANNEL_NAME = 'study_timer_v1'

export function StudyTimerRuntime() {
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)
  const lastTickRef = useRef<number | null>(null)
  const autosaveAccumRef = useRef(0)
  const bcRef = useRef<BroadcastChannel | null>(null)

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

      // Autosave a cada 20s
      if (autosaveAccumRef.current >= AUTOSAVE_INTERVAL) {
        void timerActions.heartbeat(Math.floor(autosaveAccumRef.current), trpcClient)
        autosaveAccumRef.current = 0
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSession?.sessionId])

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

    const delta = Math.floor(autosaveAccumRef.current)
    const payload = { sessionId: activeSession.sessionId, deltaMs: delta, reason }
    const url = `${import.meta.env.VITE_SERVER_URL}/trpc/timer.heartbeat`

    const success = navigator.sendBeacon?.(
      url,
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    )

    if (!success) {
        trpcClient.timer.heartbeat.mutate(payload).catch(() => {});
    }

    autosaveAccumRef.current = 0
    lastTickRef.current = performance.now()
  }

  return null
}
