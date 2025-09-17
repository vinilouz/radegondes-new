import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime, formatTimeRelative } from '@/lib/utils';
import { BookOpen, Clock, Target, TrendingUp, Award, Flame, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Route = createFileRoute('/_protected/estatisticas')({
  component: EstatisticasPage,
});

function EstatisticasPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // Buscar estatísticas do backend
  const statisticsQuery = useQuery({
    ...trpc.getStudyStatistics.queryOptions({ days: selectedPeriod }),
  });

  // Buscar todos os estudos para estatísticas gerais
  const studiesQuery = useQuery({
    ...trpc.getStudies.queryOptions(),
  });

  const stats = statisticsQuery.data;

  // Formatear dados para o gráfico com bounds checking
  const chartData = stats?.dailyData.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }),
    duration: Math.round(Math.min(item.duration / 60, 1440)), // max 24 horas por dia
  })).sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime()) ?? [];

  // Calcular teto máximo razoável para o gráfico
  const maxDuration = Math.max(...chartData.map(d => d.duration), 0);
  const reasonableMax = maxDuration > 0 ? Math.max(maxDuration + 10, 30) : 60;

  if (statisticsQuery.isLoading || studiesQuery.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estatísticas</h1>
          <p className="text-muted-foreground mt-2">Acompanhe seu progresso e performance de estudos</p>
        </div>

        {/* Filtros de Período */}
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              variant={selectedPeriod === days ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(days)}
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats?.totalTime || 0)}</div>
            <p className="text-xs text-muted-foreground">
              nos últimos {selectedPeriod} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Média de {formatTimeRelative(stats?.averageSessionTime || 0)}/sessão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.currentStreak || 0}</div>
            <p className="text-xs text-muted-foreground">
              dias consecutivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horário Produtivo</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.mostProductiveHour !== null && stats?.mostProductiveHour !== undefined ? `${stats.mostProductiveHour}h` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              maior soma de tempo estudado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Produtividade */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Produtividade nos Últimos {selectedPeriod} Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }}
                    domain={[0, reasonableMax]}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} min`, 'Tempo de Estudo']}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Nenhum dado de estudo</h3>
                  <p className="text-muted-foreground text-sm">
                    Comece a usar o timer de estudos para ver seu gráfico de produtividade
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Disciplinas */}
        <Card>
          <CardHeader>
            <CardTitle>Disciplinas Mais Estudadas</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.disciplineStats && stats.disciplineStats.length > 0 ? (
              <div className="space-y-4">
                {stats.disciplineStats.slice(0, 5).map((discipline, index) => (
                  <div key={discipline.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{discipline.name}</p>
                        <p className="text-xs text-muted-foreground">{discipline.sessions} sessões</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold">
                      {formatTime(discipline.time)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.totalTime && stats.totalTime > 0 ? (
                <>
                  {stats.totalTime > 0 && (
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Tempo Médio Diário</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(stats.totalTime / selectedPeriod)} em média
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.currentStreak >= 2 && (
                    <div className="flex items-start gap-3">
                      <Flame className="h-5 w-5 text-success mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          {stats.currentStreak >= 7 ? 'Excelente Consistência!' : 'Bom Ritmo!'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Streak de {stats.currentStreak} dia{stats.currentStreak > 1 ? 's' : ''} estudando
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.mostProductiveHour !== null && stats.mostProductiveHour !== undefined && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Horário Mais Produtivo</p>
                        <p className="text-xs text-muted-foreground">
                          Maior tempo acumulado: {stats.mostProductiveHour}:00h
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.totalSessions > 0 && (
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Frequência de Estudo</p>
                        <p className="text-xs text-muted-foreground">
                          {(stats.totalSessions / selectedPeriod).toFixed(1)} sessões por dia em média
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Award className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Comece a estudar para ver seus insights
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}