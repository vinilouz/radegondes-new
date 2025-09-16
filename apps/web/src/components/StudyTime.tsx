import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils'
import { useEffect } from 'react'

interface StudyTimeProps {
  studyId: string
  topicIds: string[]
}

export function StudyTime({ studyId, topicIds }: StudyTimeProps) {
  // Carrega totais ao montar
  useEffect(() => {
    if (topicIds.length > 0) {
      timerActions.loadTotals(topicIds)
    }
  }, [topicIds.join(',')])
  
  // Força re-render quando timer ativo
  const tick = useStore(studyTimerStore, s => s.tick)
  const state = useStore(studyTimerStore)
  
  // Calcula tempo total
  const totalTime = topicIds.reduce((sum, topicId) => {
    return sum + selectors.getTopicTime(topicId)(state)
  }, 0)
  
  return (
    <div className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
      {formatTime(totalTime)}
    </div>
  )
}