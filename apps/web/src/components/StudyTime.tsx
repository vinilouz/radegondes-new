import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils'
import { useEffect } from 'react'
import { timerActions } from '@/store/studyTimerStore'

interface StudyTimeProps {
  studyId: string
  topicIds: string[]
}

export function StudyTime({ studyId, topicIds }: StudyTimeProps) {
  const state = useStore(studyTimerStore)
  
  // Carrega totais do backend ao montar
  useEffect(() => {
    if (topicIds.length > 0) {
      timerActions.loadTotals(topicIds)
    }
  }, [topicIds.join(',')]) // Usa join para evitar re-render desnecessário
  
  // Calcula tempo total somando todos os tópicos
  const totalTime = topicIds.reduce((sum, topicId) => {
    return sum + selectors.getTopicTime(topicId)(state)
  }, 0)
  
  return (
    <div className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
      {formatTime(totalTime)}
    </div>
  )
}