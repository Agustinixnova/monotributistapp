import { Clock, AlertTriangle } from 'lucide-react'
import { useRenewalAlert } from '../hooks/useRenewalAlert'

/**
 * Badge de alerta de renovación - versión normal con icono y texto
 * Para usar en headers o sidebars
 */
export function RenewalBadge({ onClick }) {
  const {
    badgeData,
    isInGracePeriod,
    urgency
  } = useRenewalAlert()

  if (!badgeData.show) {
    return null
  }

  // Colores según urgencia
  const getBadgeColor = () => {
    if (isInGracePeriod || urgency === 'critical') {
      return 'bg-red-500 text-white animate-pulse'
    }
    if (urgency === 'high') {
      return 'bg-orange-500 text-white'
    }
    if (urgency === 'medium') {
      return 'bg-amber-500 text-black'
    }
    return 'bg-violet-600 text-white'
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 ${getBadgeColor()}`}
      title="Ver opciones de renovación"
    >
      {isInGracePeriod ? (
        <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
      ) : (
        <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
      )}
      <span>{badgeData.text}</span>
    </button>
  )
}

/**
 * Badge compacto de 32x32px - versión círculo
 * Para espacios reducidos como headers móviles
 */
export function RenewalBadgeCompact({ onClick }) {
  const {
    badgeData,
    isInGracePeriod,
    daysRemaining,
    graceDaysRemaining,
    urgency
  } = useRenewalAlert()

  if (!badgeData.show) {
    return null
  }

  // Colores según urgencia
  const getBadgeColor = () => {
    if (isInGracePeriod || urgency === 'critical') {
      return 'bg-red-500 text-white'
    }
    if (urgency === 'high') {
      return 'bg-orange-500 text-white'
    }
    if (urgency === 'medium') {
      return 'bg-amber-500 text-black'
    }
    return 'bg-violet-600 text-white'
  }

  const displayNumber = isInGracePeriod ? graceDaysRemaining : daysRemaining

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all hover:scale-110 ${getBadgeColor()}`}
      title={isInGracePeriod
        ? `${graceDaysRemaining} días de gracia restantes - ¡Renová tu plan!`
        : `${daysRemaining} días para renovar - ¡Renová tu plan!`}
    >
      {/* Número de días */}
      <span className="text-sm">{displayNumber}</span>

      {/* Indicador de urgencia crítica */}
      {(urgency === 'critical' || isInGracePeriod) && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
      )}
    </button>
  )
}

export default RenewalBadge
