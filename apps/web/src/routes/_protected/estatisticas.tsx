import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime, formatTimeRelative } from '@/lib/utils';
import { BookOpen, Clock, Target, TrendingUp, Award, Flame, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

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
    duration: Math.round(Math.min(item.duration / 1000 / 60, 1440)), // max 24 horas por dia
    desempenho: item.performance || 0, // Usar desempenho real do backend
    questoes: item.questions || 0, // Número total de questões
    acertos: item.correct || 0, // Questões corretas
    erros: item.wrong || 0 // Questões erradas
  })).sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime()) ?? [];

  // Calcular teto máximo razoável para o gráfico
  const maxDuration = Math.max(...chartData.map(d => d.duration), 0);
  const reasonableMax = maxDuration > 0 ? Math.max(maxDuration + 10, 30) : 60;

  // Dados para gráfico de pizza por disciplina
  const pieData = stats?.disciplineStats.slice(0, 5).map(discipline => ({
    name: discipline.name,
    value: Math.round(discipline.time / 1000 / 60), // converter para minutos
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  })) || [];


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

      {/* Gráficos de Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8">
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
                      domain={[0, 24]}
                      label={{ value: 'Horas', angle: -90, position: 'insideLeft' }}
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
                      formatter={(value) => {
                        const minutes = Number(value);
                        if (minutes >= 60) {
                          const hours = Math.floor(minutes / 60);
                          const remainingMinutes = minutes % 60;
                          return [`${hours}h${remainingMinutes > 0 ? remainingMinutes + 'min' : ''}`, 'Tempo de Estudo'];
                        }
                        return [`${minutes} min`, 'Tempo de Estudo'];
                      }}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Bar dataKey="duration" fill="#e66912" name="horas" />
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

        {/* Distribuição por Disciplina */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}min`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
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
                      formatter={(value) => [`${value} min`, 'Tempo de Estudo']}
                    />
                  </PieChart>
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
                          {formatTimeRelative(stats.totalTime / selectedPeriod)} em média
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
                          Às {stats.mostProductiveHour}:00h voce estuda mais
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

      {/* Evolução no Tempo */}
      <div className="grid grid-cols-1 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Evolução no Tempo</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Tempo de Estudo (minutos) vs Questões respondidas por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
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
                    label={{ value: 'Minutos / Questões', angle: -90, position: 'insideLeft', offset: -5 }}
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
                    formatter={(value, name) => {
                      if (name === 'Tempo de Estudo') {
                        const minutes = Number(value);
                        if (minutes >= 60) {
                          const hours = Math.floor(minutes / 60);
                          const remainingMinutes = minutes % 60;
                          return [`${hours}h${remainingMinutes > 0 ? remainingMinutes + 'min' : ''}`, name];
                        }
                        return [`${minutes} min`, name];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Bar
                    dataKey="duration"
                    fill="#e66912"
                    name="Tempo de Estudo"
                  />
                  <Bar
                    dataKey="questoes"
                    fill="#f5a623"
                    name="Questões Respondidas"
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