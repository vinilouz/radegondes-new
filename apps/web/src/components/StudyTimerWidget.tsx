import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils'
import { X, Square } from 'lucide-react'
import { useState } from 'react'

export function StudyTimerWidget() {
  const [isStopping, setIsStopping] = useState(false)
  
  // Força re-render a cada segundo via tick
  const tick = useStore(studyTimerStore, s => s.tick)
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)
  const sessionTime = useStore(studyTimerStore, selectors.getCurrentSessionTime)
  
  if (!activeSession) return null
  
  const handleStop = async () => {
    if (isStopping) return
    setIsStopping(true)
    
    try {
      await timerActions.stopSession()
      // Força reload dos totais
      await timerActions.loadTotals([activeSession.topicId])
    } catch (error) {
      console.error('Erro ao parar sessão:', error)
      alert('Erro ao salvar. Por favor, tente novamente!')
      setIsStopping(false)
    }
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-br from-blue-600 to-blue-700 
                    text-white rounded-xl shadow-2xl p-4 min-w-[250px] z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium opacity-90 uppercase tracking-wider">
          Timer Ativo
        </span>
        <button
          onClick={handleStop}
          disabled={isStopping}
          className="hover:bg-white/20 rounded p-1 transition-colors disabled:opacity-50"
          title="Parar timer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Timer Display - ÚNICO CÁLCULO */}
      <div className="bg-black/20 rounded-lg p-3 mb-3">
        <div className="font-mono text-2xl font-bold text-center">
          {formatTime(sessionTime)}
        </div>
      </div>
      
      {/* Stop Button */}
      <button
        onClick={handleStop}
        disabled={isStopping}
        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 
                   disabled:cursor-not-allowed px-3 py-2 rounded-lg font-medium 
                   transition-colors flex items-center justify-center gap-2 text-sm"
      >
        {isStopping ? (
          <>Salvando...</>
        ) : (
          <>
            <Square className="h-4 w-4" />
            Parar e Salvar
          </>
        )}
      </button>
      
      {/* Debug Info (remova em produção) */}
      <div className="mt-2 text-xs opacity-60 text-center">
        ID: {activeSession.topicId.slice(0, 8)}...
      </div>
    </div>
  )
}