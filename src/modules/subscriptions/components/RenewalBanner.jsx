import { AlertTriangle, Clock, RefreshCw, X } from 'lucide-react'
import { useRenewalAlert } from '../hooks/useRenewalAlert'

/**
 * Banner fijo de alerta de renovación de suscripción
 * Se muestra en la parte superior de la pantalla
 * Diseño violeta que coincide con el estilo de la app
 */
export function RenewalBanner() {
  const {
    shouldShowBanner,
    bannerMessage,
    isInGracePeriod,
    graceDaysRemaining,
    daysRemaining,
    dismissBanner,
    openRenewalModal,
    urgency
  } = useRenewalAlert()

  if (!shouldShowBanner) {
    return null
  }

  // Colores según urgencia
  const getBannerStyles = () => {
    if (isInGracePeriod || urgency === 'critical') {
      return 'bg-gradient-to-r from-red-600 to-red-700'
    }
    if (urgency === 'high') {
      return 'bg-gradient-to-r from-orange-500 to-orange-600'
    }
    if (urgency === 'medium') {
      return 'bg-gradient-to-r from-amber-500 to-amber-600'
    }
    return 'bg-gradient-to-r from-violet-600 to-purple-700'
  }

  // Calcular porcentaje de la barra de progreso (3 días de gracia)
  const graceProgressPercent = isInGracePeriod
    ? (graceDaysRemaining / 3) * 100
    : 0

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${getBannerStyles()} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Icono y mensaje */}
          <div className="flex items-center gap-3 flex-1">
            {isInGracePeriod ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" strokeWidth={1.5} />
            ) : (
              <Clock className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
            )}
            <p className="text-sm md:text-base font-medium">
              {isInGracePeriod
                ? `Tu suscripción venció. Te quedan ${graceDaysRemaining} días de gracia.`
                : `Tu suscripción vence en ${daysRemaining} días. ¡Renová tu plan!`}
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botón renovar */}
            <button
              onClick={openRenewalModal}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isInGracePeriod
                  ? 'bg-white text-red-600 hover:bg-gray-100'
                  : 'bg-white/20 backdrop-blur hover:bg-white/30'
              }`}
            >
              <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Renovar ahora</span>
              <span className="sm:hidden">Renovar</span>
            </button>

            {/* Botón cerrar (solo si NO está en gracia) */}
            {!isInGracePeriod && (
              <button
                onClick={dismissBanner}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso de gracia */}
        {isInGracePeriod && (
          <div className="mt-2">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${graceProgressPercent}%` }}
              />
            </div>
            <p className="text-xs mt-1 text-white/80 text-center">
              {graceDaysRemaining} {graceDaysRemaining === 1 ? 'día restante' : 'días restantes'} de gracia
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RenewalBanner
