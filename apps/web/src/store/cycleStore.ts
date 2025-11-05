import { Store } from '@tanstack/react-store'
import { trpcClient } from '@/utils/trpc'

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
}

export const cycleStore = new Store<CycleState>({
  activeCycleSession: null,
  tick: 0
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

    // Salva no store
    cycleStore.setState(s => ({
      ...s,
      activeCycleSession: sessionData
    }))

    // Salva no localStorage
    localStorage.setItem(CYCLE_SESSION_KEY, JSON.stringify(sessionData))

    console.log('Cycle session started:', sessionData)
  },

  // Para sessão de ciclo
  async stopCycleSession(): Promise<void> {
    const session = cycleStore.state.activeCycleSession
    if (!session) return

    try {
      // Limpa store e localStorage
      cycleStore.setState(s => ({
        ...s,
        activeCycleSession: null
      }))

      localStorage.removeItem(CYCLE_SESSION_KEY)

      console.log('Cycle session stopped successfully')
    } catch (error) {
      console.error('Error stopping cycle session:', error)
      throw error
    }
  },

  // Atualiza progresso do ciclo quando timer for parado
  async updateProgress(timeSessionId: string, actualDuration: number) {
    const session = cycleStore.state.activeCycleSession
    if (!session) {
      console.error('No active cycle session to update')
      return
    }

    try {
      // Chamar mutation para atualizar progresso no backend
      await trpcClient.updateCycleProgress.mutate({
        cycleId: session.cycleId,
        timeSessionId,
        actualDuration,
      })

      console.log('Cycle progress updated successfully')
    } catch (error) {
      console.error('Error updating cycle progress:', error)
    }

    // Limpa sessão após atualizar
    await this.stopCycleSession()
  },

  // Restaura sessão ao carregar página
  async restoreSession(): Promise<boolean> {
    try {
      const stored = localStorage.getItem(CYCLE_SESSION_KEY)
      if (!stored) return false

      const session: CycleSessionData = JSON.parse(stored)

      // Restaura sessão ativa
      cycleStore.setState(s => ({
        ...s,
        activeCycleSession: session
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

// Selectors
export const cycleSelectors = {
  getCurrentCycleSession: (state: CycleState) => state.activeCycleSession,
  getIsActive: (state: CycleState) => !!state.activeCycleSession,
  getSessionDuration: (state: CycleState) => {
    if (!state.activeCycleSession) return 0
    // Se precisar de duração, podemos adicionar um timestamp
    return 0
  }
}