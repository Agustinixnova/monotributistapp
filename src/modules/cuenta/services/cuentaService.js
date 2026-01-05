import { supabase } from '../../../lib/supabase'
import { formatDate, formatPrice } from '../../../utils/formatters'

/**
 * Servicio para gestión de cuenta del usuario
 */
export const cuentaService = {
  /**
   * Obtiene los datos del perfil del usuario actual
   */
  async getMyProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        role:roles(id, name, display_name),
        fiscal_data:client_fiscal_data(*)
      `)
      .eq('id', user.id)
      .single()

    if (error) throw error
    return { ...data, email: user.email }
  },

  /**
   * Actualiza datos del perfil (teléfono, whatsapp)
   */
  async updateProfile({ telefono, whatsapp }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        telefono,
        whatsapp,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Actualiza dirección del perfil
   */
  async updateAddress({ direccion, localidad, codigo_postal, provincia }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        direccion,
        localidad,
        codigo_postal,
        provincia,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Actualiza el email del usuario
   */
  async updateEmail(newEmail) {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail
    })

    if (error) throw error
    return data
  },

  /**
   * Actualiza la contraseña del usuario
   */
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return data
  },

  /**
   * Obtiene la suscripción activa del usuario
   */
  async getMySubscription() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .in('status', ['active', 'grace_period'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  /**
   * Obtiene las facturas del usuario
   */
  async getMyInvoices() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Obtiene URL de descarga de una factura
   */
  async getInvoiceDownloadUrl(invoiceId) {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('user_id, invoice_number')
      .eq('id', invoiceId)
      .single()

    if (error) throw error

    const filePath = `${invoice.user_id}/${invoice.invoice_number}.pdf`

    const { data, error: storageError } = await supabase.storage
      .from('invoices')
      .createSignedUrl(filePath, 3600)

    if (storageError) throw storageError
    return data.signedUrl
  },

  // Reutilizar formatters globales
  formatDate,
  formatPrice
}

export default cuentaService
