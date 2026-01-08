import { supabase } from '../../../lib/supabase'

/**
 * Obtener todos los articulos (publicados para clientes, todos para editores)
 */
export async function getArticulos({ categoriaId = null, soloPublicados = true, busqueda = '' } = {}) {
  let query = supabase
    .from('educacion_articulos')
    .select(`
      *,
      categoria:educacion_categorias(id, nombre, icono, color),
      autor:profiles!creado_por(id, nombre, apellido),
      editor:profiles!actualizado_por(id, nombre, apellido)
    `)
    .order('destacado', { ascending: false })
    .order('orden', { ascending: true })
    .order('created_at', { ascending: false })

  if (soloPublicados) {
    query = query.eq('estado', 'publicado')
  }

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId)
  }

  if (busqueda) {
    query = query.or(`titulo.ilike.%${busqueda}%,resumen.ilike.%${busqueda}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Obtener un articulo por slug
 */
export async function getArticuloBySlug(slug) {
  const { data, error } = await supabase
    .from('educacion_articulos')
    .select(`
      *,
      categoria:educacion_categorias(id, nombre, icono, color),
      autor:profiles!creado_por(id, nombre, apellido),
      editor:profiles!actualizado_por(id, nombre, apellido),
      adjuntos:educacion_adjuntos(*)
    `)
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

/**
 * Obtener un articulo por ID
 */
export async function getArticuloById(id) {
  const { data, error } = await supabase
    .from('educacion_articulos')
    .select(`
      *,
      categoria:educacion_categorias(id, nombre, icono, color),
      autor:profiles!creado_por(id, nombre, apellido),
      editor:profiles!actualizado_por(id, nombre, apellido),
      adjuntos:educacion_adjuntos(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Crear nuevo articulo
 */
export async function crearArticulo({ titulo, resumen, contenido, categoriaId, destacado = false, estado = 'borrador' }, userId) {
  const { data, error } = await supabase
    .from('educacion_articulos')
    .insert({
      titulo,
      resumen,
      contenido,
      categoria_id: categoriaId,
      destacado,
      estado,
      creado_por: userId,
      actualizado_por: userId,
      published_at: estado === 'publicado' ? new Date().toISOString() : null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar articulo
 */
export async function actualizarArticulo(id, { titulo, resumen, contenido, categoriaId, destacado, estado }, userId) {
  // Primero obtener el articulo actual para verificar si es primera publicacion
  const { data: articuloActual } = await supabase
    .from('educacion_articulos')
    .select('estado, published_at')
    .eq('id', id)
    .single()

  const updateData = {
    titulo,
    resumen,
    contenido,
    categoria_id: categoriaId,
    destacado,
    estado,
    actualizado_por: userId
  }

  // Si es primera publicacion, guardar fecha
  if (estado === 'publicado' && articuloActual?.estado !== 'publicado' && !articuloActual?.published_at) {
    updateData.published_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('educacion_articulos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar articulo
 */
export async function eliminarArticulo(id) {
  const { error } = await supabase
    .from('educacion_articulos')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Cambiar estado (publicar/despublicar)
 */
export async function cambiarEstadoArticulo(id, nuevoEstado, userId) {
  const updateData = {
    estado: nuevoEstado,
    actualizado_por: userId
  }

  // Si es primera publicacion, guardar fecha
  if (nuevoEstado === 'publicado') {
    const { data: articuloActual } = await supabase
      .from('educacion_articulos')
      .select('published_at')
      .eq('id', id)
      .single()

    if (!articuloActual?.published_at) {
      updateData.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('educacion_articulos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Marcar/desmarcar como destacado
 */
export async function toggleDestacado(id, destacado, userId) {
  const { data, error } = await supabase
    .from('educacion_articulos')
    .update({
      destacado,
      actualizado_por: userId
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Reordenar articulos
 */
export async function reordenarArticulos(ordenamientos) {
  // ordenamientos es un array de { id, orden }
  const promises = ordenamientos.map(({ id, orden }) =>
    supabase
      .from('educacion_articulos')
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
 * Buscar articulos
 */
export async function buscarArticulos(termino) {
  const { data, error } = await supabase
    .from('educacion_articulos')
    .select(`
      id, titulo, slug, resumen, destacado,
      categoria:educacion_categorias(id, nombre, icono, color)
    `)
    .eq('estado', 'publicado')
    .or(`titulo.ilike.%${termino}%,resumen.ilike.%${termino}%`)
    .order('destacado', { ascending: false })
    .order('orden', { ascending: true })
    .limit(20)

  if (error) throw error
  return data || []
}
