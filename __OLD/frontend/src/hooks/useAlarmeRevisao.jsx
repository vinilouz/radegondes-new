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
  const [topicosAlarme, setTopicosAlarme] = useState([]); // eslint-disable-line
  const audioRef = useRef(null); // eslint-disable-line
  const intervalRef = useRef(null); // eslint-disable-line  
  const verificacaoRef = useRef(null); // eslint-disable-line

  // Função para verificar se há revisões no momento atual
  const verificarRevisoesAtivas = () => {
    const agora = new Date();
    const topicosAtivos = [];

    topicosAgendados.forEach(topico => {
      if (!topico.dataAgendada || !topico.horarioAgendado) {
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

      if (diferenca <= tolerancia) {
        console.log('� Revisão ativa encontrada:', {
          topico: topico.topico,
          disciplina: topico.disciplinaNome,
          dataAgendamento: dataAgendamento.toLocaleString('pt-BR'),
          diferencaMinutos: diferencaMinutos
        });
        
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
      
      console.log('🎵 Configurações de áudio do usuário:', {
        user: user ? 'logado' : 'não logado',
        audioAlerta: user?.audioAlerta,
        audioFile: audioFile,
        audioUrl: audioUrl
      });
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.7;
      
      // Adicionar evento para verificar se o áudio carregou
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('✅ Áudio carregado com sucesso');
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('❌ Erro ao carregar áudio:', e);
      });
      
      audioRef.current.play().then(() => {
        console.log('🔊 Áudio do alarme iniciado com sucesso:', audioFile);
      }).catch(error => {
        console.error('❌ Erro ao reproduzir alarme:', error);
        console.error('Detalhes do erro:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
      });

    } catch (error) {
      console.error('❌ Erro ao configurar áudio do alarme:', error);
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

    // Verificar a cada 30 segundos (modo produção)
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
