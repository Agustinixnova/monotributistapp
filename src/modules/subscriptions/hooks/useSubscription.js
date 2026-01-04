import { useState, useEffect, useCallback } from 'react'
import { subscriptionService } from '../services/subscriptionService'

/**
 * Hook para gestionar el estado de suscripción del usuario
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener estado de suscripción
      const statusData = await subscriptionService.getUserSubscriptionStatus()
      setStatus(statusData)

      // Si tiene suscripción activa, obtener detalles
      if (statusData?.has_active_subscription) {
        const subscriptionData = await subscriptionService.getCurrentSubscription()
        setSubscription(subscriptionData)
      } else {
        setSubscription(null)
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Valores calculados derivados del status
  const hasActiveSubscription = status?.has_active_subscription ?? false
  const canAccessApp = status?.can_access_app ?? false
  const isInGracePeriod = status?.is_in_grace_period ?? false
  const shouldShowRenewalAlert = status?.should_show_renewal_alert ?? false
  const daysRemaining = status?.days_remaining ?? 0
  const graceDaysRemaining = status?.grace_days_remaining ?? 0

  // Derivados adicionales
  const needsPayment = !loading && !canAccessApp
  const showRenewalBanner = hasActiveSubscription && (shouldShowRenewalAlert || isInGracePeriod)

  /**
   * Retorna el mensaje apropiado para el banner de renovación
   */
  const getBannerMessage = useCallback(() => {
    if (isInGracePeriod) {
      if (graceDaysRemaining <= 1) {
        return 'Tu suscripción venció. Último día de gracia. Renová ahora para no perder acceso.'
      }
      return `Tu suscripción venció. Te quedan ${graceDaysRemaining} días de gracia. Renová ahora.`
    }

    if (shouldShowRenewalAlert) {
      if (daysRemaining <= 1) {
        return 'Tu suscripción vence hoy. Renová ahora para no perder acceso.'
      }
      if (daysRemaining <= 3) {
        return `Tu suscripción vence en ${daysRemaining} días. Renová pronto.`
      }
      return `Tu suscripción vence en ${daysRemaining} días. Podés renovar ahora.`
    }

    return ''
  }, [isInGracePeriod, graceDaysRemaining, shouldShowRenewalAlert, daysRemaining])

  /**
   * Retorna el nivel de urgencia del banner
   * @returns {'critical' | 'high' | 'medium' | 'low'}
   */
  const getBannerUrgency = useCallback(() => {
    if (isInGracePeriod) {
      if (graceDaysRemaining <= 1) return 'critical'
      return 'high'
    }

    if (shouldShowRenewalAlert) {
      if (daysRemaining <= 3) return 'high'
      if (daysRemaining <= 7) return 'medium'
      return 'low'
    }

    return 'low'
  }, [isInGracePeriod, graceDaysRemaining, shouldShowRenewalAlert, daysRemaining])

  return {
    // Estado
    subscription,
    status,
    loading,
    error,

    // Valores calculados
    hasActiveSubscription,
    canAccessApp,
    isInGracePeriod,
    shouldShowRenewalAlert,
    daysRemaining,
    graceDaysRemaining,
    needsPayment,
    showRenewalBanner,

    // Funciones helper
    getBannerMessage,
    getBannerUrgency,

    // Acciones
    refresh: fetchSubscription
  }
}

export default useSubscription
