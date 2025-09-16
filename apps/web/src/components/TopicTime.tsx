import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils'
import { Play, Square } from 'lucide-react'

interface TopicTimeProps {
  topicId: string
  showButton?: boolean
  disciplineId: string
  studyId: string
}

export function TopicTime({ topicId, showButton = true, disciplineId, studyId }: TopicTimeProps) {
  const totalTime = useStore(studyTimerStore, selectors.getTopicTime(topicId))
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)

  const isActive = activeSession?.topicId === topicId
  const hasAnyActiveSession = !!activeSession

  const handleStart = async () => {
    try {
      await timerActions.startSession(topicId, disciplineId, studyId)
    } catch (error) {
      console.error('Erro ao iniciar timer:', error)
      alert('Erro ao iniciar timer. Tente novamente.')
    }
  }

  const handleStop = async () => {
    try {
      await timerActions.stopSession()
    } catch (error) {
      console.error('Erro ao parar timer:', error)
      alert('Erro ao parar timer. Tente novamente.')
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Timer Display */}
      <div className={`
        font-mono text-sm px-3 py-1 rounded-lg
        ${isActive
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
      `}>
        {formatTime(totalTime)}
        {isActive && (
          <span className="ml-2 inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Control Button */}
      {showButton && !hasAnyActiveSession && (
        <button
          onClick={handleStart}
          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Play className="h-3 w-3" />
          Iniciar
        </button>
      )}

      {showButton && isActive && (
        <button
          onClick={handleStop}
          className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Square className="h-3 w-3" />
          Parar
        </button>
      )}

      {showButton && hasAnyActiveSession && !isActive && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Timer ativo em outro tópico
        </span>
      )}
    </div>
  )
}