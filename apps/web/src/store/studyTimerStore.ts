import { Store } from '@tanstack/react-store'
import { trpcClient } from '@/utils/trpc'

const SESSION_KEY = 'timer_session_v2'

export type ActiveSession = {
  sessionId: string
  topicId: string
  disciplineId: string
  studyId: string
  startTime: number // timestamp quando iniciou
}

export type TimeData = {
  // Totais já salvos no backend
  savedTotals: Record<string, number>
  
  // Sessão ativa (apenas uma por vez)
  activeSession: ActiveSession | null
  
  // Força re-render a cada segundo
  tick: number
}

export const studyTimerStore = new Store<TimeData>({
  savedTotals: {},
  activeSession: null,
  tick: 0
})

// Tick a cada segundo para UI atualizar
setInterval(() => {
  if (studyTimerStore.state.activeSession) {
    studyTimerStore.setState(s => ({ ...s, tick: s.tick + 1 }))
  }
}, 1000)

export const timerActions = {
  // Inicia sessão
  async startSession(topicId: string, disciplineId: string, studyId: string) {
    // Para qualquer sessão anterior
    await this.stopSession()
    
    const sessionId = crypto.randomUUID()
    const startTime = Date.now()
    
    // Cria sessão no backend
    await trpcClient.timer.startSession.mutate({ sessionId, topicId })
    
    const session: ActiveSession = {
      sessionId,
      topicId,
      disciplineId,
      studyId,
      startTime
    }
    
    // Salva no localStorage E no store
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    studyTimerStore.setState(s => ({
      ...s,
      activeSession: session
    }))
    
    console.log('Session started:', session)
  },
  
  // Para sessão e GARANTE salvamento
  async stopSession(): Promise<void> {
    const session = studyTimerStore.state.activeSession
    if (!session) return
    
    // Calcula duração TOTAL
    const duration = Math.round(Date.now() - session.startTime)
    
    console.log('Stopping session:', { sessionId: session.sessionId, duration })
    
    try {
      // Salva no backend com duração TOTAL
      await trpcClient.timer.stopSession.mutate({
        sessionId: session.sessionId,
        duration: duration
      })
      
      // Atualiza totais locais imediatamente
      studyTimerStore.setState(s => ({
        ...s,
        savedTotals: {
          ...s.savedTotals,
          [session.topicId]: (s.savedTotals[session.topicId] || 0) + duration
        },
        activeSession: null
      }))
      
      // Limpa localStorage
      localStorage.removeItem(SESSION_KEY)
      
      console.log('Session stopped successfully')
    } catch (error) {
      console.error('Error stopping session:', error)
      throw error // Re-throw para UI poder lidar
    }
  },
  
  // Restaura sessão ao carregar página
  async restoreSession(): Promise<boolean> {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return false
      
      const session: ActiveSession = JSON.parse(stored)
      
      // Verifica se não é muito antiga (1 hora max)
      const age = Date.now() - session.startTime
      if (age > 60 * 60 * 1000) {
        // Sessão muito antiga, finaliza ela
        const duration = Math.round(age)
        await trpcClient.timer.stopSession.mutate({
          sessionId: session.sessionId,
          duration: Math.min(duration, 3600000) // Max 1 hora
        })
        localStorage.removeItem(SESSION_KEY)
        return false
      }
      
      // Restaura sessão ativa
      studyTimerStore.setState(s => ({
        ...s,
        activeSession: session
      }))
      
      console.log('Session restored:', session)
      return true
    } catch (error) {
      console.error('Error restoring session:', error)
      localStorage.removeItem(SESSION_KEY)
      return false
    }
  },
  
  // Carrega totais salvos do backend
  async loadTotals(topicIds: string[]) {
    if (!topicIds.length) return
    
    try {
      const { topicTotals } = await trpcClient.timer.getTotals.query({ topicIds })
      
      studyTimerStore.setState(s => ({
        ...s,
        savedTotals: { ...s.savedTotals, ...topicTotals }
      }))
    } catch (error) {
      console.error('Error loading totals:', error)
    }
  },
  
  // Heartbeat opcional (não crítico)
  async sendHeartbeat() {
    const session = studyTimerStore.state.activeSession
    if (!session) return
    
    const duration = Math.round(Date.now() - session.startTime)
    
    try {
      await trpcClient.timer.heartbeat.mutate({
        sessionId: session.sessionId,
        deltaMs: duration // Envia duração total, backend que calcule o delta
      })
    } catch (error) {
      // Não é crítico, ignora erro
      console.warn('Heartbeat failed:', error)
    }
  }
}

// Heartbeat automático a cada 30 segundos (não crítico)
setInterval(() => {
  if (studyTimerStore.state.activeSession) {
    timerActions.sendHeartbeat()
  }
}, 30000)

// Selectors
export const selectors = {
  // Tempo total do tópico (salvo + sessão ativa)
  getTopicTime: (topicId: string) => (state: TimeData): number => {
    const saved = state.savedTotals[topicId] || 0
    
    // Se sessão ativa é deste tópico, adiciona tempo atual
    if (state.activeSession?.topicId === topicId) {
      const current = Date.now() - state.activeSession.startTime
      return saved + current
    }
    
    return saved
  },
  
  // Tempo da sessão ativa
  getCurrentSessionTime: (state: TimeData): number => {
    if (!state.activeSession) return 0
    return Date.now() - state.activeSession.startTime
  },
  
  getActiveSession: (state: TimeData) => state.activeSession
}