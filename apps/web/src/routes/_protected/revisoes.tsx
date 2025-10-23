import { createFileRoute, Link } from '@tanstack/react-router';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X, Filter, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from '@/components/Breadcrumb';
import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { getMonthCalendarDays, isSameDay, isToday, isPastDate, formatRevisionDate } from '@/lib/revisionHelpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute('/_protected/revisoes')({
  component: RevisionPage,
});

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function RevisionPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

  const revisionsQuery = useQuery({
    ...trpc.revision.getRevisionsByUser.queryOptions({
      startDate: startOfMonth,
      endDate: endOfMonth,
    }),
  });

  const revisions = revisionsQuery.data ?? [];

  const filteredRevisions = useMemo(() => {
    if (filterMode === 'pending') {
      return revisions.filter(r => r.completed === 0);
    }
    if (filterMode === 'completed') {
      return revisions.filter(r => r.completed === 1);
    }
    return revisions;
  }, [revisions, filterMode]);

  const updateRevisionMutation = useMutation({
    ...trpc.revision.updateRevision.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.revision.getRevisionsByUser.queryKey({}) });
    },
  });

  const revisionsByDate = useMemo(() => {
    const map = new Map<string, typeof revisions>();
    filteredRevisions.forEach(revision => {
      const dateKey = new Date(revision.scheduledDate).toISOString().split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(revision);
    });
    return map;
  }, [filteredRevisions]);

  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRevisionClick = (revisionDate: Date) => {
    const targetDate = new Date(revisionDate);
    setCurrentDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    setSelectedDate(targetDate);
  };

  const handleToggleRevision = (revisionId: string, currentCompleted: number) => {
    updateRevisionMutation.mutate({
      revisionId,
      completed: currentCompleted === 0,
    });
  };

  const selectedDateRevisions = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return revisionsByDate.get(dateKey) || [];
  }, [selectedDate, revisionsByDate]);

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  const hasRevisions = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return revisionsByDate.has(dateKey);
  };

  const getRevisionCount = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return revisionsByDate.get(dateKey)?.length || 0;
  };

  const getPendingCount = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const dateRevisions = revisionsByDate.get(dateKey) || [];
    return dateRevisions.filter(r => r.completed === 0).length;
  };

  const totalPending = useMemo(() => {
    return filteredRevisions.filter(r => r.completed === 0).length;
  }, [filteredRevisions]);

  const totalCompleted = useMemo(() => {
    return filteredRevisions.filter(r => r.completed === 1).length;
  }, [filteredRevisions]);

  const allRevisionsSorted = useMemo(() => {
    return [...filteredRevisions].sort((a, b) =>
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  }, [filteredRevisions]);

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Revisões</h1>
          <p className="text-muted-foreground mt-2">Acompanhe e gerencie suas revisões agendadas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={goToToday}>
                  Hoje
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_NAMES_SHORT.map((day, idx) => (
                <div key={idx} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const isCurrentMonthDay = isCurrentMonth(date);
                const isTodayDate = isToday(date);
                const hasRevisionsDay = hasRevisions(date);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isPast = isPastDate(date);
                const pendingCount = getPendingCount(date);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    disabled={!isCurrentMonthDay || !hasRevisionsDay}
                    className={`
                      relative aspect-square p-1 rounded-md text-xs transition-all
                      ${isCurrentMonthDay ? 'text-foreground' : 'text-muted-foreground/30'}
                      ${isTodayDate ? 'font-bold ring-1 ring-primary' : ''}
                      ${isSelected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                      ${hasRevisionsDay && !isSelected ? 'bg-primary/10 hover:bg-primary/20' : ''}
                      ${!hasRevisionsDay && isCurrentMonthDay ? 'hover:bg-muted/50' : ''}
                      ${!isCurrentMonthDay || !hasRevisionsDay ? 'cursor-default' : 'cursor-pointer'}
                      ${isPast && hasRevisionsDay && pendingCount > 0 ? 'ring-1 ring-destructive/30' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span>{date.getDate()}</span>
                      {hasRevisionsDay && (
                        <div className="flex gap-0.5 mt-0.5">
                          {pendingCount > 0 && (
                            <div className="w-1 h-1 rounded-full bg-primary" />
                          )}
                          {getRevisionCount(date) - pendingCount > 0 && (
                            <div className="w-1 h-1 rounded-full bg-success" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as typeof filterMode)}>
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="all" className="text-xs">
                    Todas
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">
                    Pendentes
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs">
                    Concluídas
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Pendente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span>Concluída</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <List className="h-5 w-5" />
              Todas as Revisões
              <Badge variant="secondary" className="ml-auto">
                {allRevisionsSorted.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {allRevisionsSorted.length > 0 ? (
                <div className="p-4 pt-0">
                  {allRevisionsSorted.map((revision, index) => {
                    const revDate = new Date(revision.scheduledDate);
                    const isFirstOfDate = index === 0 ||
                      !isSameDay(revDate, new Date(allRevisionsSorted[index - 1].scheduledDate));

                    return (
                      <div key={revision.id}>
                        {isFirstOfDate && (
                          <div className="sticky top-0 bg-background/95 backdrop-blur-sm pt-3 pb-2 -mx-4 px-4 mb-1 z-10 border-b">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                                {formatRevisionDate(revDate)}
                              </h3>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleRevisionClick(revDate)}
                          className={`w-full p-2 mb-1 rounded-md border transition-all text-left group ${
                            revision.completed === 1
                              ? 'bg-success/5 border-success/20 hover:bg-success/10'
                              : 'bg-card border-border hover:border-primary/50 hover:bg-accent'
                          } ${selectedDate && isSameDay(selectedDate, revDate) ? 'ring-1 ring-primary bg-primary/5' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={revision.completed === 1}
                              onCheckedChange={(e) => {
                                e?.stopPropagation?.();
                                handleToggleRevision(revision.id, revision.completed);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <Link
                                to="/planos/$studyId/$disciplineId"
                                params={{ studyId: revision.studyId, disciplineId: revision.disciplineId }}
                                className={`font-medium text-sm hover:underline block truncate ${
                                  revision.completed === 1 ? 'line-through text-muted-foreground' : 'group-hover:text-primary'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {revision.topicName}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-xs text-muted-foreground truncate">
                                  {revision.disciplineName}
                                </p>
                                <span className="text-xs text-muted-foreground/50">•</span>
                                <p className="text-xs text-muted-foreground/70 truncate">
                                  {revision.studyName}
                                </p>
                              </div>
                            </div>
                            {revision.completed === 1 && (
                              <Check className="h-4 w-4 text-success shrink-0" />
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 px-6">
                  <List className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {filterMode === 'all' && 'Nenhuma revisão agendada'}
                    {filterMode === 'pending' && 'Nenhuma revisão pendente'}
                    {filterMode === 'completed' && 'Nenhuma revisão concluída'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
