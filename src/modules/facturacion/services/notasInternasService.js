import { supabase } from '../../../lib/supabase'

/**
 * Obtener notas de un cliente
 */
export async function getNotasCliente(clientId) {
  const { data, error } = await supabase
    .rpc('get_notas_cliente', { p_client_id: clientId })

  if (error) throw error
  return data || []
}

/**
 * Obtener notas de un mes específico
 */
export async function getNotasMes(clientId, anio, mes) {
  const { data, error } = await supabase
    .from('client_notas_internas')
    .select(`
      *,
      created_by_profile:profiles!created_by(full_name)
    `)
    .eq('client_id', clientId)
    .eq('anio', anio)
    .eq('mes', mes)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Crear una nota
 */
export async function createNota(data) {
  const { data: result, error } = await supabase
    .from('client_notas_internas')
    .insert({
      client_id: data.clientId,
      tipo: data.tipo || 'general',
      contenido: data.contenido,
      anio: data.anio || null,
      mes: data.mes || null,
      fecha_recordatorio: data.fechaRecordatorio || null,
      created_by: data.userId
    })
    .select()
    .single()

  if (error) throw error
  return result
}

/**
 * Actualizar una nota
 */
export async function updateNota(id, data) {
  const { data: result, error } = await supabase
    .from('client_notas_internas')
    .update({
      contenido: data.contenido,
      tipo: data.tipo,
      fecha_recordatorio: data.fechaRecordatorio,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

/**
 * Archivar una nota (soft delete)
 */
export async function archivarNota(id) {
  const { error } = await supabase
    .from('client_notas_internas')
    .update({
      archived: true,
      archived_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Marcar recordatorio como completado
 */
export async function completarRecordatorio(id) {
  const { error } = await supabase
    .from('client_notas_internas')
    .update({
      recordatorio_completado: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Obtener recordatorios pendientes
 */
export async function getRecordatoriosPendientes() {
  const { data, error } = await supabase
    .rpc('get_recordatorios_pendientes')

  if (error) throw error
  return data || []
}
