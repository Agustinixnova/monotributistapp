import { supabase } from '../lib/supabase'

/**
 * Tipos de cambios para clasificar el historial
 */
export const TIPO_CAMBIO = {
  CATEGORIA: 'categoria',
  TIPO_ACTIVIDAD: 'tipo_actividad',
  REGIMEN_IIBB: 'regimen_iibb',
  PAGO: 'pago',
  DOMICILIO: 'domicilio',
  OBRA_SOCIAL: 'obra_social',
  LOCALES: 'locales',
  GRUPO_FAMILIAR: 'grupo_familiar',
  ARCA: 'arca',
  RELACION_DEPENDENCIA: 'relacion_dependencia',
  EMAIL: 'email',
  TELEFONO: 'telefono',
  PASSWORD: 'password',
  NOMBRE: 'nombre',
  CUIT: 'cuit',
  ESTADO: 'estado',
  CONTADOR_ASIGNADO: 'contador_asignado',
  OTROS: 'otros'
}

/**
 * Registra un cambio en el historial unificado del cliente
 * Inserta en historial_cambios_cliente
 *
 * @param {Object} params - Parametros del cambio
 * @param {string} params.userId - ID del usuario (profiles.id)
 * @param {string} params.clientFiscalDataId - ID del registro fiscal (client_fiscal_data.id)
 * @param {string} params.tipoCambio - Tipo de cambio (usar TIPO_CAMBIO constantes)
 * @param {string} params.campo - Nombre legible del campo modificado
 * @param {string} params.valorAnterior - Valor anterior del campo
 * @param {string} params.valorNuevo - Valor nuevo del campo
 * @param {Object} params.metadata - Metadata adicional (motivo, origen, etc)
 * @param {string} params.realizadoPor - ID del usuario que realiza el cambio
 * @returns {Promise<Object>} - Registro insertado
 */
export async function registrarCambio({
  userId,
  clientFiscalDataId,
  tipoCambio = TIPO_CAMBIO.OTROS,
  campo,
  valorAnterior,
  valorNuevo,
  metadata = {},
  realizadoPor
}) {
  // No registrar si los valores son iguales
  if (valorAnterior === valorNuevo) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('historial_cambios_cliente')
      .insert({
        user_id: userId || null,
        client_fiscal_data_id: clientFiscalDataId || null,
        tipo_cambio: tipoCambio,
        campo: campo,
        valor_anterior: valorAnterior?.toString() || null,
        valor_nuevo: valorNuevo?.toString() || null,
        metadata: metadata,
        realizado_por: realizadoPor
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error registrando cambio en historial:', error)
    throw error
  }
}

/**
 * Obtener historial de cambios de un cliente
 * @param {string} clientFiscalDataId - ID del cliente
 * @param {Object} options - Opciones de filtrado
 * @param {number} options.limit - Limite de registros
 * @param {string} options.tipoCambio - Filtrar por tipo de cambio
 * @returns {Promise<Array>} - Lista de cambios
 */
export async function obtenerHistorialCambios(clientFiscalDataId, options = {}) {
  const { limit = 50, tipoCambio = null } = options

  try {
    // Primero obtenemos el historial
    let query = supabase
      .from('historial_cambios_cliente')
      .select('*')
      .eq('client_fiscal_data_id', clientFiscalDataId)
      .order('created_at', { ascending: false })

    if (tipoCambio) {
      query = query.eq('tipo_cambio', tipoCambio)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    // Obtener IDs únicos de realizadores
    const realizadorIds = [...new Set((data || []).map(item => item.realizado_por).filter(Boolean))]

    // Obtener perfiles de realizadores
    let perfilesMap = {}
    if (realizadorIds.length > 0) {
      const { data: perfiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, email')
        .in('id', realizadorIds)

      perfilesMap = (perfiles || []).reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {})
    }

    // Mapear al formato esperado por el componente
    return (data || []).map(item => {
      const perfil = perfilesMap[item.realizado_por]
      return {
        id: item.id,
        tipo_cambio: item.tipo_cambio,
        campo: item.campo,
        valor_anterior: item.valor_anterior,
        valor_nuevo: item.valor_nuevo,
        realizado_por: item.realizado_por,
        realizado_por_nombre: perfil?.nombre,
        realizado_por_apellido: perfil?.apellido,
        created_at: item.created_at,
        metadata: item.metadata || {}
      }
    })
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    throw error
  }
}

/**
 * Obtener historial de cambios por userId
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de filtrado
 * @returns {Promise<Array>} - Lista de cambios
 */
export async function obtenerHistorialCambiosPorUsuario(userId, options = {}) {
  const { limit = 50, tipoCambio = null } = options

  try {
    let query = supabase
      .from('historial_cambios_cliente')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (tipoCambio) {
      query = query.eq('tipo_cambio', tipoCambio)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    // Obtener IDs únicos de realizadores
    const realizadorIds = [...new Set((data || []).map(item => item.realizado_por).filter(Boolean))]

    // Obtener perfiles de realizadores
    let perfilesMap = {}
    if (realizadorIds.length > 0) {
      const { data: perfiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, email')
        .in('id', realizadorIds)

      perfilesMap = (perfiles || []).reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {})
    }

    return (data || []).map(item => {
      const perfil = perfilesMap[item.realizado_por]
      return {
        id: item.id,
        tipo_cambio: item.tipo_cambio,
        campo: item.campo,
        valor_anterior: item.valor_anterior,
        valor_nuevo: item.valor_nuevo,
        realizado_por: item.realizado_por,
        realizado_por_nombre: perfil?.nombre,
        realizado_por_apellido: perfil?.apellido,
        created_at: item.created_at,
        metadata: item.metadata || {}
      }
    })
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    throw error
  }
}
