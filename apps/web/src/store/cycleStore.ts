import { Store } from '@tanstack/react-store'
import { trpcClient } from '@/utils/trpc'
import { differenceInMilliseconds } from 'date-fns'

const CYCLE_SESSION_KEY = 'cycle_session'

export type CycleSessionData = {
  cycleId: string
  cycleName: string
  topicId: string
  topicName: string
  disciplineName: string
}

export type CycleState = {
  // Sessão de ciclo ativa
  activeCycleSession: CycleSessionData | null
  tick: number
  sessionStartTime: number | null // timestamp de início com date-fns
}

export const cycleStore = new Store<CycleState>({
  activeCycleSession: null,
  tick: 0,
  sessionStartTime: null
})

// Tick a cada segundo para UI atualizar
setInterval(() => {
  if (cycleStore.state.activeCycleSession) {
    cycleStore.setState(s => ({ ...s, tick: s.tick + 1 }))
  }
}, 1000)

export const cycleActions = {
  // Inicia sessão de ciclo
  async startCycleSession(sessionData: CycleSessionData) {
    // Para qualquer sessão anterior
    await this.stopCycleSession()

    // Salva no store com timestamp de início usando date-fns
    const startTime = Date.now()
    cycleStore.setState(s => ({
      ...s,
      activeCycleSession: sessionData,
      sessionStartTime: startTime
    }))

    // Salva no localStorage
    localStorage.setItem(CYCLE_SESSION_KEY, JSON.stringify({
      ...sessionData,
      sessionStartTime: startTime
    }))

    console.log('Cycle session started:', sessionData)
  },

  // Para sessão de ciclo
  async stopCycleSession(): Promise<void> {
    const session = cycleStore.state.activeCycleSession
    if (!session) return

    try {
      // Limpa store e localStorage incluindo sessionStartTime
      cycleStore.setState(s => ({
        ...s,
        activeCycleSession: null,
        sessionStartTime: null
      }))

      localStorage.removeItem(CYCLE_SESSION_KEY)

      console.log('Cycle session stopped successfully')
    } catch (error) {
      console.error('Error stopping cycle session:', error)
      throw error
    }
  },

  // Restaura sessão ao carregar página
  async restoreSession(): Promise<boolean> {
    try {
      const stored = localStorage.getItem(CYCLE_SESSION_KEY)
      if (!stored) return false

      const sessionData = JSON.parse(stored)

      // Extrai dados da sessão e timestamp
      const { sessionStartTime, ...session } = sessionData

      // Restaura sessão ativa com timestamp usando date-fns
      cycleStore.setState(s => ({
        ...s,
        activeCycleSession: session,
        sessionStartTime: sessionStartTime || null
      }))

      console.log('Cycle session restored:', session)
      return true
    } catch (error) {
      console.error('Error restoring cycle session:', error)
      localStorage.removeItem(CYCLE_SESSION_KEY)
      return false
    }
  }
}

// Selectors com date-fns
export const cycleSelectors = {
  getCurrentCycleSession: (state: CycleState) => state.activeCycleSession,
  getIsActive: (state: CycleState) => !!state.activeCycleSession,
  getSessionDuration: (state: CycleState) => {
    if (!state.activeCycleSession || !state.sessionStartTime) return 0
    // Calcula duração usando date-fns
    return differenceInMilliseconds(new Date(), new Date(state.sessionStartTime))
  }
}