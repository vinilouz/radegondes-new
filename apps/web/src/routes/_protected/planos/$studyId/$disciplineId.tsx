import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@/utils/trpc'
import { timerActions } from '@/store/studyTimerStore'
import { DisciplineTime } from '@/components/DisciplineTime'
import { TopicTime } from '@/components/TopicTime'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/Breadcrumb'

export const Route = createFileRoute('/_protected/planos/$studyId/$disciplineId')({
  loader: async ({ params, context }) => {
    const discipline = await context.trpcClient.getDiscipline.query({ disciplineId: params.disciplineId })
    const topics = await context.trpcClient.getTopicsByDiscipline.query({ disciplineId: params.disciplineId })

    const topicIds = topics.map(t => t.id)

    const { topicTotals, disciplineTotals, studyTotals } = await context.trpcClient.timer.getTotals.query({
      disciplineIds: [params.disciplineId],
      topicIds,
    })

    await timerActions.loadTotals(undefined, [params.disciplineId], topicIds, context.trpcClient)

    return { discipline, topics, topicIds }
  },
  component: DisciplinePage,
})

function DisciplinePage() {
  const { discipline, topics, topicIds } = Route.useLoaderData()
  const navigate = Route.useNavigate()

  return (
    <div className="p-6">
      <Breadcrumb />

      {/* Row 2: Title & description | back btn */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{discipline.name}</h1>
          <p className="text-muted-foreground mt-2">
            Tópicos e estudo para {discipline.name}
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

      {/* Row 3: Specific content */}
      <div className="grid gap-4">
        {topics.map(topic => (
          <div key={topic.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{topic.name}</h3>
              <TopicTime
                topicId={topic.id}
                disciplineId={discipline.id}
                studyId={discipline.studyId!}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}