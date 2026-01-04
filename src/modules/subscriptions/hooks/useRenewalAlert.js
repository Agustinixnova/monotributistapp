import { useState, useCallback } from 'react'
import { useSubscription } from './useSubscription'

/**
 * Hook para gestionar alertas de renovación de suscripción
 */
export function useRenewalAlert() {
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const {
    showRenewalBanner,
    getBannerMessage,
    getBannerUrgency,
    daysRemaining,
    graceDaysRemaining,
    isInGracePeriod,
    subscription
  } = useSubscription()

  const openRenewalModal = useCallback(() => {
    setIsRenewalModalOpen(true)
  }, [])

  const closeRenewalModal = useCallback(() => {
    setIsRenewalModalOpen(false)
  }, [])

  /**
   * Descarta el banner temporalmente
   * Solo permite dismiss si NO está en período de gracia
   */
  const dismissBanner = useCallback(() => {
    if (!isInGracePeriod) {
      setIsDismissed(true)
    }
  }, [isInGracePeriod])

  // Mostrar banner si hay alerta y no fue descartado (o está en gracia)
  const shouldShowBanner = showRenewalBanner && (!isDismissed || isInGracePeriod)

  // Datos para el badge compacto
  const urgency = getBannerUrgency()
  const badgeData = {
    show: showRenewalBanner,
    text: isInGracePeriod
      ? `${graceDaysRemaining}d gracia`
      : `${daysRemaining}d`,
    urgency
  }

  /**
   * Retorna clases Tailwind para el badge según urgencia
   */
  const getBadgeColor = useCallback(() => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500 text-white animate-pulse'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-black'
      default:
        return 'bg-blue-500 text-white'
    }
  }, [urgency])

  /**
   * Retorna clases Tailwind para el banner según urgencia
   */
  const getBannerColor = useCallback(() => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-600 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-black'
      default:
        return 'bg-blue-600 text-white'
    }
  }, [urgency])

  return {
    // Estados del modal
    isRenewalModalOpen,
    openRenewalModal,
    closeRenewalModal,

    // Estados del banner
    shouldShowBanner,
    isDismissed,
    dismissBanner,

    // Datos del badge
    badgeData,
    getBadgeColor,

    // Datos del banner
    bannerMessage: getBannerMessage(),
    bannerColor: getBannerColor(),
    urgency,

    // Información de tiempo
    daysRemaining,
    graceDaysRemaining,
    isInGracePeriod,

    // Suscripción actual
    subscription
  }
}

export default useRenewalAlert
