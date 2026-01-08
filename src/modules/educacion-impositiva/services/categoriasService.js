import { supabase } from '../../../lib/supabase'

/**
 * Obtener todas las categorias activas
 */
export async function getCategorias(incluirInactivas = false) {
  let query = supabase
    .from('educacion_categorias')
    .select('*')
    .order('orden', { ascending: true })

  if (!incluirInactivas) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Obtener una categoria por ID
 */
export async function getCategoriaById(id) {
  const { data, error } = await supabase
    .from('educacion_categorias')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Crear nueva categoria
 */
export async function crearCategoria({ nombre, descripcion, icono = 'BookOpen', color = 'violet' }) {
  // Obtener el orden maximo actual
  const { data: maxOrden } = await supabase
    .from('educacion_categorias')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  const nuevoOrden = (maxOrden?.orden || 0) + 1

  const { data, error } = await supabase
    .from('educacion_categorias')
    .insert({
      nombre,
      descripcion,
      icono,
      color,
      orden: nuevoOrden
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar categoria
 */
export async function actualizarCategoria(id, { nombre, descripcion, icono, color, is_active }) {
  const updateData = {}

  if (nombre !== undefined) updateData.nombre = nombre
  if (descripcion !== undefined) updateData.descripcion = descripcion
  if (icono !== undefined) updateData.icono = icono
  if (color !== undefined) updateData.color = color
  if (is_active !== undefined) updateData.is_active = is_active

  const { data, error } = await supabase
    .from('educacion_categorias')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar categoria (soft delete - desactivar)
 */
export async function eliminarCategoria(id) {
  const { data, error } = await supabase
    .from('educacion_categorias')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar categoria permanentemente
 */
export async function eliminarCategoriaPermanente(id) {
  const { error } = await supabase
    .from('educacion_categorias')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Reordenar categorias
 */
export async function reordenarCategorias(ordenamientos) {
  // ordenamientos es un array de { id, orden }
  const promises = ordenamientos.map(({ id, orden }) =>
    supabase
      .from('educacion_categorias')
      .update({ orden })
      .eq('id', id)
  )

  const results = await Promise.all(promises)
  const errors = results.filter(r => r.error)

  if (errors.length > 0) {
    throw errors[0].error
  }

  return true
}

/**
 * Obtener categorias con conteo de articulos
 */
export async function getCategoriasConConteo() {
  const { data: categorias, error: catError } = await supabase
    .from('educacion_categorias')
    .select('*')
    .eq('is_active', true)
    .order('orden', { ascending: true })

  if (catError) throw catError

  // Obtener conteo de articulos por categoria
  const { data: articulos, error: artError } = await supabase
    .from('educacion_articulos')
    .select('categoria_id')
    .eq('estado', 'publicado')

  if (artError) throw artError

  // Calcular conteos
  const conteos = {}
  articulos?.forEach(a => {
    if (a.categoria_id) {
      conteos[a.categoria_id] = (conteos[a.categoria_id] || 0) + 1
    }
  })

  // Agregar conteo a cada categoria
  return categorias.map(cat => ({
    ...cat,
    articulosCount: conteos[cat.id] || 0
  }))
}
