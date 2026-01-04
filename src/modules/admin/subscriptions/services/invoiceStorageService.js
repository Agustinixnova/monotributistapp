import { supabase } from '../../../../lib/supabase'

/**
 * Servicio para manejo de archivos PDF de facturas en Supabase Storage
 * Bucket: invoices (privado)
 * Estructura: invoices/{user_id}/{invoice_number}.pdf
 */
export const invoiceStorageService = {
  /**
   * Sube un PDF de factura al storage
   * @param {string} userId - ID del usuario dueño de la factura
   * @param {string} invoiceNumber - Número de factura (ej: INV-202601-0001)
   * @param {File} file - Archivo PDF
   * @returns {Promise<{path: string, url: string}>}
   */
  async uploadInvoice(userId, invoiceNumber, file) {
    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      throw new Error('Solo se permiten archivos PDF')
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('El archivo no puede superar 10MB')
    }

    const filePath = `${userId}/${invoiceNumber}.pdf`

    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Reemplaza si ya existe
      })

    if (error) throw error

    return {
      path: data.path,
      url: await this.getInvoiceUrl(userId, invoiceNumber)
    }
  },

  /**
   * Obtiene URL firmada para descargar una factura
   * La URL expira en 1 hora
   * @param {string} userId - ID del usuario
   * @param {string} invoiceNumber - Número de factura
   * @returns {Promise<string>} URL firmada
   */
  async getInvoiceUrl(userId, invoiceNumber) {
    const filePath = `${userId}/${invoiceNumber}.pdf`

    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(filePath, 3600) // 1 hora

    if (error) throw error
    return data.signedUrl
  },

  /**
   * Elimina una factura del storage
   * @param {string} userId - ID del usuario
   * @param {string} invoiceNumber - Número de factura
   * @returns {Promise<boolean>}
   */
  async deleteInvoice(userId, invoiceNumber) {
    const filePath = `${userId}/${invoiceNumber}.pdf`

    const { error } = await supabase.storage
      .from('invoices')
      .remove([filePath])

    if (error) throw error
    return true
  },

  /**
   * Lista todas las facturas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de archivos
   */
  async listUserInvoices(userId) {
    const { data, error } = await supabase.storage
      .from('invoices')
      .list(userId)

    if (error) throw error
    return data
  }
}

export default invoiceStorageService
