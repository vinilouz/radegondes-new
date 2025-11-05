import { Progress } from '@/components/ui/progress';
import { formatTime } from '@/lib/utils';

interface CycleProgressProps {
  completedTime: number;
  totalTime: number;
  className?: string;
}

export function CycleProgress({ completedTime, totalTime, className }: CycleProgressProps) {
  const percentage = totalTime > 0 ? Math.round((completedTime / totalTime) * 100) : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progresso</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatTime(completedTime)} estudados</span>
        <span>{formatTime(totalTime)} total</span>
      </div>
    </div>
  );
}