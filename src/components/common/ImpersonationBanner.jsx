import { useState } from 'react'
import { UserCog, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'

/**
 * Banner que se muestra cuando hay una impersonación activa
 * Permite al usuario desarrollo salir de la impersonación
 */
export function ImpersonationBanner() {
  const { isImpersonating, impersonationData, exitImpersonation } = useAuth()
  const [exiting, setExiting] = useState(false)

  if (!isImpersonating || !impersonationData) {
    return null
  }

  const handleExit = async () => {
    setExiting(true)
    const result = await exitImpersonation()
    if (!result.success) {
      console.error('Error al salir de impersonación:', result.error)
      setExiting(false)
    }
    // Si es exitoso, la página se recargará automáticamente
  }

  return (
    <div className="bg-amber-500 text-white px-3 py-2 sticky top-0 z-[100]">
      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm max-w-5xl mx-auto">
        {/* Info de impersonación */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <UserCog className="w-4 h-4 flex-shrink-0 hidden sm:block" />
          <div className="truncate">
            <span className="hidden sm:inline">Impersonando a </span>
            <strong className="truncate">{impersonationData.impersonatedUser?.email}</strong>
            <span className="text-amber-200 mx-1 hidden sm:inline">|</span>
            <span className="text-amber-100 hidden sm:inline">
              por {impersonationData.impersonatedBy?.email?.split('@')[0]}
            </span>
          </div>
        </div>

        {/* Botón salir */}
        <button
          onClick={handleExit}
          disabled={exiting}
          className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-white font-medium transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {exiting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Saliendo...</span>
            </>
          ) : (
            <>
              <X className="w-3 h-3" />
              <span>Salir</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ImpersonationBanner
