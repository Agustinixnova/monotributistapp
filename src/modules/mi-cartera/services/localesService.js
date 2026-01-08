import { supabase } from '../../../lib/supabase'

/**
 * Obtener locales de un cliente
 */
export async function getLocalesCliente(clientId) {
  const { data, error } = await supabase
    .from('client_locales')
    .select('*')
    .eq('client_id', clientId)
    .order('orden')

  if (error) throw error
  return data || []
}

/**
 * Agregar local
 */
export async function agregarLocal(clientId, localData, userId) {
  const { data, error } = await supabase
    .from('client_locales')
    .insert({
      client_id: clientId,
      descripcion: localData.descripcion,
      direccion: localData.direccion,
      localidad: localData.localidad,
      provincia: localData.provincia,
      alquiler_mensual: localData.alquiler || localData.alquiler_mensual,
      superficie_m2: localData.superficie || localData.superficie_m2,
      es_propio: localData.esPropio || localData.es_propio || false,
      orden: localData.orden || 0,
      created_by: userId
    })
    .select()
    .single()

  if (error) throw error

  // Registrar en auditoria
  await supabase.rpc('registrar_cambio_auditoria', {
    p_client_id: clientId,
    p_tabla: 'client_locales',
    p_campo: 'local_agregado',
    p_valor_anterior: null,
    p_valor_nuevo: localData.descripcion || 'Nuevo local',
    p_user_id: userId,
    p_motivo: null,
    p_origen: 'manual'
  })

  return data
}

/**
 * Actualizar local
 */
export async function actualizarLocal(localId, localData, userId, clientId) {
  const { data, error } = await supabase
    .from('client_locales')
    .update({
      descripcion: localData.descripcion,
      direccion: localData.direccion,
      localidad: localData.localidad,
      provincia: localData.provincia,
      alquiler_mensual: localData.alquiler || localData.alquiler_mensual,
      superficie_m2: localData.superficie || localData.superficie_m2,
      es_propio: localData.esPropio || localData.es_propio,
      updated_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq('id', localId)
    .select()
    .single()

  if (error) throw error

  // Registrar en auditoria
  if (clientId) {
    await supabase.rpc('registrar_cambio_auditoria', {
      p_client_id: clientId,
      p_tabla: 'client_locales',
      p_campo: 'local_actualizado',
      p_valor_anterior: null,
      p_valor_nuevo: localData.descripcion || 'Local actualizado',
      p_user_id: userId,
      p_motivo: null,
      p_origen: 'manual'
    })
  }

  return data
}

/**
 * Eliminar local
 */
export async function eliminarLocal(localId, userId, clientId, descripcion) {
  const { error } = await supabase
    .from('client_locales')
    .delete()
    .eq('id', localId)

  if (error) throw error

  // Registrar en auditoria
  await supabase.rpc('registrar_cambio_auditoria', {
    p_client_id: clientId,
    p_tabla: 'client_locales',
    p_campo: 'local_eliminado',
    p_valor_anterior: descripcion || 'Local',
    p_valor_nuevo: null,
    p_user_id: userId,
    p_motivo: null,
    p_origen: 'manual'
  })

  return true
}

/**
 * Guardar multiples locales (reemplaza todos)
 */
export async function guardarLocalesCliente(clientId, locales, userId) {
  // Eliminar locales existentes
  const { error: deleteError } = await supabase
    .from('client_locales')
    .delete()
    .eq('client_id', clientId)

  if (deleteError) throw deleteError

  // Si no hay locales nuevos, terminar
  if (!locales || locales.length === 0) {
    return []
  }

  // Insertar nuevos locales
  const localesData = locales.map((local, index) => ({
    client_id: clientId,
    descripcion: local.descripcion,
    direccion: local.direccion,
    localidad: local.localidad,
    provincia: local.provincia,
    alquiler_mensual: local.alquiler || local.alquiler_mensual,
    superficie_m2: local.superficie || local.superficie_m2,
    es_propio: local.esPropio || local.es_propio || false,
    orden: index,
    created_by: userId
  }))

  const { data, error } = await supabase
    .from('client_locales')
    .insert(localesData)
    .select()

  if (error) throw error

  return data || []
}
