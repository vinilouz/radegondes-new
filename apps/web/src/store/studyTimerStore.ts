
import { Store } from '@tanstack/react-store'
import { trpcClient } from '@/utils/trpc'

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

export const timerActions = {
  // Inicia sessão de estudo
  async startSession(topicId: string, disciplineId: string, studyId: string, trpc: typeof trpcClient) {
    const cryptoObj = globalThis.crypto || window.crypto
    const sessionId = cryptoObj.randomUUID()

    // Criar sessão no backend
    await trpc.timer.startSession.mutate({ sessionId, topicId })

    studyTimerStore.setState((s) => ({
      ...s,
      activeSession: {
        topicId,
        disciplineId,
        studyId,
        startedAt: performance.now(),
        elapsedMs: 0,
        sessionId,
      },
    }))
  },

  // Para sessão e persiste
  async stopSession() {
    const session = studyTimerStore.state.activeSession
    if (!session) return

    const finalDuration = Math.floor(session.elapsedMs)

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
