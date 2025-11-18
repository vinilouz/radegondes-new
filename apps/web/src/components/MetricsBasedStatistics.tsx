import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime, formatTimeRelative, formatHoursMinutes } from '@/lib/utils';
import { BookOpen, Clock, Flame, TrendingUp } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { subDays, format, startOfDay, isAfter, isBefore, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MetricsBasedStatisticsProps {
  selectedPeriod: number | 'all';
}

interface SessionMetrics {
  totalTime: number;
  totalSessions: number;
  averageSessionTime: number;
  currentStreak: number;
  biggestSessionTime: number;
}

interface DailyProductivityData {
  date: string;
  durationMs: number;
  sortKey: string;
}

export function MetricsBasedStatistics({ selectedPeriod }: MetricsBasedStatisticsProps) {
  const queryDays = selectedPeriod === 'all' ? undefined : selectedPeriod;

  // Queries para buscar dados agregados
  const sessionMetricsQuery = useQuery({
    ...trpc.getStatisticsMetrics.queryOptions({ days: queryDays, groupBy: 'session' })
  });
  const topicMetricsQuery = useQuery({
    ...trpc.getStatisticsMetrics.queryOptions({ days: queryDays, groupBy: 'topic' })
  });
  const disciplineMetricsQuery = useQuery({
    ...trpc.getStatisticsMetrics.queryOptions({ days: queryDays, groupBy: 'discipline' })
  });

  // Calcula métricas principais
  const calculateMainMetrics = (): SessionMetrics => {
    if (!sessionMetricsQuery.data || !Array.isArray(sessionMetricsQuery.data)) {
      return {
        totalTime: 0,
        totalSessions: 0,
        averageSessionTime: 0,
        currentStreak: 0,
        biggestSessionTime: 0
      };
    }

    const sessions = sessionMetricsQuery.data as any[];

    // Tempo total em ms
    const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);

    // Total de sessões e tempo médio
    const totalSessions = sessions.length;
    const averageSessionTime = totalSessions > 0 ? totalTime / totalSessions : 0;

    // Maior sessão
    const biggestSessionTime = sessions.reduce((max, session) =>
      Math.max(max, session.duration || 0), 0
    );

    // Calcula streak (dias consecutivos)
    const currentStreak = calculateStreak(sessions);

    return {
      totalTime,
      totalSessions,
      averageSessionTime,
      currentStreak,
      biggestSessionTime
    };
  };

  // Calcula dias consecutivos de estudo
  const calculateStreak = (sessions: any[]): number => {
    const sessionDays = [...new Set(
      sessions.map(s => startOfDay(new Date(s.startTime)).getTime())
    )].sort((a, b) => b - a); // Do mais recente para o mais antigo

    if (sessionDays.length === 0) return 0;

    const today = startOfToday().getTime();
    const yesterday = subDays(today, 1).getTime();
    const mostRecentSessionDay = sessionDays[0];

    // A sequência só é válida se o último estudo foi hoje ou ontem
    if (mostRecentSessionDay !== today && mostRecentSessionDay !== yesterday) {
      return 0;
    }

    let streak = 1;
    for (let i = 1; i < sessionDays.length; i++) {
      const diffInDays = (sessionDays[i - 1] - sessionDays[i]) / (1000 * 60 * 60 * 24);
      if (diffInDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Processa dados de produtividade diária
  const getDailyProductivityData = (): DailyProductivityData[] => {
    // 1. Cria um mapa para acesso rápido: "2023-11-18" -> 50000ms
    const dataMap = new Map<string, number>();

    if (sessionMetricsQuery.data && Array.isArray(sessionMetricsQuery.data)) {
      sessionMetricsQuery.data.forEach((session: any) => {
        if (!session.startTime) return;
        const sessionDate = new Date(session.startTime);
        // Normaliza a chave para o dia local (yyyy-MM-dd)
        const dateKey = format(startOfDay(sessionDate), 'yyyy-MM-dd');

        const current = dataMap.get(dateKey) || 0;
        dataMap.set(dateKey, current + (session.duration || 0));
      });
    }

    const today = startOfToday();
    const result: DailyProductivityData[] = [];
    let daysToRender = 0;

    // 2. Define quantos dias voltar para trás
    if (typeof selectedPeriod === 'number') {
      // Se selecionou 7 dias, queremos: Hoje + 6 dias para trás (total 7 barras)
      // Se você quer Hoje + 7 dias para trás (total 8 barras), use selectedPeriod
      daysToRender = selectedPeriod - 1;
    } else {
      // Se for 'all', calculamos a diferença entre hoje e a primeira sessão
      // Se não tiver dados, mostra padrão de 7 dias
      if (sessionMetricsQuery.data && sessionMetricsQuery.data.length > 0) {
        // Pega a data mais antiga dos dados retornados
        const sortedSessions = [...sessionMetricsQuery.data].sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        const firstDate = startOfDay(new Date(sortedSessions[0].startTime));
        // Diferença em dias entre hoje e a primeira data
        const diffTime = Math.abs(today.getTime() - firstDate.getTime());
        daysToRender = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        daysToRender = 6; // Padrão visual se não tiver dados
      }
    }

    // 3. Loop Gerador de Datas (do passado até HOJE)
    // i vai de X até 0. Quando i=0, é o dia de hoje.
    for (let i = daysToRender; i >= 0; i--) {
      const date = subDays(today, i);
      const dateKey = format(date, 'yyyy-MM-dd');

      // Tenta pegar do mapa, se não existir (undefined), usa 0
      const durationMs = dataMap.get(dateKey) || 0;

      result.push({
        date: format(date, 'dd/MM', { locale: ptBR }), // Ex: 18/11
        durationMs,
        sortKey: dateKey
      });
    }

    return result;
  };

  // Calcula escala do eixo Y em intervalos de 2h com padding de 1h
  const calculateYAxisConfig = (data: DailyProductivityData[]) => {
    if (data.length === 0) {
      return { domain: [0, 4], ticks: [0, 2, 4] };
    }

    const maxDurationMs = Math.max(...data.map(d => d.durationMs), 0);
    const maxDurationHours = maxDurationMs / (1000 * 60 * 60);

    // Adiciona 1h de padding e arredonda para o próximo múltiplo de 2
    const maxWithPadding = maxDurationHours + 1;
    const maxScale = Math.ceil(maxWithPadding / 2) * 2;

    // Garante mínimo de 4h
    const finalMax = Math.max(4, maxScale);

    // Cria ticks de 2 em 2 horas
    const ticks = [];
    for (let i = 0; i <= finalMax; i += 2) {
      ticks.push(i);
    }

    return { domain: [0, finalMax], ticks };
  };

  // Formata valor em ms para exibição no tooltip
  const formatTooltipValue = (value: number): string => {
    return formatHoursMinutes(value);
  };

  const sessionMetrics = calculateMainMetrics();
  const dailyProductivityData = getDailyProductivityData();
  const yAxisConfig = calculateYAxisConfig(dailyProductivityData);
  console.log('sessionMetrics', sessionMetrics);
  console.log('dailyProductivityData', dailyProductivityData);
  console.log('yAxisConfig', yAxisConfig);


  // Converte ms para horas para exibição no gráfico
  const chartData = dailyProductivityData.map(d => ({
    date: d.date,
    hours: d.durationMs / (1000 * 60 * 60),
    durationMs: d.durationMs // Mantém para o tooltip
  }));

  return (
    <>
      {/* Seção de Validação - Dados Brutos */}
      {/* <div className="mb-8 p-4 border-dashed border-2 border-blue-500 rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-center">Dados Brutos (Validação)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] border p-2 rounded-md">
                <pre className="text-xs">{JSON.stringify(sessionMetricsQuery.data, null, 2)}</pre>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por Tópico</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] border p-2 rounded-md">
                <pre className="text-xs">{JSON.stringify(topicMetricsQuery.data, null, 2)}</pre>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] border p-2 rounded-md">
                <pre className="text-xs">{JSON.stringify(disciplineMetricsQuery.data, null, 2)}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div> */}

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHoursMinutes(sessionMetrics.totalTime)}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === 'all' ? 'desde o início' : `nos últimos ${selectedPeriod} dias`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões de Estudos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionMetrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Média de {formatTimeRelative(sessionMetrics.averageSessionTime)}/sessão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ritmo de Estudos</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionMetrics.currentStreak}</div>
            <p className="text-xs text-muted-foreground">dias consecutivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior Sessão</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHoursMinutes(sessionMetrics.biggestSessionTime)}
            </div>
            <p className="text-xs text-muted-foreground">duração da maior sessão</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Produtividade Diária */}
      <div className="my-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Produtividade por Dia</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Horas estudadas por dia (da mais antiga para a mais recente)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      domain={yAxisConfig.domain}
                      ticks={yAxisConfig.ticks}
                      allowDecimals={false}
                      label={{ value: 'Horas', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        // Busca o durationMs original para formatar corretamente
                        const item = chartData.find(d => d.hours === value);
                        return [formatTooltipValue(item?.durationMs || 0), 'Tempo de Estudo'];
                      }}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Bar
                      dataKey="hours"
                      fill="#e66912"
                      name="Horas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sem dados para exibir</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}