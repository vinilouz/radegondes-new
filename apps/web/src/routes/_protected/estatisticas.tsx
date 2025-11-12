import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime, formatTimeRelative, formatHoursMinutes } from '@/lib/utils';
import { BookOpen, Clock, Target, TrendingUp, Award, Flame, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const Route = createFileRoute('/_protected/estatisticas')({
  component: EstatisticasPage,
});

function EstatisticasPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>(30);

  const statisticsQuery = useQuery({
    ...trpc.getStudyStatistics.queryOptions({ days: selectedPeriod === 'all' ? 9999 : selectedPeriod }),
  });

  const todayDisciplinesQuery = useQuery({
    ...trpc.getTodayDisciplines.queryOptions(),
  });

  const stats = statisticsQuery.data;

  // Formatear dados para o gráfico
  const chartData = (() => {
    if (!stats?.dailyData) return [];

    // Criar mapa de dados existentes
    const dataMap = new Map(
      stats.dailyData.map(item => [
        item.date,
        {
          date: new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          }),
          durationMinutes: Math.floor(item.duration / 1000 / 60),
          durationMs: item.duration,
          desempenho: item.performance || 0,
          questoes: item.questions || 0,
          acertos: item.correct || 0,
          erros: item.wrong || 0
        }
      ])
    );

    // Gerar array completo de datas do período
    const days = selectedPeriod === 'all' ? 365 : selectedPeriod;
    const today = new Date();
    const allDates = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      if (dataMap.has(dateStr)) {
        allDates.push(dataMap.get(dateStr)!);
      } else {
        allDates.push({
          date: date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          }),
          durationMinutes: 0,
          durationMs: 0,
          desempenho: 0,
          questoes: 0,
          acertos: 0,
          erros: 0
        });
      }
    }

    return allDates;
  })();

  const MINIMUM_SCALE_MINUTES = 720;
  const EXTRA_PADDING_MINUTES = 60;
  const maxDurationMinutes = Math.max(...chartData.map(d => d.durationMinutes), 0);
  const calculatedMaxScale = maxDurationMinutes >= MINIMUM_SCALE_MINUTES
    ? maxDurationMinutes + EXTRA_PADDING_MINUTES
    : MINIMUM_SCALE_MINUTES;
  const yAxisTicks = Array.from({ length: Math.floor(calculatedMaxScale / 60) + 1 }, (_, i) => i * 60);
  console.log('EstatisticasPage chartData', chartData, { maxDurationMinutes, calculatedMaxScale });


  if (statisticsQuery.isLoading || todayDisciplinesQuery.isLoading) {
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
          {[7, 30, 90, 'all'].map(days => (
            <Button
              key={days}
              variant={selectedPeriod === days ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(days)}
            >
              {days === 'all' ? 'Todos' : `${days}d`}
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
              {selectedPeriod === 'all' ? 'desde o início' : `nos últimos ${selectedPeriod} dias`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões de estudos</CardTitle>
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
            <CardTitle className="text-sm font-medium">Ritmo de Estudos</CardTitle>
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

      {/* Gráficos de Performance */}
      <div className="my-8">
        {/* Produtividade na Semana */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Produtividade na Semana</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Horas estudadas por dia da semana
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
                      domain={[0, calculatedMaxScale]}
                      ticks={yAxisTicks}
                      allowDecimals={false}
                      label={{ value: 'Horas', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `${value / 60}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(255, 255, 255)',
                        borderColor: 'rgb(229, 231, 235)',
                        color: 'rgb(55, 65, 81)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        opacity: 1
                      }}
                      wrapperStyle={{
                        opacity: 1
                      }}
                      formatter={(_value: any, _name: any, props: any) => [
                        formatHoursMinutes(props.payload.durationMs),
                        'Tempo de Estudo'
                      ]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Bar dataKey="durationMinutes" fill="#e66912" name="minutos" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Disciplinas */}
        <Card>
          <CardHeader>
            <CardTitle>Disciplinas estudadas</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {stats?.disciplineStats && stats.disciplineStats.length > 0 ? (
              <div className="space-y-4 px-6 max-h-80 overflow-y-auto pr-2">
                {stats.disciplineStats.map((discipline, index) => (
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
                      {formatTimeRelative(discipline.time)}
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

        {/* Disciplinas estudadas hoje */}
        <Card>
          <CardHeader>
            <CardTitle>Disciplinas estudadas hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayDisciplinesQuery.data && todayDisciplinesQuery.data.length > 0 ? (
                todayDisciplinesQuery.data.map(discipline => (
                  <div key={discipline.name} className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{discipline.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeRelative(discipline.time)} • {discipline.sessions} {discipline.sessions > 1 ? 'sessões' : 'sessão'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma disciplina estudada hoje
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução no Tempo */}
      <div className="grid grid-cols-1 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Acertos por Disciplina</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Performance em questões por disciplina
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.disciplineStats.map(discipline => ({
                  name: discipline.name,
                  acertos: discipline.correct || 0,
                  erros: discipline.wrong || 0,
                  taxaAcertos: discipline.correct && discipline.wrong ?
                    Math.round((discipline.correct / (discipline.correct + discipline.wrong)) * 100) : 0
                })) || []} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Acertos (%)', angle: -90, position: 'insideLeft', dy: 30 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(255, 255, 255)',
                      borderColor: 'rgb(229, 231, 235)',
                      color: 'rgb(55, 65, 81)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      opacity: 1
                    }}
                    wrapperStyle={{
                      opacity: 1
                    }}
                    formatter={(value, name) => [`${value}%`, name]}
                    labelFormatter={(label) => `Disciplina: ${label}`}
                  />
                  <Bar
                    dataKey="taxaAcertos"
                    fill="#22c55e"
                    name="Taxa de Acertos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}