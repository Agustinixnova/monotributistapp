import { supabase } from '../../../lib/supabase'

/**
 * Crear sugerencia de cambio (para el cliente)
 */
export async function crearSugerencia(params) {
  const { data, error } = await supabase.rpc('crear_sugerencia_cambio', {
    p_client_id: params.clientId,
    p_user_id: params.userId,
    p_tabla: params.tabla || 'client_fiscal_data',
    p_campo: params.campo,
    p_campo_label: params.campoLabel || params.campo,
    p_valor_actual: params.valorActual != null ? String(params.valorActual) : null,
    p_valor_sugerido: String(params.valorSugerido),
    p_comentario: params.comentario || null,
    p_registro_id: params.registroId || null,
    p_accion: params.accion || 'modificar'
  })

  if (error) throw error
  return data
}

/**
 * Obtener mis sugerencias (para el cliente)
 */
export async function getMisSugerencias(userId) {
  const { data, error } = await supabase
    .from('client_sugerencias_cambio')
    .select(`
      *,
      revisado_by_profile:profiles!revisado_by(nombre, apellido, email)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Obtener sugerencias pendientes (para contadora)
 * @param {string} contadorId - Si es contador_secundario, filtrar por sus clientes
 */
export async function getSugerenciasPendientes(contadorId = null) {
  let query = supabase
    .from('client_sugerencias_cambio')
    .select(`
      *,
      cliente:client_fiscal_data(
        id, cuit, razon_social,
        user:profiles!user_id(id, nombre, apellido, email, assigned_to)
      )
    `)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  // Si es contador_secundario, filtrar solo sus clientes
  if (contadorId) {
    return (data || []).filter(s =>
      s.cliente?.user?.assigned_to === contadorId
    )
  }

  return data || []
}

/**
 * Procesar sugerencia usando la funcion RPC
 */
export async function procesarSugerencia(sugerenciaId, estado, userId, valorAplicado = null, nota = null) {
  const { data, error } = await supabase.rpc('procesar_sugerencia', {
    p_sugerencia_id: sugerenciaId,
    p_estado: estado,
    p_user_id: userId,
    p_valor_aplicado: valorAplicado,
    p_nota: nota
  })

  if (error) throw error
  return data
}

/**
 * Obtener sugerencias de un cliente especifico
 */
export async function getSugerenciasCliente(clientId, incluirProcesadas = false) {
  let query = supabase
    .from('client_sugerencias_cambio')
    .select(`
      *,
      user:profiles!user_id(nombre, apellido),
      revisado_by_profile:profiles!revisado_by(nombre, apellido)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (!incluirProcesadas) {
    query = query.eq('estado', 'pendiente')
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Aceptar sugerencia y aplicar cambio (metodo directo sin RPC)
 */
export async function aceptarYAplicarSugerencia(sugerencia, userId, valorFinal = null) {
  const valorAplicar = valorFinal || sugerencia.valor_sugerido
  const estado = valorFinal && valorFinal !== sugerencia.valor_sugerido
    ? 'aceptada_modificada'
    : 'aceptada'

  // Usar la funcion RPC para procesar
  return procesarSugerencia(sugerencia.id, estado, userId, valorAplicar, null)
}

/**
 * Rechazar sugerencia
 */
export async function rechazarSugerencia(sugerenciaId, userId, motivo = null) {
  return procesarSugerencia(sugerenciaId, 'rechazada', userId, null, motivo)
}

/**
 * Obtener historial de sugerencias de un cliente
 */
export async function getHistorialSugerencias(clientId) {
  return getSugerenciasCliente(clientId, true)
}

/**
 * Contar sugerencias pendientes totales (para badge en menu)
 */
export async function contarSugerenciasPendientes(contadorId = null) {
  let query = supabase
    .from('client_sugerencias_cambio')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  const { count, error } = await query

  if (error) throw error
  return count || 0
}
