export const PERIODIC_DAYS_OPTIONS = [1, 3, 5, 7, 10, 14, 20, 28, 30, 60, 90, 120];

export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export const normalizeDateToMidnight = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const calculatePeriodicDates = (baseDate: Date, selectedDays: number[]): Date[] => {
  const normalizedBase = normalizeDateToMidnight(baseDate);

  return selectedDays.map(days => {
    const newDate = new Date(normalizedBase);
    newDate.setDate(normalizedBase.getDate() + days);
    return newDate;
  });
};

export const calculateWeeklyDates = (
  baseDate: Date,
  selectedWeekdays: number[],
  numberOfWeeks: number
): Date[] => {
  const normalizedBase = normalizeDateToMidnight(baseDate);
  const dates: Date[] = [];

  for (let week = 0; week < numberOfWeeks; week++) {
    for (const weekday of selectedWeekdays) {
      const date = new Date(normalizedBase);
      const currentWeekday = date.getDay();
      const daysToAdd = (weekday - currentWeekday + 7) % 7 + (week * 7);

      date.setDate(date.getDate() + daysToAdd);

      if (daysToAdd >= 0) {
        dates.push(date);
      }
    }
  }

  return dates.sort((a, b) => a.getTime() - b.getTime());
};

export const formatRevisionDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    weekday: 'short'
  });
};

export const getMonthCalendarDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  const firstWeekday = firstDay.getDay();
  for (let i = firstWeekday; i > 0; i--) {
    const date = new Date(year, month, 1 - i);
    days.push(date);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  const lastWeekday = lastDay.getDay();
  for (let i = 1; i < 7 - lastWeekday; i++) {
    const date = new Date(year, month + 1, i);
    days.push(date);
  }

  return days;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const isPastDate = (date: Date): boolean => {
  const today = normalizeDateToMidnight(new Date());
  const compareDate = normalizeDateToMidnight(date);
  return compareDate < today;
};
