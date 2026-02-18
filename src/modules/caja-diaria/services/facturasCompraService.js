/**
 * Service para gestión de facturas de compra
 */

import { supabase } from '../../../lib/supabase'
import { getEffectiveUserId } from './empleadosService'

/**
 * Obtener facturas de un proveedor específico
 * @param {string} proveedorId - ID del proveedor
 */
export async function getFacturasByProveedor(proveedorId) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_facturas_compra')
      .select('*')
      .eq('user_id', userId)
      .eq('proveedor_id', proveedorId)
      .eq('activo', true)
      .order('fecha_factura', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching facturas by proveedor:', error)
    return { data: null, error }
  }
}

/**
 * Obtener facturas recientes con join a proveedor
 * @param {number} limit - Cantidad máxima de facturas
 */
export async function getFacturasRecientes(limit = 10) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_facturas_compra')
      .select('*, proveedor:caja_proveedores(id, razon_social, cuit)')
      .eq('user_id', userId)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching facturas recientes:', error)
    return { data: null, error }
  }
}

/**
 * Crear factura simple (sin egreso en caja)
 * @param {object} data - Datos de la factura
 */
export async function createFactura({ proveedor_id, numero_factura, fecha_factura, fecha_carga, monto_sin_iva, monto_total, descripcion }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id

    const { data, error } = await supabase
      .from('caja_facturas_compra')
      .insert({
        user_id: userId,
        proveedor_id,
        numero_factura: numero_factura?.trim() || null,
        fecha_factura,
        fecha_carga,
        monto_sin_iva: monto_sin_iva || null,
        monto_total,
        descripcion: descripcion?.trim() || null,
        movimiento_id: null,
        created_by_id: currentUserId,
        activo: true
      })
      .select('*, proveedor:caja_proveedores(id, razon_social, cuit)')
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe una factura con ese número para este proveedor')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error creating factura:', error)
    return { data: null, error }
  }
}

/**
 * Crear factura con egreso en caja (atómica via RPC)
 * La categoría "Pago proveedor" se asigna automáticamente en la RPC.
 * @param {object} data - Datos de la factura + método de pago
 */
export async function createFacturaConEgreso({ proveedor_id, numero_factura, fecha_factura, fecha_carga, monto_sin_iva, monto_total, descripcion, metodo_pago_id }) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id

    const { data, error } = await supabase
      .rpc('caja_registrar_factura_con_egreso', {
        p_user_id: userId,
        p_proveedor_id: proveedor_id,
        p_numero_factura: numero_factura?.trim() || null,
        p_fecha_factura: fecha_factura,
        p_fecha_carga: fecha_carga,
        p_monto_sin_iva: monto_sin_iva || null,
        p_monto_total: monto_total,
        p_descripcion: descripcion?.trim() || null,
        p_metodo_pago_id: metodo_pago_id,
        p_created_by_id: currentUserId
      })

    if (error) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        throw new Error('Ya existe una factura con ese número para este proveedor')
      }
      throw error
    }
    return { data, error: null }
  } catch (error) {
    console.error('Error creating factura con egreso:', error)
    return { data: null, error }
  }
}

/**
 * Desactivar una factura (soft delete)
 * @param {string} id - ID de la factura
 */
export async function deleteFactura(id) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .from('caja_facturas_compra')
      .update({ activo: false })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error deleting factura:', error)
    return { data: null, error }
  }
}

/**
 * Obtener reporte de compras por proveedor
 * @param {string} fechaDesde - Fecha desde (YYYY-MM-DD)
 * @param {string} fechaHasta - Fecha hasta (YYYY-MM-DD)
 */
export async function getReporteComprasPorProveedor(fechaDesde, fechaHasta) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_reporte_compras_por_proveedor', {
        p_user_id: userId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching reporte compras:', error)
    return { data: null, error }
  }
}

/**
 * Obtener detalle de facturas de un proveedor en un período
 * @param {string} proveedorId - ID del proveedor
 * @param {string} fechaDesde - Fecha desde (YYYY-MM-DD)
 * @param {string} fechaHasta - Fecha hasta (YYYY-MM-DD)
 */
export async function getDetalleFacturasProveedor(proveedorId, fechaDesde, fechaHasta) {
  try {
    const { userId, error: userError } = await getEffectiveUserId()
    if (userError || !userId) throw userError || new Error('Usuario no autenticado')

    const { data, error } = await supabase
      .rpc('caja_detalle_facturas_proveedor', {
        p_user_id: userId,
        p_proveedor_id: proveedorId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching detalle facturas proveedor:', error)
    return { data: null, error }
  }
}
