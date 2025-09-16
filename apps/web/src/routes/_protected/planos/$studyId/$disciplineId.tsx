import { createFileRoute } from '@tanstack/react-router'
import { timerActions } from '@/store/studyTimerStore'
import { TopicTime } from '@/components/TopicTime'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useEffect } from 'react'

export const Route = createFileRoute('/_protected/planos/$studyId/$disciplineId')({
  loader: async ({ params, context }) => {
    const discipline = await context.trpcClient.getDiscipline.query({ 
      disciplineId: params.disciplineId 
    })
    const topics = await context.trpcClient.getTopicsByDiscipline.query({ 
      disciplineId: params.disciplineId 
    })
    
    return { discipline, topics }
  },
  component: DisciplinePage,
})

function DisciplinePage() {
  const { discipline, topics } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  
  // Carrega os totais de tempo ao montar a página
  useEffect(() => {
    const topicIds = topics.map(t => t.id)
    if (topicIds.length > 0) {
      timerActions.loadTotals(topicIds)
    }
  }, [topics.map(t => t.id).join(',')])
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Breadcrumb />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {discipline.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            {topics.length} tópicos para estudar
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => navigate({ to: `/planos/${discipline.studyId}` })}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      {/* Topics Grid */}
      <div className="space-y-3">
        {topics.map(topic => (
          <div 
            key={topic.id} 
            className="group bg-card border border-border hover:border-primary/50 
                       rounded-xl p-5 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              {/* Topic Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {topic.name}
                </h3>
                
                {/* Status Badge */}
                <div className="mt-2 flex items-center gap-2">
                  {topic.status === 'completed' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                                   bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      ✓ Concluído
                    </span>
                  )}
                  {topic.status === 'in_progress' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                                   bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      ◐ Em progresso
                    </span>
                  )}
                  {topic.status === 'not_started' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                                   bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      ○ Não iniciado
                    </span>
                  )}
                  
                  {/* Progress Stats */}
                  {(topic.correct > 0 || topic.wrong > 0) && (
                    <span className="text-xs text-muted-foreground">
                      Acertos: {topic.correct} | Erros: {topic.wrong}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Timer Component */}
              <TopicTime
                topicId={topic.id}
                disciplineId={discipline.id}
                studyId={discipline.studyId!}
                showButton={true}
              />
            </div>
            
            {/* Notes (if any) */}
            {topic.notes && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {topic.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {topics.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground mb-4">
            Nenhum tópico adicionado ainda
          </p>
          <Button variant="outline">
            Adicionar Primeiro Tópico
          </Button>
        </div>
      )}
    </div>
  )
}