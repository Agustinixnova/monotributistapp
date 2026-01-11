import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Componente para notificar actualizaciones disponibles
 * Usa registerType: 'prompt' para que el usuario decida cuándo actualizar
 */
export function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Verificar actualizaciones cada hora
      if (r) {
        setInterval(() => {
          r.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      setShowUpdate(true)
    }
  }, [needRefresh])

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  const handleDismiss = () => {
    setShowUpdate(false)
    setNeedRefresh(false)
  }

  if (!showUpdate) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down md:left-auto md:right-4 md:w-96 pt-safe-top">
      <div className="bg-violet-600 text-white rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-violet-500 rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="font-heading font-semibold">
              Nueva versión disponible
            </h3>
            <p className="text-sm text-violet-100 mt-1">
              Hay mejoras disponibles para la app
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-violet-200 hover:text-white transition-colors rounded-lg"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 min-h-[44px] text-sm font-medium text-violet-100 bg-violet-500 rounded-xl hover:bg-violet-400 transition-colors"
          >
            Después
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 px-4 py-2.5 min-h-[44px] text-sm font-medium text-violet-600 bg-white rounded-xl hover:bg-violet-50 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}
