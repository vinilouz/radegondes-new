import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para detectar e tocar alarmes quando há revisões agendadas para o momento atual
 * @param {Array} topicosAgendados - Lista de tópicos agendados
 * @returns {Object} Estado do alarme e funções de controle
 */
export function useAlarmeRevisao(topicosAgendados = []) {
  const { user } = useAuth();
  const [alarmeAtivo, setAlarmeAtivo] = useState(false);
  const [topicosAlarme, setTopicosAlarme] = useState([]);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const verificacaoRef = useRef(null);

  // Função para verificar se há revisões no momento atual
  const verificarRevisoesAtivas = () => {
    const agora = new Date();
    const topicosAtivos = [];

    console.log('🔍 Verificando revisões ativas...', {
      dataHoraAtual: agora.toLocaleString('pt-BR'),
      totalTopicos: topicosAgendados.length
    });

    topicosAgendados.forEach(topico => {
      if (!topico.dataAgendada || !topico.horarioAgendado) {
        console.log('⚠️ Tópico sem data/horário:', topico.topico);
        return;
      }

      // Criar data/hora do agendamento
      const [ano, mes, dia] = topico.dataAgendada.split('-');
      const [hora, minuto] = topico.horarioAgendado.split(':');
      
      const dataAgendamento = new Date(
        parseInt(ano),
        parseInt(mes) - 1, // mês é 0-indexed
        parseInt(dia),
        parseInt(hora),
        parseInt(minuto),
        0, // segundos
        0  // milissegundos
      );

      // Verificar se está no horário (com tolerância de ±2 minutos)
      const diferenca = Math.abs(agora.getTime() - dataAgendamento.getTime());
      const tolerancia = 2 * 60 * 1000; // 2 minutos em milliseconds
      const diferencaMinutos = Math.floor(diferenca / (60 * 1000));

      console.log(`📋 Verificando tópico: ${topico.topico}`, {
        dataAgendada: topico.dataAgendada,
        horarioAgendado: topico.horarioAgendado,
        dataAgendamento: dataAgendamento.toLocaleString('pt-BR'),
        diferencaMinutos: diferencaMinutos,
        dentroTolerancia: diferenca <= tolerancia
      });

      if (diferenca <= tolerancia) {
        console.log('✅ Tópico ativo encontrado:', topico.topico);
        topicosAtivos.push({
          ...topico,
          dataAgendamento,
          diferenca,
          diferencaMinutos
        });
      }
    });

    // Se há tópicos ativos e o alarme não está ativo, ativar
    if (topicosAtivos.length > 0 && !alarmeAtivo) {
      console.log('🚨 Ativando alarme para revisões:', topicosAtivos);
      setTopicosAlarme(topicosAtivos);
      setAlarmeAtivo(true);
      iniciarAudio();
    }
    // Se não há tópicos ativos e o alarme está ativo, desativar
    else if (topicosAtivos.length === 0 && alarmeAtivo) {
      console.log('✅ Desativando alarme - sem revisões ativas');
      pararAlarme();
    }
  };

  // Função para iniciar o áudio do alarme
  const iniciarAudio = () => {
    try {
      const audioFile = user?.audioAlerta || 'alerta1.wav';
      const audioUrl = `/sounds/${audioFile}`;
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.7;
      
      audioRef.current.play().catch(error => {
        console.error('Erro ao reproduzir alarme:', error);
      });

      console.log('🔊 Áudio do alarme iniciado:', audioFile);
    } catch (error) {
      console.error('Erro ao configurar áudio do alarme:', error);
    }
  };

  // Função para parar o alarme
  const pararAlarme = () => {
    setAlarmeAtivo(false);
    setTopicosAlarme([]);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    console.log('🔇 Alarme parado');
  };

  // Função para silenciar temporariamente (snooze)
  const silenciarAlarme = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    console.log('🔇 Alarme silenciado');
  };

  // Função para reativar o áudio
  const reativarAudio = () => {
    if (alarmeAtivo && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Erro ao reativar alarme:', error);
      });
    }
  };

  // Effect para verificar revisões periodicamente
  useEffect(() => {
    if (topicosAgendados.length === 0) {
      pararAlarme();
      return;
    }

    // Verificação inicial
    verificarRevisoesAtivas();

    // Verificar a cada 30 segundos
    verificacaoRef.current = setInterval(verificarRevisoesAtivas, 30000);

    return () => {
      if (verificacaoRef.current) {
        clearInterval(verificacaoRef.current);
      }
    };
  }, [topicosAgendados, alarmeAtivo]);

  // Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      pararAlarme();
      if (verificacaoRef.current) {
        clearInterval(verificacaoRef.current);
      }
    };
  }, []);

  return {
    alarmeAtivo,
    topicosAlarme,
    pararAlarme,
    silenciarAlarme,
    reativarAudio,
    isAudioTocando: alarmeAtivo && audioRef.current && !audioRef.current.paused
  };
}
