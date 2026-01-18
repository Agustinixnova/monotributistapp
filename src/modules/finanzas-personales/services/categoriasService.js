/**
 * Servicio para gestion de categorias
 */

import { supabase } from '../../../lib/supabase'

/**
 * Obtener todas las categorias disponibles para el usuario
 * (sistema + personalizadas propias)
 * @returns {Promise<Array>} Lista de categorias
 */
export async function getCategorias() {
  const { data, error } = await supabase
    .from('fp_categorias')
    .select('*')
    .eq('is_active', true)
    .order('es_sistema', { ascending: false }) // Sistema primero
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Obtener solo categorias del sistema
 * @returns {Promise<Array>} Lista de categorias del sistema
 */
export async function getCategoriasSistema() {
  const { data, error } = await supabase
    .from('fp_categorias')
    .select('*')
    .eq('es_sistema', true)
    .eq('is_active', true)
    .order('orden', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Obtener categorias personalizadas del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de categorias personalizadas
 */
export async function getCategoriasPersonalizadas(userId) {
  const { data, error } = await supabase
    .from('fp_categorias')
    .select('*')
    .eq('user_id', userId)
    .eq('es_sistema', false)
    .eq('is_active', true)
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Crear una categoria personalizada
 * @param {Object} categoria - Datos de la categoria
 * @returns {Promise<Object>} Categoria creada
 */
export async function crearCategoria(categoria) {
  const { data, error } = await supabase
    .from('fp_categorias')
    .insert({
      user_id: categoria.userId,
      nombre: categoria.nombre,
      emoji: categoria.emoji || null,
      color: categoria.color || 'gray',
      es_sistema: false,
      orden: 99 // Personalizadas al final
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualizar una categoria personalizada
 * @param {string} id - ID de la categoria
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Categoria actualizada
 */
export async function actualizarCategoria(id, datos) {
  const updateData = {}
  if (datos.nombre !== undefined) updateData.nombre = datos.nombre
  if (datos.emoji !== undefined) updateData.emoji = datos.emoji
  if (datos.color !== undefined) updateData.color = datos.color

  const { data, error } = await supabase
    .from('fp_categorias')
    .update(updateData)
    .eq('id', id)
    .eq('es_sistema', false) // Solo se pueden editar personalizadas
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Eliminar (soft delete) una categoria personalizada
 * @param {string} id - ID de la categoria
 * @returns {Promise<void>}
 */
export async function eliminarCategoria(id) {
  const { error } = await supabase
    .from('fp_categorias')
    .update({ is_active: false })
    .eq('id', id)
    .eq('es_sistema', false) // Solo se pueden eliminar personalizadas

  if (error) throw error
}
