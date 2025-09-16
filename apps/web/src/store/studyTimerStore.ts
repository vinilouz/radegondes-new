
import { Store } from '@tanstack/react-store'
import { trpcClient } from '@/utils/trpc'

const SESSION_STORAGE_KEY = 'active_study_session'

export type ActiveSession = {
  topicId: string
  disciplineId: string
  studyId: string
  startedAt: number // performance.now()
  elapsedMs: number
  sessionId: string // UUID
}

export type TimeData = {
  // Totais persistidos por entidade (sem sessão ativa)
  topicTotals: Record<string, number>
  disciplineTotals: Record<string, number>
  studyTotals: Record<string, number>

  // Sessão ativa
  activeSession?: ActiveSession

  // Para multiabas
  leaderTabId?: string

  // Cache para requests pendentes e deduplicação
  pendingRequests: Set<string>
  requestCache: Map<string, { data: any; timestamp: number; ttl: number }>
}

export const studyTimerStore = new Store<TimeData>({
  topicTotals: {},
  disciplineTotals: {},
  studyTotals: {},
  activeSession: undefined,
  pendingRequests: new Set(),
  requestCache: new Map(),
})

// Funções auxiliares para persistência
const saveSessionToStorage = (session: ActiveSession) => {
  try {
    const sessionData = {
      ...session,
      savedAt: Date.now(), // timestamp para calcular tempo offline
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
  } catch (e) {
    console.warn('Failed to save session to localStorage:', e)
  }
}

const loadSessionFromStorage = (): (ActiveSession & { savedAt: number }) | null => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch (e) {
    console.warn('Failed to load session from localStorage:', e)
    return null
  }
}

const clearSessionFromStorage = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch (e) {
    console.warn('Failed to clear session from localStorage:', e)
  }
}

