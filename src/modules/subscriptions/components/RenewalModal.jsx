import { X, Crown, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'
import { PlanSelector } from './PlanSelector'
import { useSubscription } from '../hooks/useSubscription'

/**
 * Modal de renovación de suscripción
 * Diseño violeta que coincide con el estilo del Login
 * @param {boolean} isOpen - Estado de apertura del modal
 * @param {Function} onClose - Callback al cerrar el modal
 */
export function RenewalModal({ isOpen, onClose }) {
  const { subscription, isInGracePeriod, graceDaysRemaining } = useSubscription()

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isInGracePeriod) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, isInGracePeriod])

  if (!isOpen) {
    return null
  }

  const handleBackdropClick = (e) => {
    // Solo cerrar si no está en gracia y se hace clic en el backdrop
    if (e.target === e.currentTarget && !isInGracePeriod) {
      onClose()
    }
  }

  const handleSuccess = () => {
    // El PlanSelector redirige al pago, así que esto no se ejecutará normalmente
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 rounded-2xl shadow-2xl">
        {/* Círculos decorativos blur */}
        <div className="absolute top-10 -left-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-20 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header del modal */}
        <div className="sticky top-0 z-10 bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Renovar suscripción
                </h2>
                {subscription?.plan_name && (
                  <p className="text-sm text-violet-200">
                    Plan actual: {subscription.plan_name}
                  </p>
                )}
              </div>
            </div>

            {/* Botón cerrar - solo si NO está en gracia */}
            {!isInGracePeriod && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-6 h-6 text-white" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Alerta de gracia */}
          {isInGracePeriod && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-300 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-sm text-red-200 font-medium">
                Tu suscripción venció. Te quedan {graceDaysRemaining} {graceDaysRemaining === 1 ? 'día' : 'días'} de gracia.
                Renová ahora para no perder acceso a la aplicación.
              </p>
            </div>
          )}
        </div>

        {/* Contenido - PlanSelector en modo modal */}
        <div className="p-6 relative z-10">
          <PlanSelector
            isModal={true}
            onSuccess={handleSuccess}
            currentPlanKey={subscription?.plan_key}
            renewalFromDate={subscription?.end_date}
          />
        </div>
      </div>
    </div>
  )
}

export default RenewalModal
