import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils'
import { useEffect, useMemo } from 'react'

interface DisciplineTimeProps {
  disciplineId: string
  topicIds: string[]
}

export function DisciplineTime({ disciplineId, topicIds }: DisciplineTimeProps) {
  // Carrega totais ao montar
  useEffect(() => {
    if (topicIds.length > 0) {
      timerActions.loadTotals(topicIds)
    }
  }, [topicIds.join(',')])

  // Força re-render quando timer ativo
  const tick = useStore(studyTimerStore, s => s.tick)
  const state = useStore(studyTimerStore)

  // Calcula tempo total com useMemo para otimização
  const totalTime = useMemo(() => {
    return topicIds.reduce((sum, topicId) => {
      return sum + selectors.getTopicTime(topicId)(state)
    }, 0)
  }, [topicIds.join(','), state, tick])

  return (
    <div className="font-mono text-lg font-semibold text-purple-600 dark:text-purple-400">
      {formatTime(totalTime)}
    </div>
  )
}