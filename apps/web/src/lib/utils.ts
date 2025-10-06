import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  const totalSeconds = Math.floor(ms / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds} segundo${totalSeconds !== 1 ? 's' : ''}`;
  }

  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (minutes === 0) {
    return `${hours} hora${hours !== 1 ? 's' : ''}`;
  }

  return `${hours}h ${minutes}min`;
}

export function formatHoursMinutes(ms: number): string {
  const totalMinutes = Math.floor(ms / 1000 / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes}min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

export function formatRemainingDays(totalEstimatedHours: number, studiedHours: number, dailyStudyHours: number): string {
  const remainingHours = Math.max(0, totalEstimatedHours - studiedHours);
  const remainingDays = Math.ceil(remainingHours / dailyStudyHours);

  if (remainingDays === 0 || remainingHours <= 0) {
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
