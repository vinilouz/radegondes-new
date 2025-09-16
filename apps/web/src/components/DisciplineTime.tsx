
import { useStore } from '@tanstack/react-store';
import { studyTimerStore, selectors } from '@/store/studyTimerStore';
import { formatTime } from '@/lib/utils';

export function DisciplineTime({ disciplineId, topicIds }: { disciplineId: string, topicIds: string[] }) {
  const totalMs = useStore(studyTimerStore, selectors.getDisciplineTime(disciplineId, topicIds))
  
  return (
    <div className="font-mono text-lg font-semibold">
      {formatTime(totalMs)}
    </div>
  )
}
