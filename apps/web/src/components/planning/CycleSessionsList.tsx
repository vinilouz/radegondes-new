import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Clock, Calendar } from 'lucide-react';
import { formatTimeRelative } from '@/lib/utils';
import { cycleStore, cycleActions } from '@/store/cycleStore';
import { useNavigate } from '@tanstack/react-router';

interface CycleSessionsListProps {
  cycleId: string;
}

const DISCIPLINE_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-red-500',
];

const getDisciplineColor = (disciplineName: string) => {
  const hash = disciplineName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DISCIPLINE_COLORS[hash % DISCIPLINE_COLORS.length];
};

export function CycleSessionsList({ cycleId }: CycleSessionsListProps) {
  const cycleDetailsQuery = useQuery({
    ...trpc.getCycleDetails.queryOptions({ cycleId }),
  });

  const startCycleSessionMutation = trpc.startCycleSession.useMutation();
  const navigate = useNavigate();

  // Usar store como no projeto
  const currentCycleSession = cycleStore.use((state) => state.activeCycleSession);
  const isSessionActive = cycleStore.use((state) => !!state.activeCycleSession);

  const handleStartSession = async (sessionId: string) => {
    try {
      const result = await startCycleSessionMutation.mutateAsync({
        cycleSessionId: sessionId,
      });

      // Iniciar sessão no store
      await cycleActions.startCycleSession(result);

    } catch (error) {
    }
  };

  if (cycleDetailsQuery.isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Carregando sessões...</p>
      </div>
    );
  }

  const futureSessions = cycleDetailsQuery.data?.futureSessions || [];

  if (futureSessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma sessão agendada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {futureSessions.slice(0, 10).map((session) => (
        <Card key={session.id} className="w-full">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {/* Indicator for discipline */}
                <div className={`w-3 h-3 rounded-full ${getDisciplineColor(session.disciplineName)}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{session.topicName}</h4>
                    <Badge variant="outline" className="text-xs">
                      {session.disciplineName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.scheduledDate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short'
                      })} às {new Date(session.scheduledDate).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.duration} min
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {session.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => handleStartSession(session.id)}
                    disabled={startCycleSessionMutation.isPending}
                    className="bg-chart-1 hover:bg-chart-1/90 text-chart-1-foreground"
                  >
                    <PlayCircle className="h-4 w-4" />
                    Iniciar
                  </Button>
                )}

                {session.status === 'in_progress' && (
                  <Badge variant="default" className="bg-orange-500">
                    Em andamento
                  </Badge>
                )}

                {session.status === 'completed' && (
                  <Badge variant="default" className="bg-green-500">
                    {formatTimeRelative(session.actualDuration * 1000 * 60)}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {futureSessions.length > 10 && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            Ver mais {futureSessions.length - 10} sessões
          </Button>
        </div>
      )}
    </div>
  );
}