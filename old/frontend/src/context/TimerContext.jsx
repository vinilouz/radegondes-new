import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [timers, setTimers] = useState({});
  const [activeTimer, setActiveTimer] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRefs = useRef({});
  const autoSaveIntervalRef = useRef(null);
  const pendingSaveQueue = useRef(new Map());

  // Gerar chave única para timer
  const generateTimerKey = (disciplinaId, planoId, topico, indice) => {
    return `${disciplinaId}_${planoId}_${topico}_${indice}`;
  };

  // Formatar tempo para exibição
  const formatarTempo = useCallback((segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`;
  }, []);

  // Buscar timers do banco
  const fetchTimersFromAPI = useCallback(async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/timers-ativos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.timers) {
          // Converter array de timers para objeto com chaves
          const timersObject = {};
          data.timers.forEach(timer => {
            const key = generateTimerKey(timer.disciplinaId, timer.plano, timer.topico, timer.indice);
            timersObject[key] = {
              tempo: timer.tempo,
              ativo: timer.ativo,
              disciplinaId: timer.disciplinaId,
              planoId: timer.plano,
              topico: timer.topico,
              indice: timer.indice,
              disciplinaNome: timer.disciplinaNome,
              sessaoId: timer.sessaoId,
              ultimoSalvamento: new Date(timer.ultimoSalvamento)
            };
          });
          setTimers(timersObject);

          // Atualizar timer ativo
          const active = data.timers.find(t => t.ativo);
          setActiveTimer(active ? generateTimerKey(active.disciplinaId, active.plano, active.topico, active.indice) : null);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar timers da API:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar timer na API
  const saveTimerToAPI = useCallback(async (timerData) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/api/timers-ativos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(timerData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.timer;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao salvar timer na API:', error);
      return false;
    }
  }, []);

  // Atualizar timer na API
  const updateTimerInAPI = useCallback(async (planoId, disciplinaId, topico, indice, updates) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/api/timers-ativos/${planoId}/${disciplinaId}/${topico}/${indice}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar timer na API:', error);
      return false;
    }
  }, []);

  // Pausar todos os timers
  const pauseAllTimers = useCallback(async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/timers-ativos/pausar-todos`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Atualizar estado local
        setTimers(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            updated[key] = { ...updated[key], ativo: false };
          });
          return updated;
        });
        setActiveTimer(null);

        // Limpar todos os intervals
        Object.values(intervalRefs.current).forEach(interval => clearInterval(interval));
        intervalRefs.current = {};
      }
    } catch (error) {
      console.error('Erro ao pausar todos os timers:', error);
    }
  }, []);

  // Iniciar timer
  const startTimer = useCallback(async (disciplinaId, planoId, topico, indice = 0) => {
    const key = generateTimerKey(disciplinaId, planoId, topico, indice);

    // Pausar timer ativo atual
    if (activeTimer && activeTimer !== key) {
      await pauseTimer(activeTimer);
    }

    const timerData = {
      planoId,
      disciplinaId,
      topico,
      indice,
      tempo: timers[key]?.tempo || 0,
      ativo: true,
      disciplinaNome: timers[key]?.disciplinaNome || ''
    };

    const saved = await saveTimerToAPI(timerData);
    if (saved) {
      setTimers(prev => ({
        ...prev,
        [key]: { ...prev[key], ...timerData }
      }));
      setActiveTimer(key);

      // Iniciar intervalo de atualização
      intervalRefs.current[key] = setInterval(async () => {
        setTimers(prev => {
          const current = prev[key];
          if (current && current.ativo) {
            const updated = { ...current, tempo: current.tempo + 1 };

            // Enfileirar salvamento automático
            pendingSaveQueue.current.set(key, updated);

            return { ...prev, [key]: updated };
          }
          return prev;
        });
      }, 1000);
    }
  }, [activeTimer, timers, saveTimerToAPI, generateTimerKey]);

  // Pausar timer específico
  const pauseTimer = useCallback(async (key) => {
    const [disciplinaId, planoId, topico, indice] = key.split('_');

    // Salvar estado final antes de pausar
    const timerData = timers[key];
    if (timerData) {
      await updateTimerInAPI(planoId, disciplinaId, topico, parseInt(indice), {
        tempo: timerData.tempo,
        ativo: false
      });
    }

    setTimers(prev => ({
      ...prev,
      [key]: { ...prev[key], ativo: false }
    }));

    if (activeTimer === key) {
      setActiveTimer(null);
    }

    if (intervalRefs.current[key]) {
      clearInterval(intervalRefs.current[key]);
      delete intervalRefs.current[key];
    }
  }, [timers, activeTimer, updateTimerInAPI]);

  // Resetar timer
  const resetTimer = useCallback(async (key) => {
    const [disciplinaId, planoId, topico, indice] = key.split('_');

    await updateTimerInAPI(planoId, disciplinaId, topico, parseInt(indice), {
      tempo: 0,
      ativo: false
    });

    setTimers(prev => ({
      ...prev,
      [key]: { ...prev[key], tempo: 0, ativo: false }
    }));

    if (intervalRefs.current[key]) {
      clearInterval(intervalRefs.current[key]);
      delete intervalRefs.current[key];
    }

    if (activeTimer === key) {
      setActiveTimer(null);
    }
  }, [activeTimer, updateTimerInAPI]);

  // Remover timer
  const removeTimer = useCallback(async (key) => {
    const [disciplinaId, planoId, topico, indice] = key.split('_');

    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      await fetch(`${API_BASE_URL}/api/timers-ativos/${planoId}/${disciplinaId}/${topico}/${indice}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[key];
        return newTimers;
      });

      if (intervalRefs.current[key]) {
        clearInterval(intervalRefs.current[key]);
        delete intervalRefs.current[key];
      }

      if (activeTimer === key) {
        setActiveTimer(null);
      }
    } catch (error) {
      console.error('Erro ao remover timer:', error);
    }
  }, [activeTimer]);

  // Obter timer específico
  const getTimer = useCallback((disciplinaId, planoId, topico, indice = 0) => {
    const key = generateTimerKey(disciplinaId, planoId, topico, indice);
    return timers[key] || null;
  }, [timers, generateTimerKey]);

  // Obter informações do timer ativo
  const getActiveTimerInfo = useCallback(() => {
    if (!activeTimer || !timers[activeTimer]) return null;

    const timerData = timers[activeTimer];
    return {
      tempo: timerData.tempo,
      ativo: timerData.ativo,
      disciplinaId: timerData.disciplinaId,
      planoId: timerData.planoId,
      topico: timerData.topico,
      disciplinaNome: timerData.disciplinaNome,
      sessaoId: timerData.sessaoId
    };
  }, [activeTimer, timers]);

  // Calcular tempo total para uma disciplina
  const getTotalTimeForDisciplina = useCallback(async (disciplinaId, planoId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return 0;

      const response = await fetch(`${API_BASE_URL}/api/timers-ativos/total-tempo/${planoId}/${disciplinaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.success ? data.tempoTotal : 0;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao calcular tempo total:', error);
      return 0;
    }
  }, []);

  // Auto-salvamento periódico
  useEffect(() => {
    // Intervalo de auto-salvamento a cada 20 segundos
    autoSaveIntervalRef.current = setInterval(async () => {
      if (pendingSaveQueue.current.size > 0) {
        console.log('💾 Iniciando auto-salvamento de timers...');

        for (const [key, timerData] of pendingSaveQueue.current.entries()) {
          const [disciplinaId, planoId, topico, indice] = key.split('_');

          await updateTimerInAPI(planoId, disciplinaId, topico, parseInt(indice), {
            tempo: timerData.tempo,
            ativo: timerData.ativo
          });
        }

        pendingSaveQueue.current.clear();
        console.log('✅ Auto-salvamento concluído');
      }
    }, 20000); // 20 segundos

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [updateTimerInAPI]);

  // Carregar timers na inicialização
  useEffect(() => {
    fetchTimersFromAPI();
  }, [fetchTimersFromAPI]);

  // Salvar timers ao sair da página
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (pendingSaveQueue.current.size > 0) {
        console.log('💾 Salvando timers pendentes antes de sair...');
        for (const [key, timerData] of pendingSaveQueue.current.entries()) {
          const [disciplinaId, planoId, topico, indice] = key.split('_');
          await updateTimerInAPI(planoId, disciplinaId, topico, parseInt(indice), {
            tempo: timerData.tempo,
            ativo: false
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [updateTimerInAPI]);

  // Limpar intervals ao desmontar
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(interval => clearInterval(interval));
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  const value = {
    timers,
    activeTimer,
    isTransitioning,
    isLoading,
    formatarTempo,
    startTimer,
    pauseTimer,
    resetTimer,
    removeTimer,
    getTimer,
    getActiveTimerInfo,
    getTotalTimeForDisciplina,
    pauseAllTimers,
    generateTimerKey
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer deve ser usado dentro de um TimerProvider');
  }
  return context;
};