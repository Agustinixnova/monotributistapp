import { supabase } from '../../../lib/supabase'

/**
 * Obtener historial de categorias de un cliente
 */
export async function getHistorialCategorias(clientId) {
  const { data, error } = await supabase
    .from('client_historial_categorias')
    .select(`
      *,
      created_by_profile:profiles!created_by(full_name)
    `)
    .eq('client_id', clientId)
    .order('fecha_desde', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Agregar entrada al historial
 */
export async function agregarHistorialCategoria(data) {
  const { data: result, error } = await supabase.rpc('agregar_historial_categoria', {
    p_client_id: data.clientId,
    p_categoria: data.categoria,
    p_fecha_desde: data.fechaDesde,
    p_fecha_hasta: data.fechaHasta || null,
    p_motivo: data.motivo || 'recategorizacion_obligatoria',
    p_notas: data.notas || null,
    p_user_id: data.userId
  })

  if (error) throw error
  return result
}

/**
 * Eliminar entrada del historial
 */
export async function eliminarHistorialCategoria(id) {
  const { error } = await supabase
    .from('client_historial_categorias')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Migrar categoria anterior simple a historial completo
 */
export async function migrarCategoriaAnterior(clientId, categoriaAnterior, fechaCambio, userId) {
  // Obtener fecha alta monotributo del cliente
  const { data: cliente } = await supabase
    .from('client_fiscal_data')
    .select('fecha_alta_monotributo, categoria_monotributo')
    .eq('id', clientId)
    .single()

  if (!cliente) return

  const fechaDesde = cliente.fecha_alta_monotributo || '2020-01-01'

  // Crear entrada para categoria anterior
  await agregarHistorialCategoria({
    clientId,
    categoria: categoriaAnterior,
    fechaDesde,
    fechaHasta: fechaCambio,
    motivo: 'migracion_sistema',
    notas: 'Migrado desde datos simples',
    userId
  })

  // Crear entrada para categoria actual
  await agregarHistorialCategoria({
    clientId,
    categoria: cliente.categoria_monotributo,
    fechaDesde: fechaCambio,
    fechaHasta: null,
    motivo: 'recategorizacion_obligatoria',
    userId
  })
}
