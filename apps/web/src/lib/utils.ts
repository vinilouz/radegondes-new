import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { intervalToDuration, formatDuration, format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
  const duration = intervalToDuration({ start: 0, end: ms });

  return formatDuration(duration, {
    format: ['hours', 'minutes', 'seconds'],
    zero: true,
    delimiter: ' ',
    locale: {
      formatDistance: (token, value) => {
        const units = {
          xSeconds: `${value.toString().padStart(2, '0')}`,
          xMinutes: `${value.toString().padStart(2, '0')}`,
          xHours: `${value.toString().padStart(2, '0')}`
        };
        return units[token] || value.toString();
      }
    }
  });
}

export function formatTimeRelative(ms: number): string {
  const now = new Date();
  const past = new Date(now.getTime() - ms);

  return formatDistanceToNow(past, {
    addSuffix: false,
    locale: ptBR
  });
}

export function formatHoursMinutes(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

export function formatRemainingDays(totalTopics: number, completedTopics: number, dailyTopics: number): string {
  const remainingTopics = Math.max(0, totalTopics - completedTopics);
  const remainingDays = Math.ceil(remainingTopics / dailyTopics);

  if (remainingDays === 0 || remainingTopics <= 0) {
    return "0 dias";
  }

  if (remainingDays === 1) {
    return "1 dia";
  }

  return `${remainingDays} dias`;
}

export function calculateStudyProgress(totalEstimatedHours: number, studiedHours: number): number {
  if (totalEstimatedHours === 0) return 0;
  const progress = (studiedHours / totalEstimatedHours) * 100;
  return Math.min(100, Math.max(0, progress));
}
