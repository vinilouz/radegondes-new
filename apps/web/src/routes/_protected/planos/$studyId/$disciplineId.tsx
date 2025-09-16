import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@/utils/trpc'
import { timerActions } from '@/store/studyTimerStore'
import { DisciplineTime } from '@/components/DisciplineTime'
import { TopicTime } from '@/components/TopicTime'

export const Route = createFileRoute('/_protected/planos/$studyId/$disciplineId')({
  loader: async ({ params, context }) => {
    const discipline = await context.trpcClient.getDiscipline.query({ disciplineId: params.disciplineId })
    const topics = await context.trpcClient.getTopicsByDiscipline.query({ disciplineId: params.disciplineId })

    const topicIds = topics.map(t => t.id)

    // Carregar totais manualmente sem usar store trpc para evitar conflito de contexto
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{discipline.name}</h1>
        <DisciplineTime disciplineId={discipline.id} topicIds={topicIds} />
      </div>

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