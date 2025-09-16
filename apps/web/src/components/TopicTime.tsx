
import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { trpcClient } from '@/utils/trpc'
import { formatTime } from '@/lib/utils'

interface TopicTimeProps {
  topicId: string
  showButton?: boolean
  disciplineId: string
  studyId: string
}

export function TopicTime({ topicId, showButton = true, disciplineId, studyId }: TopicTimeProps) {
  const totalMs = useStore(studyTimerStore, selectors.getTopicTime(topicId))
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)
  const isActive = activeSession?.topicId === topicId
  const hasAnyActiveSession = !!activeSession

  return (
    <div className="flex items-center gap-3">
      <div className={`font-mono ${isActive ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
        {formatTime(totalMs)}
        {isActive && <span className="ml-1 animate-pulse">●</span>}
      </div>
      
      {showButton && !hasAnyActiveSession && (
        <button
          onClick={() => timerActions.startSession(topicId, disciplineId, studyId, trpcClient)}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          Iniciar
        </button>
      )}
      
      {showButton && isActive && (
        <button
          onClick={() => timerActions.stopSession()}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Parar
        </button>
      )}
    </div>
  )
}
