import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { cycleActions } from '@/store/cycleStore'
import { formatTime } from '@/lib/utils'
import { Play, Square } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface TopicTimeProps {
  topicId: string
  showButton?: boolean
  disciplineId: string
  studyId: string
  displayMs?: number
  cycleContext?: {
    cycleSessionId?: string
    cycleId: string
    cycleName: string
    topicName: string
    disciplineName: string
  }
  onStop?: () => void | Promise<void>
}

export function TopicTime({ topicId, showButton = true, disciplineId, studyId, displayMs, cycleContext, onStop }: TopicTimeProps) {
  const [isWorking, setIsWorking] = useState(false)
  
  // Usa tick para forçar re-render a cada segundo
  const tick = useStore(studyTimerStore, s => s.tick)
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)
  const totalTime = useStore(studyTimerStore, selectors.getTopicTime(topicId))
  const isActive = activeSession?.topicId === topicId
  const baseTime = typeof displayMs === 'number' ? displayMs : totalTime
  const displayTime = typeof displayMs === 'number'
    ? baseTime + (isActive && activeSession?.startTime ? Date.now() - activeSession.startTime : 0)
    : baseTime
  const hasAnySession = !!activeSession
  
  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isWorking) return
    setIsWorking(true)

    try {
      if (cycleContext?.cycleSessionId) {
        const result = await (await import('@/utils/trpc')).trpcClient.startCycleSession.mutate({
          cycleSessionId: cycleContext.cycleSessionId
        })
        await cycleActions.startCycleSession({
          cycleId: result.cycleId,
          cycleName: result.cycleName,
          topicId: result.topicId,
          topicName: result.topicName,
          disciplineName: result.disciplineName
        })
      }
      await timerActions.startSession(topicId, disciplineId, studyId)
    } catch (error) {
      console.error('Erro ao iniciar:', error)
      alert('Erro ao iniciar timer')
    } finally {
      setIsWorking(false)
    }
  }

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isWorking) return
    setIsWorking(true)

    try {
      await timerActions.stopSession()
      await timerActions.loadTotals([topicId])
      if (onStop) await onStop()
    } catch (error) {
      console.error('Erro ao parar:', error)
      alert('Erro ao parar timer. Tente novamente.')
    } finally {
      setIsWorking(false)
    }
  }
  
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {/* Display do tempo */}
      <div className={`
        font-mono px-3 py-1.5 rounded-lg text-sm font-medium
        ${isActive
          ? 'bg-success/20 text-success ring-2 ring-success/50'
          : 'bg-primary/10 text-primary border border-primary/30'}
      `}>
        {formatTime(displayTime)}
        {isActive && (
          <span className="ml-1.5 inline-block">
            <span className="animate-pulse">●</span>
          </span>
        )}
      </div>
      
      {/* Botões */}
      {showButton && (
        <>
          {!hasAnySession && (
            <Button
              onClick={handleStart}
              disabled={isWorking}
              size="sm"
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              {isWorking ? 'Iniciando...' : 'Iniciar'}
            </Button>
          )}
          
          {isActive && (
            <Button
              onClick={handleStop}
              disabled={isWorking}
              size="sm"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Square className="h-3.5 w-3.5 mr-1" />
              {isWorking ? 'Salvando...' : 'Parar'}
            </Button>
          )}
          
          {hasAnySession && !isActive && (
            <span className="text-xs text-muted-foreground italic">
              Timer ativo em outro tópico
            </span>
          )}
        </>
      )}
    </div>
  )
}