export const timerActions = {
  // Restaura sessão do localStorage se existir
  async restoreSession(trpc: typeof trpcClient) {
    const stored = loadSessionFromStorage()
    if (!stored) return false

    const timeSinceLastSave = Date.now() - stored.savedAt
    const isRecent = timeSinceLastSave < 24 * 60 * 60 * 1000 // 24 horas

    if (!isRecent) {
      clearSessionFromStorage()
      return false
    }

    // Reconstrói a sessão com o tempo acumulado
    const now = performance.now()
    const elapsedSinceLastSave = Math.min(Math.round(timeSinceLastSave), 60000) // máximo 1 minuto, SEMPRE integer

    const restoredSession: ActiveSession = {
      topicId: stored.topicId,
      disciplineId: stored.disciplineId,
      studyId: stored.studyId,
      startedAt: now - stored.elapsedMs - elapsedSinceLastSave,
      elapsedMs: stored.elapsedMs + elapsedSinceLastSave,
      sessionId: stored.sessionId,
    }

    // Verifica se a sessão ainda existe no servidor
    try {
      if (elapsedSinceLastSave > 0) {
        await trpc.timer.heartbeat.mutate({
          sessionId: stored.sessionId,
          deltaMs: elapsedSinceLastSave,
        })
      }

      studyTimerStore.setState((s) => ({
        ...s,
        activeSession: restoredSession,
      }))

      console.log('Session restored from localStorage:', {
        elapsedMs: restoredSession.elapsedMs,
        timeSinceLastSave,
      })

      return true
    } catch (e) {
      console.warn('Stored session is invalid on server, clearing:', e)
      clearSessionFromStorage()
      return false
    }
  },

  // Inicia sessão de estudo
  async startSession(topicId: string, disciplineId: string, studyId: string, trpc: typeof trpcClient) {
    const cryptoObj = globalThis.crypto || window.crypto
    const sessionId = cryptoObj.randomUUID()

    // Criar sessão no backend
    await trpc.timer.startSession.mutate({ sessionId, topicId })

    const newSession: ActiveSession = {
      topicId,
      disciplineId,
      studyId,
      startedAt: performance.now(),
      elapsedMs: 0,
      sessionId,
    }

    studyTimerStore.setState((s) => ({
      ...s,
      activeSession: newSession,
    }))

    // Salva no localStorage
    saveSessionToStorage(newSession)
  },

  // Para sessão e persiste
  async stopSession() {
    const session = studyTimerStore.state.activeSession
    if (!session) return

    // Usa apenas o elapsedMs já calculado (mais confiável)
    const finalDuration = Math.round(session.elapsedMs) // SEMPRE integer

    console.log('Stopping session:', {
      sessionElapsedMs: session.elapsedMs,
      finalDuration,
      sessionId: session.sessionId
    })

    // Envia heartbeat final se necessário
    if (finalDuration > 0) {
      await trpcClient.timer.heartbeat.mutate({
        sessionId: session.sessionId,
        deltaMs: finalDuration,
      })
    }

    // Finaliza no backend
    await trpcClient.timer.stopSession.mutate({
      sessionId: session.sessionId,
      duration: finalDuration,
    })

    // Atualiza totais locais
    studyTimerStore.setState((s) => ({
      ...s,
      topicTotals: {
        ...s.topicTotals,
        [session.topicId]: (s.topicTotals[session.topicId] || 0) + finalDuration,
      },
      disciplineTotals: {
        ...s.disciplineTotals,
        [session.disciplineId]:
          (s.disciplineTotals[session.disciplineId] || 0) + finalDuration,
      },
      studyTotals: {
        ...s.studyTotals,
        [session.studyId]: (s.studyTotals[session.studyId] || 0) + finalDuration,
      },
      activeSession: undefined,
    }))

    // Limpa localStorage
    clearSessionFromStorage()
  },

  // Incrementa tempo local (chamado pelo runtime)
  tick(deltaMs: number) {
    studyTimerStore.setState((s) =>
      s.activeSession
        ? {
            ...s,
            activeSession: {
              ...s.activeSession,
              elapsedMs: s.activeSession.elapsedMs + deltaMs,
            },
          }
        : s
    )

    // Atualiza localStorage a cada tick para manter sincronizado
    const session = studyTimerStore.state.activeSession
    if (session) {
      saveSessionToStorage(session)
    }
  },

  // Gera chave de cache para requests
  getCacheKey(studyId?: string, disciplineIds?: string[], topicIds?: string[]): string {
    const studyPart = studyId || 'none'
    const disciplinePart = disciplineIds?.sort().join(',') || 'none'
    const topicPart = topicIds?.sort().join(',') || 'none'
    return `${studyPart}:${disciplinePart}:${topicPart}`
  },

  // Verifica se request está cacheado e válido
  isRequestCached(cacheKey: string): { data: any } | null {
    const cached = studyTimerStore.state.requestCache.get(cacheKey)
    if (!cached) return null

    // TTL de 30 segundos para timer data
    const isExpired = Date.now() - cached.timestamp > cached.ttl
    return isExpired ? null : cached
  },

  // Armazena no cache
  cacheRequest(cacheKey: string, data: any): void {
    studyTimerStore.setState((s) => ({
      ...s,
      requestCache: new Map(s.requestCache).set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: 30000, // 30 segundos de cache
      }),
    }))
  },

  // Carrega totais do servidor com debounce e cache
  async loadTotals(studyId?: string, disciplineIds?: string[], topicIds?: string[], trpc?: typeof trpcClient) {
    if (!trpc) return

    const cacheKey = this.getCacheKey(studyId, disciplineIds, topicIds)

    // Verifica cache primeiro
    const cached = this.isRequestCached(cacheKey)
    if (cached) {
      this.applyCachedData(cached.data)
      return
    }

    // Verifica se request já está pendente
    if (studyTimerStore.state.pendingRequests.has(cacheKey)) {
      return
    }

    // Marca como pendente
    studyTimerStore.setState((s) => ({
      ...s,
      pendingRequests: new Set(s.pendingRequests).add(cacheKey),
    }))

    try {
      const { topicTotals, disciplineTotals, studyTotals } = await trpc.timer.getTotals.query({
          studyId,
          disciplineIds,
          topicIds,
      })

      // Cacheia resultado
      this.cacheRequest(cacheKey, { topicTotals, disciplineTotals, studyTotals })

      // Aplica dados
      this.applyCachedData({ topicTotals, disciplineTotals, studyTotals })
    } finally {
      // Remove da lista pendente
      studyTimerStore.setState((s) => ({
        ...s,
        pendingRequests: new Set(s.pendingRequests).delete(cacheKey) ?
          new Set(s.pendingRequests) :
          s.pendingRequests,
      }))
    }
  },

  // Aplica dados cacheados ao estado
  applyCachedData(data: { topicTotals: Record<string, number>; disciplineTotals: Record<string, number>; studyTotals: Record<string, number> }) {
    studyTimerStore.setState((s) => ({
      ...s,
      topicTotals: { ...s.topicTotals, ...data.topicTotals },
      disciplineTotals: { ...s.disciplineTotals, ...data.disciplineTotals },
      studyTotals: { ...s.studyTotals, ...data.studyTotals },
    }))
  },

  // Heartbeat incremental (a cada 20s)
  async heartbeat(deltaMs: number, trpc: typeof trpcClient) {
    const session = studyTimerStore.state.activeSession
    if (!session) return

    await trpc.timer.heartbeat.mutate({
        sessionId: session.sessionId,
        deltaMs
    })
  },
}

// Selectors para cálculos agregados
export const selectors = {
  // Tempo total do tópico (persistido + sessão ativa)
  getTopicTime: (topicId: string) => (state: TimeData) => {
    const persisted = state.topicTotals[topicId] || 0
    const active =
      state.activeSession?.topicId === topicId
        ? state.activeSession.elapsedMs
        : 0
    return persisted + active
  },

  // Tempo total da disciplina (soma dos tópicos)
  getDisciplineTime:
    (disciplineId: string, topicIds: string[]) => (state: TimeData) => {
      return topicIds.reduce((total, topicId) => {
        const persisted = state.topicTotals[topicId] || 0
        const active =
          state.activeSession?.topicId === topicId
            ? state.activeSession.elapsedMs
            : 0
        return total + persisted + active
      }, 0)
    },

  // Tempo total do plano (soma das disciplinas)
  getStudyTime: (studyId: string, allTopicIds: string[]) => (state: TimeData) => {
    return allTopicIds.reduce((total, topicId) => {
      const persisted = state.topicTotals[topicId] || 0
      const active =
        state.activeSession?.topicId === topicId
          ? state.activeSession.elapsedMs
          : 0
      return total + persisted + active
    }, 0)
  },

  getActiveSession: (state: TimeData) => state.activeSession,
}
