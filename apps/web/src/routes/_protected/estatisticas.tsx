import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
// Importe os dois novos componentes que você salvou em arquivos separados
import { MetricsBasedStatistics } from '@/components/MetricsBasedStatistics';
import { LegacyStatistics } from '@/components/LegacyStatistics';

export const Route = createFileRoute('/_protected/estatisticas')({
  component: EstatisticasPage,
});

function EstatisticasPage() {
  const navigate = useNavigate(); // Pode ser removido se não for usado
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>(30);

  return (
    <div className="container mx-auto p-6">
      {/* Header e Filtros de Período */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estatísticas</h1>
          <p className="text-muted-foreground mt-2">Acompanhe seu progresso e performance de estudos</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90, 'all'].map(days => (
            <Button
              key={days}
              variant={selectedPeriod === days ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(days as number | "all")}
            >
              {days === 'all' ? 'Todos' : `${days}d`}
            </Button>
          ))}
        </div>
      </div>

      {/* Renderiza o componente com as novas métricas */}
      <MetricsBasedStatistics selectedPeriod={selectedPeriod} />

      {/* Renderiza o componente com as métricas antigas */}
      <LegacyStatistics selectedPeriod={selectedPeriod} />
      
    </div>
  );
}