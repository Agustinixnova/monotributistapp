/**
 * Módulo de Suscripciones - MonoGestión
 *
 * Este módulo maneja todo lo relacionado con:
 * - Planes de suscripción
 * - Estado de suscripción del usuario
 * - Renovaciones y alertas
 * - Pagos (mock para desarrollo)
 * - Control de acceso basado en suscripción
 */

// ============================================
// SERVICES
// ============================================
export { subscriptionService } from './services/subscriptionService'

// ============================================
// HOOKS
// ============================================
export { useSubscription } from './hooks/useSubscription'
export { usePlans } from './hooks/usePlans'
export { useRenewalAlert } from './hooks/useRenewalAlert'
export { useSubscriptionAccess } from './hooks/useSubscriptionAccess'

// ============================================
// COMPONENTS
// ============================================

// Selección de planes
export { PlanSelector } from './components/PlanSelector'

// Banners y badges de renovación
export { RenewalBanner } from './components/RenewalBanner'
export { RenewalBadge, RenewalBadgeCompact } from './components/RenewalBadge'

// Modal de renovación
export { RenewalModal } from './components/RenewalModal'

// Estado de suscripción
export { SubscriptionStatus } from './components/SubscriptionStatus'

// Gate de acceso
export { SubscriptionGate } from './components/SubscriptionGate'

// Página de pago mock
export { MockPaymentPage } from './components/MockPaymentPage'
