import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils'
import { X, Square, Timer, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/utils/trpc'

export function StudyTimerWidget() {
  const [isStopping, setIsStopping] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()

  useStore(studyTimerStore, s => s.tick)
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)
  const sessionTime = useStore(studyTimerStore, selectors.getCurrentSessionTime)

  const disciplineQuery = useQuery({
    ...trpc.getDiscipline.queryOptions({ disciplineId: activeSession?.disciplineId ?? '' }),
    enabled: !!activeSession?.disciplineId,
  })

  const topicsQuery = useQuery({
    ...trpc.getTopicsByDiscipline.queryOptions({ disciplineId: activeSession?.disciplineId ?? '' }),
    enabled: !!activeSession?.disciplineId,
  })

  const currentTopic = topicsQuery.data?.find(topic => topic.id === activeSession?.topicId)

  useEffect(() => {
    if (activeSession) {
      setIsStopping(false)
    }
  }, [activeSession?.sessionId])

  if (!activeSession) return null

  const handleStop = async () => {
    if (isStopping) return
    setIsStopping(true)

    try {
      await timerActions.stopSession()
      await timerActions.loadTotals([activeSession.topicId])
    } catch (error) {
      alert('Erro ao salvar. Por favor, tente novamente!')
      setIsStopping(false)
    }
  }

  const handleNavigateToDiscipline = () => {
    if (activeSession) {
      navigate({
        to: '/planos/$studyId/$disciplineId',
        params: {
          studyId: activeSession.studyId,
          disciplineId: activeSession.disciplineId
        }
      })
    }
  }
  
  if (!isExpanded) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 group cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="bg-primary text-primary-foreground rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Timer className="h-5 w-5" />
            </div>
            <div className="font-mono text-sm font-bold tracking-tight">
              {formatTime(sessionTime)}
            </div>
          </div>
        </div>

        {/* Tooltip hint */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-background border rounded-lg px-3 py-2 text-xs text-muted-foreground whitespace-nowrap shadow-md">
            Clique para expandir
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="py-4 fixed bottom-4 right-4 gap-0 w-[320px] z-50 shadow-2xl border hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Timer Ativo
            </span>
          </div>
          <Button
            onClick={() => setIsExpanded(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {disciplineQuery.data && currentTopic && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Disciplina:</span>
              <span className="ml-2 font-medium">{disciplineQuery.data.name}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Tópico:</span>
              <span className="ml-2 font-medium">{currentTopic.name}</span>
            </div>
          </div>
        )}

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
          <div className="font-mono text-xl font-bold text-primary flex items-center justify-center gap-2">
            {formatTime(sessionTime)}
            <span className="animate-pulse text-primary">●</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleNavigateToDiscipline}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ir para Disciplina
          </Button>
          <Button
            onClick={handleStop}
            disabled={isStopping}
            variant="destructive"
            size="sm"
            className="flex-1"
          >
            {isStopping ? (
              'Salvando...'
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Parar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}