import { supabase } from '../../../../lib/supabase'
import { invoiceStorageService } from './invoiceStorageService'
import { formatDate, formatPrice } from '../../../../utils/formatters'

/**
 * Servicio de administración de suscripciones
 * Solo para usuarios admin/contadora_principal
 */

// ============================================
// PLANES
// ============================================

/**
 * Obtiene todos los planes (incluyendo inactivos)
 */
async function getAllPlans() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Actualiza un plan
 * @param {string} planId - ID del plan
 * @param {Object} updates - Campos a actualizar
 */
async function updatePlan(planId, updates) {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', planId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Calcula precios de un plan basado en precio base y descuento
 * @param {number} basePrice - Precio base mensual (sin descuento)
 * @param {number} discountPercentage - Porcentaje de descuento (0-100)
 * @param {number} durationMonths - Duración en meses
 */
function calculatePlanPrices(basePrice, discountPercentage, durationMonths) {
  const pricePerMonth = Math.round(basePrice * (1 - discountPercentage / 100))
  const totalPrice = pricePerMonth * durationMonths
  const savingsAmount = (basePrice * durationMonths) - totalPrice

  return {
    price_per_month: pricePerMonth,
    total_price: totalPrice,
    savings_amount: savingsAmount
  }
}

/**
 * Activa/desactiva un plan
 */
async function togglePlanStatus(planId, isActive) {
  return updatePlan(planId, { is_active: isActive })
}

// ============================================
// SUSCRIPCIONES
// ============================================

/**
 * Obtiene lista paginada de suscripciones
 * @param {Object} options - Opciones de filtrado y paginación
 */
async function getSubscriptions({ status, search, page = 1, limit = 20 }) {
  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans (
        name,
        plan_key
      )
    `, { count: 'exact' })

  // Filtro por estado
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  const { data: subscriptions, error, count } = await query

  if (error) throw error
  if (!subscriptions || subscriptions.length === 0) {
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    }
  }

  // Obtener perfiles de los usuarios
  const userIds = [...new Set(subscriptions.map(s => s.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email')
    .in('id', userIds)

  // Crear mapa de perfiles
  const profilesMap = {}
  profiles?.forEach(p => { profilesMap[p.id] = p })

  // Combinar datos
  let dataWithProfiles = subscriptions.map(sub => ({
    ...sub,
    profiles: profilesMap[sub.user_id] || null
  }))

  // Filtrar por búsqueda si existe
  if (search) {
    const searchLower = search.toLowerCase()
    dataWithProfiles = dataWithProfiles.filter(sub => {
      const fullName = `${sub.profiles?.nombre || ''} ${sub.profiles?.apellido || ''}`.toLowerCase()
      const email = (sub.profiles?.email || '').toLowerCase()
      return fullName.includes(searchLower) || email.includes(searchLower)
    })
  }

  return {
    data: dataWithProfiles,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

/**
 * Obtiene suscripciones que vencen en los próximos X días
 * @param {number} daysAhead - Días hacia adelante
 */
async function getExpiringSubscriptions(daysAhead = 7) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  // 1. Obtener suscripciones
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans (
        name,
        plan_key,
        grace_period_days
      )
    `)
    .in('status', ['active', 'grace_period'])
    .lte('ends_at', futureDate.toISOString())
    .order('ends_at', { ascending: true })

  if (error) throw error
  if (!subscriptions || subscriptions.length === 0) return []

  // 2. Obtener perfiles de los usuarios
  const userIds = [...new Set(subscriptions.map(s => s.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email, telefono, whatsapp')
    .in('id', userIds)

  // 3. Crear mapa de perfiles
  const profilesMap = {}
  profiles?.forEach(p => { profilesMap[p.id] = p })

  // 4. Combinar datos
  return subscriptions.map(sub => ({
    ...sub,
    profiles: profilesMap[sub.user_id] || null
  }))
}

/**
 * Obtiene métricas de suscripciones
 */
async function getSubscriptionMetrics() {
  // Obtener todas las suscripciones
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select(`
      status,
      plan_id,
      subscription_plans (
        name,
        price_per_month
      )
    `)

  if (subError) throw subError

  // Calcular métricas
  const metrics = {
    total: 0,
    active: 0,
    grace_period: 0,
    expired: 0,
    cancelled: 0,
    pending_payment: 0,
    byPlan: {},
    mrr: 0,
    arr: 0
  }

  subscriptions?.forEach(sub => {
    metrics.total++

    switch (sub.status) {
      case 'active':
        metrics.active++
        metrics.mrr += sub.subscription_plans?.price_per_month || 0
        break
      case 'grace_period':
        metrics.grace_period++
        break
      case 'expired':
        metrics.expired++
        break
      case 'cancelled':
        metrics.cancelled++
        break
      case 'pending_payment':
        metrics.pending_payment++
        break
    }

    // Agrupar por plan (solo activos)
    if (sub.status === 'active' && sub.subscription_plans) {
      const planName = sub.subscription_plans.name
      if (!metrics.byPlan[planName]) {
        metrics.byPlan[planName] = {
          name: planName,
          count: 0,
          mrr: 0
        }
      }
      metrics.byPlan[planName].count++
      metrics.byPlan[planName].mrr += sub.subscription_plans.price_per_month || 0
    }
  })

  metrics.arr = metrics.mrr * 12

  return metrics
}

// ============================================
// FACTURAS
// ============================================

/**
 * Obtiene lista paginada de facturas
 */
async function getInvoices({ userId, status, page = 1, limit = 20 }) {
  let query = supabase
    .from('invoices')
    .select('*', { count: 'exact' })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  const { data: invoices, error, count } = await query

  if (error) throw error
  if (!invoices || invoices.length === 0) {
    return {
      data: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    }
  }

  // Obtener perfiles de los usuarios
  const userIds = [...new Set(invoices.map(i => i.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email')
    .in('id', userIds)

  // Crear mapa de perfiles
  const profilesMap = {}
  profiles?.forEach(p => { profilesMap[p.id] = p })

  // Combinar datos
  const dataWithProfiles = invoices.map(inv => ({
    ...inv,
    profiles: profilesMap[inv.user_id] || null
  }))

  return {
    data: dataWithProfiles,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

/**
 * Crea una nueva factura
 */
async function createInvoice({ userId, subscriptionId, amount, description, periodStart, periodEnd }) {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      subscription_id: subscriptionId,
      amount,
      description,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualiza una factura
 */
async function updateInvoice(invoiceId, updates) {
  const { data, error } = await supabase
    .from('invoices')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', invoiceId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Sube una factura PDF y actualiza el registro en la BD
 * @param {string} invoiceId - ID de la factura
 * @param {File} file - Archivo PDF
 */
async function uploadInvoiceFile(invoiceId, file) {
  // Obtener datos de la factura
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('user_id, invoice_number')
    .eq('id', invoiceId)
    .single()

  if (fetchError) throw fetchError

  // Subir archivo
  const { path } = await invoiceStorageService.uploadInvoice(
    invoice.user_id,
    invoice.invoice_number,
    file
  )

  // Actualizar registro con la URL
  const { data, error } = await supabase
    .from('invoices')
    .update({
      file_url: path,
      file_name: `${invoice.invoice_number}.pdf`,
      status: 'sent',
      updated_at: new Date().toISOString()
    })
    .eq('id', invoiceId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene URL de descarga de una factura
 * @param {string} invoiceId - ID de la factura
 * @returns {Promise<string>} URL firmada de descarga
 */
async function getInvoiceDownloadUrl(invoiceId) {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('user_id, invoice_number')
    .eq('id', invoiceId)
    .single()

  if (error) throw error

  return invoiceStorageService.getInvoiceUrl(
    invoice.user_id,
    invoice.invoice_number
  )
}

// ============================================
// CONFIGURACIÓN
// ============================================

/**
 * Obtiene configuración de MercadoPago
 */
async function getMercadoPagoSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'mercadopago')
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data?.value || null
}

/**
 * Actualiza configuración de MercadoPago
 */
async function updateMercadoPagoSettings(settings) {
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', 'mercadopago')
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('app_settings')
      .update({
        value: settings,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'mercadopago')
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('app_settings')
      .insert({
        key: 'mercadopago',
        value: settings,
        description: 'Configuración de MercadoPago'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

/**
 * Obtiene configuración de suscripciones
 */
async function getSubscriptionSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'subscription_settings')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data?.value || null
}

/**
 * Actualiza configuración de suscripciones
 */
async function updateSubscriptionSettings(settings) {
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', 'subscription_settings')
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('app_settings')
      .update({
        value: settings,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'subscription_settings')
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('app_settings')
      .insert({
        key: 'subscription_settings',
        value: settings,
        description: 'Configuración de suscripciones'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const adminSubscriptionService = {
  // Planes
  getAllPlans,
  updatePlan,
  calculatePlanPrices,
  togglePlanStatus,

  // Suscripciones
  getSubscriptions,
  getExpiringSubscriptions,
  getSubscriptionMetrics,

  // Facturas
  getInvoices,
  createInvoice,
  updateInvoice,
  uploadInvoiceFile,
  getInvoiceDownloadUrl,

  // Configuración
  getMercadoPagoSettings,
  updateMercadoPagoSettings,
  getSubscriptionSettings,
  updateSubscriptionSettings,

  // Helpers
  formatPrice,
  formatDate
}

export default adminSubscriptionService
