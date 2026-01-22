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
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm sticky top-0 z-[100]">
      <UserCog className="w-4 h-4 flex-shrink-0" />
      <span>
        Impersonando a <strong>{impersonationData.impersonatedUser?.email}</strong>
      </span>
      <span className="text-amber-200">|</span>
      <span className="text-amber-100">
        por {impersonationData.impersonatedBy?.email}
      </span>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="ml-2 flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-white font-medium transition-colors disabled:opacity-50"
      >
        {exiting ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Saliendo...
          </>
        ) : (
          <>
            <X className="w-3 h-3" />
            Salir
          </>
        )}
      </button>
    </div>
  )
}

export default ImpersonationBanner
