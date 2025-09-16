
import { useStore } from '@tanstack/react-store';
import { studyTimerStore, selectors } from '@/store/studyTimerStore';
import { formatTime } from '@/lib/utils';

export function StudyTime({ studyId, allTopicIds }: { studyId: string, allTopicIds: string[] }) {
  const totalMs = useStore(studyTimerStore, selectors.getStudyTime(studyId, allTopicIds))
  
  return (
    <div className="font-mono text-xl font-bold text-blue-600">
      {formatTime(totalMs)}
    </div>
  )
}
