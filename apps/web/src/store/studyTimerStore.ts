import { Store } from '@tanstack/react-store'
import { trpcClient } from '@/utils/trpc'

const SESSION_KEY = 'active_timer_session'

export type ActiveSession = {
  topicId: string
  disciplineId: string
  studyId: string
  sessionId: string
  startTimestamp: number // Unix timestamp quando iniciou
  savedDuration: number  // Tempo já salvo no backend (ms)
}

export type TimeData = {
  // Totais do backend (já persistidos)
  topicTotals: Record<string, number>
  
  // Sessão ativa
  activeSession?: ActiveSession
  
  // Para forçar re-render a cada segundo
  currentTime: number
}

export const studyTimerStore = new Store<TimeData>({
  topicTotals: {},
  activeSession: undefined,
  currentTime: Date.now(),
})

// Atualiza o tempo a cada segundo para re-render
setInterval(() => {
  studyTimerStore.setState(s => ({
    ...s,
    currentTime: Date.now()
  }))
}, 1000)

export const timerActions = {
  // Inicia nova sessão
  async startSession(topicId: string, disciplineId: string, studyId: string) {
    const sessionId = crypto.randomUUID()
    
    // Cria sessão no backend
    await trpcClient.timer.startSession.mutate({ sessionId, topicId })
    
    const session: ActiveSession = {
      topicId,
      disciplineId,
      studyId,
      sessionId,
      startTimestamp: Date.now(),
      savedDuration: 0
    }
    
    // Salva no localStorage e no store
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    studyTimerStore.setState(s => ({
      ...s,
      activeSession: session
    }))
    
    // Inicia auto-save
    this.startAutoSave()
  },
  
  // Para sessão e salva tempo final
  async stopSession() {
    const session = studyTimerStore.state.activeSession
    if (!session) return
    
    // Calcula duração total real
    const currentDuration = Date.now() - session.startTimestamp
    const totalDuration = session.savedDuration + currentDuration
    
    // Salva tempo final no backend
    await trpcClient.timer.stopSession.mutate({
      sessionId: session.sessionId,
      duration: Math.round(totalDuration)
    })
    
    // Atualiza totais locais
    studyTimerStore.setState(s => ({
      ...s,
      topicTotals: {
        ...s.topicTotals,
        [session.topicId]: (s.topicTotals[session.topicId] || 0) + totalDuration
      },
      activeSession: undefined
    }))
    
    // Limpa localStorage
    localStorage.removeItem(SESSION_KEY)
    
    // Para auto-save
    this.stopAutoSave()
  },
  
  // Auto-save a cada 5 segundos
  autoSaveInterval: null as NodeJS.Timeout | null,
  
  startAutoSave() {
    // Para interval anterior se existir
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }
    
    // Salva a cada 5 segundos
    this.autoSaveInterval = setInterval(async () => {
      const session = studyTimerStore.state.activeSession
      if (!session) {
        this.stopAutoSave()
        return
      }
      
      // Calcula tempo desde última gravação
      const currentDuration = Date.now() - session.startTimestamp
      const deltaToSave = currentDuration - session.savedDuration
      
      if (deltaToSave > 0) {
        try {
          // Envia heartbeat incremental
          await trpcClient.timer.heartbeat.mutate({
            sessionId: session.sessionId,
            deltaMs: Math.round(deltaToSave)
          })
          
          // Atualiza savedDuration na sessão
          const updatedSession = {
            ...session,
            savedDuration: currentDuration
          }
          
          localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession))
          studyTimerStore.setState(s => ({
            ...s,
            activeSession: updatedSession
          }))
        } catch (error) {
          console.error('Erro ao salvar tempo:', error)
          // Continua tentando no próximo intervalo
        }
      }
    }, 5000)
  },
  
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  },
  
  // Restaura sessão do localStorage
  async restoreSession() {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return false
    
    try {
      const session: ActiveSession = JSON.parse(stored)
      
      // Verifica se não é muito antiga (24h)
      const age = Date.now() - session.startTimestamp
      if (age > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(SESSION_KEY)
        return false
      }
      
      // Verifica se sessão ainda existe no backend
      // Calculando tempo que passou offline
      const offlineTime = Date.now() - (session.startTimestamp + session.savedDuration)
      
      if (offlineTime > 0) {
        // Salva tempo offline
        await trpcClient.timer.heartbeat.mutate({
          sessionId: session.sessionId,
          deltaMs: Math.min(Math.round(offlineTime), 60000) // Max 1 min offline
        })
        
        session.savedDuration += Math.min(offlineTime, 60000)
      }
      
      // Restaura sessão
      studyTimerStore.setState(s => ({
        ...s,
        activeSession: session
      }))
      
      // Reinicia auto-save
      this.startAutoSave()
      
      return true
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error)
      localStorage.removeItem(SESSION_KEY)
      return false
    }
  },
  
  // Carrega totais do backend
  async loadTotals(topicIds: string[]) {
    if (!topicIds.length) return
    
    const { topicTotals } = await trpcClient.timer.getTotals.query({
      topicIds
    })
    
    studyTimerStore.setState(s => ({
      ...s,
      topicTotals: { ...s.topicTotals, ...topicTotals }
    }))
  }
}

// Selectors simplificados
export const selectors = {
  // Tempo total do tópico (backend + sessão ativa)
  getTopicTime: (topicId: string) => (state: TimeData): number => {
    const saved = state.topicTotals[topicId] || 0
    
    // Se há sessão ativa para este tópico, adiciona tempo atual
    if (state.activeSession?.topicId === topicId) {
      const currentDuration = state.currentTime - state.activeSession.startTimestamp
      return saved + currentDuration
    }
    
    return saved
  },
  
  // Tempo da sessão ativa
  getActiveSessionTime: (state: TimeData): number => {
    if (!state.activeSession) return 0
    return state.currentTime - state.activeSession.startTimestamp
  },
  
  getActiveSession: (state: TimeData) => state.activeSession
}