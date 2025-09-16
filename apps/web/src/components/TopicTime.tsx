import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils'
import { Play, Square } from 'lucide-react'
import { useState } from 'react'

interface TopicTimeProps {
  topicId: string
  showButton?: boolean
  disciplineId: string
  studyId: string
}

export function TopicTime({ topicId, showButton = true, disciplineId, studyId }: TopicTimeProps) {
  const [isWorking, setIsWorking] = useState(false)
  
  // Usa tick para forçar re-render a cada segundo
  const tick = useStore(studyTimerStore, s => s.tick)
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)
  const totalTime = useStore(studyTimerStore, selectors.getTopicTime(topicId))
  
  const isActive = activeSession?.topicId === topicId
  const hasAnySession = !!activeSession
  
  const handleStart = async () => {
    if (isWorking) return
    setIsWorking(true)
    
    try {
      await timerActions.startSession(topicId, disciplineId, studyId)
    } catch (error) {
      console.error('Erro ao iniciar:', error)
      alert('Erro ao iniciar timer')
    } finally {
      setIsWorking(false)
    }
  }
  
  const handleStop = async () => {
    if (isWorking) return
    setIsWorking(true)
    
    try {
      await timerActions.stopSession()
      // Força reload dos totais após parar
      await timerActions.loadTotals([topicId])
    } catch (error) {
      console.error('Erro ao parar:', error)
      alert('Erro ao parar timer. Tente novamente.')
    } finally {
      setIsWorking(false)
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      {/* Display do tempo */}
      <div className={`
        font-mono px-3 py-1.5 rounded-lg text-sm font-medium
        ${isActive 
          ? 'bg-green-500/20 text-green-700 dark:text-green-400 ring-2 ring-green-500/50' 
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
      `}>
        {formatTime(totalTime)}
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
            <button
              onClick={handleStart}
              disabled={isWorking}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 
                       disabled:bg-gray-400 disabled:cursor-not-allowed
                       text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              {isWorking ? 'Iniciando...' : 'Iniciar'}
            </button>
          )}
          
          {isActive && (
            <button
              onClick={handleStop}
              disabled={isWorking}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700
                       disabled:bg-gray-400 disabled:cursor-not-allowed
                       text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Square className="h-3.5 w-3.5" />
              {isWorking ? 'Salvando...' : 'Parar'}
            </button>
          )}
          
          {hasAnySession && !isActive && (
            <span className="text-xs text-gray-500 italic">
              Timer ativo em outro tópico
            </span>
          )}
        </>
      )}
    </div>
  )
}