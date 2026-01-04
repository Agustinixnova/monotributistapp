import { supabase } from '../../../lib/supabase'

/**
 * Servicio de suscripciones
 * Timezone: America/Argentina/Buenos_Aires (UTC-3)
 */

/**
 * Obtiene planes activos ordenados por display_order
 */
async function getPlans() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Obtiene el estado de suscripción del usuario actual
 */
async function getUserSubscriptionStatus() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .rpc('get_user_subscription_status', { p_user_id: user.id })

  if (error) throw error
  return data?.[0] || null
}

/**
 * Obtiene la suscripción activa del usuario
 */
async function getCurrentSubscription() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'grace_period'])
    .order('ends_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data
}

/**
 * Crea una nueva suscripción
 * @param {string} planKey - Clave del plan (monthly, quarterly, etc.)
 */
async function createSubscription(planKey) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .rpc('create_subscription', {
      p_user_id: user.id,
      p_plan_key: planKey
    })

  if (error) throw error
  return data // Retorna el UUID de la suscripción creada
}

/**
 * Confirma el pago de una suscripción
 * @param {string} subscriptionId - UUID de la suscripción
 * @param {string} mpPaymentId - ID del pago de MercadoPago
 */
async function confirmPayment(subscriptionId, mpPaymentId) {
  const { data, error } = await supabase
    .rpc('confirm_subscription_payment', {
      p_subscription_id: subscriptionId,
      p_mp_payment_id: mpPaymentId
    })

  if (error) throw error
  return data
}

/**
 * Obtiene el historial de suscripciones del usuario
 */
async function getSubscriptionHistory() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(name, plan_key)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Obtiene las facturas del usuario
 */
async function getUserInvoices() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Inicia el proceso de pago (mock por ahora)
 * @param {string} subscriptionId - UUID de la suscripción
 * @param {string} planKey - Clave del plan
 */
async function initiatePayment(subscriptionId, planKey) {
  // Por ahora retorna URL mock, después integrar MercadoPago
  const params = new URLSearchParams({
    subscription_id: subscriptionId,
    plan: planKey
  })

  return `/subscription/mock-payment?${params.toString()}`
}

/**
 * Calcula los días restantes hasta una fecha
 * @param {string|Date} endsAt - Fecha de vencimiento
 */
function calculateDaysRemaining(endsAt) {
  if (!endsAt) return 0

  // Usar timezone de Buenos Aires
  const now = new Date()
  const end = new Date(endsAt)

  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Determina si debe mostrarse la alerta de renovación
 * @param {string|Date} endsAt - Fecha de vencimiento
 * @param {number} alertDays - Días de anticipación para la alerta
 */
function shouldShowRenewalAlert(endsAt, alertDays) {
  const daysRemaining = calculateDaysRemaining(endsAt)
  return daysRemaining > 0 && daysRemaining <= alertDays
}

/**
 * Formatea un monto a pesos argentinos
 * @param {number} amount - Monto en centavos/pesos sin decimales
 */
function formatPrice(amount) {
  if (amount === null || amount === undefined) return ''

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Formatea una fecha en formato dd/mm/yyyy
 * @param {string|Date} date - Fecha a formatear
 */
function formatDate(date) {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  }).format(dateObj)
}

export const subscriptionService = {
  getPlans,
  getUserSubscriptionStatus,
  getCurrentSubscription,
  createSubscription,
  confirmPayment,
  getSubscriptionHistory,
  getUserInvoices,
  initiatePayment,
  calculateDaysRemaining,
  shouldShowRenewalAlert,
  formatPrice,
  formatDate
}

export default subscriptionService
