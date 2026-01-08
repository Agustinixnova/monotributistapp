import { supabase } from '../../../lib/supabase'

/**
 * Obtener grupo familiar de un cliente
 */
export async function getGrupoFamiliar(clientId) {
  const { data, error } = await supabase
    .from('client_grupo_familiar')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at')

  if (error) throw error
  return data || []
}

/**
 * Agregar integrante
 */
export async function agregarIntegrante(clientId, integrante, userId) {
  const { data, error } = await supabase
    .from('client_grupo_familiar')
    .insert({
      client_id: clientId,
      nombre: integrante.nombre,
      dni: integrante.dni,
      fecha_nacimiento: integrante.fechaNacimiento || integrante.fecha_nacimiento,
      parentesco: integrante.parentesco,
      parentesco_otro: integrante.parentescoOtro || integrante.parentesco_otro,
      cuil: integrante.cuil,
      created_by: userId
    })
    .select()
    .single()

  if (error) throw error

  // Auditoria
  await supabase.rpc('registrar_cambio_auditoria', {
    p_client_id: clientId,
    p_tabla: 'client_grupo_familiar',
    p_campo: 'integrante_agregado',
    p_valor_anterior: null,
    p_valor_nuevo: integrante.nombre,
    p_user_id: userId,
    p_motivo: null,
    p_origen: 'manual'
  })

  return data
}

/**
 * Actualizar integrante
 */
export async function actualizarIntegrante(integranteId, integrante, userId, clientId = null) {
  const { data, error } = await supabase
    .from('client_grupo_familiar')
    .update({
      nombre: integrante.nombre,
      dni: integrante.dni,
      fecha_nacimiento: integrante.fechaNacimiento || integrante.fecha_nacimiento,
      parentesco: integrante.parentesco,
      parentesco_otro: integrante.parentescoOtro || integrante.parentesco_otro,
      cuil: integrante.cuil,
      updated_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq('id', integranteId)
    .select()
    .single()

  if (error) throw error

  // Auditoria si tenemos clientId
  if (clientId) {
    await supabase.rpc('registrar_cambio_auditoria', {
      p_client_id: clientId,
      p_tabla: 'client_grupo_familiar',
      p_campo: 'integrante_actualizado',
      p_valor_anterior: null,
      p_valor_nuevo: integrante.nombre,
      p_user_id: userId,
      p_motivo: null,
      p_origen: 'manual'
    })
  }

  return data
}

/**
 * Eliminar integrante
 */
export async function eliminarIntegrante(integranteId, userId, clientId, nombre) {
  const { error } = await supabase
    .from('client_grupo_familiar')
    .delete()
    .eq('id', integranteId)

  if (error) throw error

  // Auditoria
  await supabase.rpc('registrar_cambio_auditoria', {
    p_client_id: clientId,
    p_tabla: 'client_grupo_familiar',
    p_campo: 'integrante_eliminado',
    p_valor_anterior: nombre,
    p_valor_nuevo: null,
    p_user_id: userId,
    p_motivo: null,
    p_origen: 'manual'
  })

  return true
}

/**
 * Guardar grupo familiar completo (reemplaza todos)
 */
export async function guardarGrupoFamiliar(clientId, integrantes, userId) {
  // Eliminar integrantes existentes
  const { error: deleteError } = await supabase
    .from('client_grupo_familiar')
    .delete()
    .eq('client_id', clientId)

  if (deleteError) throw deleteError

  // Si no hay integrantes nuevos, terminar
  if (!integrantes || integrantes.length === 0) {
    return []
  }

  // Insertar nuevos integrantes
  const integrantesData = integrantes.map(i => ({
    client_id: clientId,
    nombre: i.nombre,
    dni: i.dni,
    fecha_nacimiento: i.fechaNacimiento || i.fecha_nacimiento,
    parentesco: i.parentesco,
    parentesco_otro: i.parentescoOtro || i.parentesco_otro,
    cuil: i.cuil,
    created_by: userId
  }))

  const { data, error } = await supabase
    .from('client_grupo_familiar')
    .insert(integrantesData)
    .select()

  if (error) throw error

  return data || []
}
