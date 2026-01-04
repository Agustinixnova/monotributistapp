import { useSubscription } from './useSubscription'

/**
 * Hook para controlar acceso basado en suscripción
 * Usado por SubscriptionGate y rutas protegidas
 */
export function useSubscriptionAccess() {
  const {
    loading,
    canAccessApp,
    needsPayment,
    isInGracePeriod,
    hasActiveSubscription,
    subscription
  } = useSubscription()

  /**
   * Determina si el usuario puede acceder a la aplicación
   * - Permite acceso si tiene suscripción activa
   * - Permite acceso si está en período de gracia
   * - Bloquea acceso si nunca pagó o si venció el período de gracia
   */
  const hasAccess = !loading && canAccessApp

  /**
   * Determina si debe mostrar el paywall
   */
  const showPaywall = !loading && needsPayment

  /**
   * Determina si es un nuevo usuario que nunca tuvo suscripción
   */
  const isNewUser = !loading && !hasActiveSubscription && !subscription

  /**
   * Determina si el acceso expiró (tenía suscripción pero venció)
   */
  const isExpired = !loading && !canAccessApp && subscription

  return {
    // Estados de carga
    loading,

    // Estados de acceso
    hasAccess,
    showPaywall,
    isNewUser,
    isExpired,

    // Estados de suscripción
    canAccessApp,
    isInGracePeriod,
    hasActiveSubscription,

    // Datos
    subscription
  }
}

export default useSubscriptionAccess
