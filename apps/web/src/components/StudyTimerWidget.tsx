
import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils';

export function StudyTimerWidget() {
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)

  const totalMs = useStore(studyTimerStore, (state) => {
    if (!activeSession) return 0
    return selectors.getTopicTime(activeSession.topicId)(state)
  })

  if (!activeSession) return null

  const currentMs = activeSession.elapsedMs

  return (
    <div className="fixed bottom-4 right-4 bg-blue-900 text-white p-4 rounded-lg shadow-lg min-w-[200px]">
      <div className="text-sm opacity-75">Estudando:</div>
      <div className="font-semibold text-lg mb-2">{activeSession.topicId}</div>
      
      <div className="space-y-1">
        <div className="text-sm">
          Sessão: <span className="font-mono">{formatTime(currentMs)}</span>
        </div>
        <div className="text-sm">
          Total: <span className="font-mono">{formatTime(totalMs)}</span>
        </div>
      </div>

      <button
        onClick={() => timerActions.stopSession()}
        className="mt-3 w-full bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
      >
        Parar
      </button>
    </div>
  )
}
