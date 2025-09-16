import { useStore } from '@tanstack/react-store'
import { studyTimerStore, selectors, timerActions } from '@/store/studyTimerStore'
import { formatTime } from '@/lib/utils'
import { X, Pause, Play } from 'lucide-react'
import { useState } from 'react'

export function StudyTimerWidget() {
  const activeSession = useStore(studyTimerStore, selectors.getActiveSession)
  const sessionTime = useStore(studyTimerStore, selectors.getActiveSessionTime)
  const [isStopping, setIsStopping] = useState(false)
  
  if (!activeSession) return null
  
  const handleStop = async () => {
    if (isStopping) return
    setIsStopping(true)
    
    try {
      await timerActions.stopSession()
    } catch (error) {
      console.error('Erro ao parar sessão:', error)
      alert('Erro ao parar timer. Tente novamente.')
    } finally {
      setIsStopping(false)
    }
  }
  
  // Pega nome do tópico do localStorage ou mostra ID
  const getTopicName = () => {
    // Simplificado - você pode melhorar isso buscando o nome real
    return activeSession.topicId.slice(0, 20) + '...'
  }
  
  return (
    <div className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-2xl p-5 min-w-[280px] z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium opacity-90">Estudando</span>
        <button
          onClick={handleStop}
          disabled={isStopping}
          className="hover:bg-white/20 rounded-lg p-1 transition-colors"
          title="Parar timer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Topic Name */}
      <div className="mb-4">
        <div className="font-semibold text-lg truncate">
          {getTopicName()}
        </div>
      </div>
      
      {/* Timer Display */}
      <div className="bg-black/20 rounded-lg p-4 mb-4">
        <div className="font-mono text-3xl font-bold text-center tracking-wider">
          {formatTime(sessionTime)}
        </div>
        <div className="text-xs text-center mt-1 opacity-75">
          Sessão Atual
        </div>
      </div>
      
      {/* Stop Button */}
      <button
        onClick={handleStop}
        disabled={isStopping}
        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed 
                   px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isStopping ? (
          <>Salvando...</>
        ) : (
          <>
            <Pause className="h-4 w-4" />
            Parar e Salvar
          </>
        )}
      </button>
      
      {/* Status Indicator */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs opacity-75">Salvando automaticamente</span>
      </div>
    </div>
  )
}