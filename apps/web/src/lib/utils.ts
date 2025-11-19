import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { intervalToDuration, formatDuration, format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
