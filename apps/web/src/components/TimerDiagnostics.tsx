import { useStore } from '@tanstack/react-store'
import { studyTimerStore } from '@/store/studyTimerStore'
import { useState, useEffect } from 'react'

export function TimerDiagnostics() {
  const state = useStore(studyTimerStore)
  const [localStorage, setLocalStorage] = useState<any>(null)
  
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = window.localStorage.getItem('timer_session_v2')
      setLocalStorage(stored ? JSON.parse(stored) : null)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Só mostra em desenvolvimento
  if (import.meta.env.PROD) return null
  
  return (
    <div className="fixed top-4 left-4 bg-black/90 text-green-400 p-4 rounded-lg 
                    font-mono text-xs max-w-md z-[100] space-y-2">
      <div className="text-yellow-400 font-bold mb-2">🔧 DEPURAÇÃO DO TIMER</div>
      
      {/* Estado do Store */}
      <div className="border border-green-400/30 p-2 rounded">
        <div className="text-cyan-400">Estado do Store:</div>
        {state.activeSession ? (
          <>
            <div>SessionID: {state.activeSession.sessionId.slice(0, 8)}...</div>
            <div>TopicID: {state.activeSession.topicId.slice(0, 8)}...</div>
            <div>StartTime: {new Date(state.activeSession.startTime).toLocaleTimeString()}</div>
            <div>Duration: {Math.round((Date.now() - state.activeSession.startTime) / 1000)}s</div>
            <div>Tick: {state.tick}</div>
          </>
        ) : (
          <div className="text-gray-500">Nenhuma sessão ativa</div>
        )}
      </div>
      
      {/* Estado do localStorage */}
      <div className="border border-yellow-400/30 p-2 rounded">
        <div className="text-yellow-400">Armazenamento Local:</div>
        {localStorage ? (
          <>
            <div>SessionID: {localStorage.sessionId?.slice(0, 8)}...</div>
            <div>StartTime: {new Date(localStorage.startTime).toLocaleTimeString()}</div>
            <div>Age: {Math.round((Date.now() - localStorage.startTime) / 1000)}s</div>
          </>
        ) : (
          <div className="text-gray-500">Nenhuma sessão armazenada</div>
        )}
      </div>
      
      {/* Totais Salvos */}
      <div className="border border-purple-400/30 p-2 rounded">
        <div className="text-purple-400">Totais Salvos:</div>
        {Object.keys(state.savedTotals).length > 0 ? (
          Object.entries(state.savedTotals).slice(0, 3).map(([id, time]) => (
            <div key={id}>
              {id.slice(0, 8)}...: {Math.round(time / 1000)}s
            </div>
          ))
        ) : (
          <div className="text-gray-500">Nenhum total salvo</div>
        )}
      </div>
      
      {/* Ações de Teste */}
      <div className="border border-red-400/30 p-2 rounded space-y-1">
        <div className="text-red-400">Ações de Teste:</div>
        <button 
          onClick={() => window.localStorage.clear()}
          className="px-2 py-1 bg-red-600 text-white rounded text-xs"
        >
          Limpar Armazenamento Local
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs ml-2"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  )
}