import { supabase } from '../../../lib/supabase'

/**
 * Servicio para gestión de módulos
 */

/**
 * Obtiene todos los módulos activos
 */
export async function getModules() {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Obtiene todos los módulos (incluyendo inactivos)
 */
export async function getAllModules() {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Obtiene un módulo por ID
 * @param {string} id - UUID del módulo
 */
export async function getModuleById(id) {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene módulos por slug
 * @param {string[]} slugs - Array de slugs
 */
export async function getModulesBySlugs(slugs) {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .in('slug', slugs)
    .order('order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Sincroniza los módulos del sidebar con la base de datos
 * @param {Object[]} menuItems - Items del menú del sidebar
 */
export async function syncModulesFromSidebar(menuItems) {
  const modules = menuItems.map((item, index) => ({
    name: item.label,
    slug: item.path.replace('/', '') || 'dashboard',
    icon: item.iconName,
    route: item.path,
    order: index + 1,
    is_active: true
  }))

  // Upsert basado en slug
  for (const module of modules) {
    const { error } = await supabase
      .from('modules')
      .upsert(module, { onConflict: 'slug' })

    if (error) throw error
  }

  return true
}

/**
 * Crea un nuevo módulo
 * @param {Object} moduleData
 */
export async function createModule(moduleData) {
  const { name, slug, description, icon, route, parentId, order } = moduleData

  const { data, error } = await supabase
    .from('modules')
    .insert({
      name,
      slug,
      description,
      icon,
      route,
      parent_id: parentId || null,
      order: order || 0,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualiza un módulo
 * @param {string} id - UUID del módulo
 * @param {Object} moduleData
 */
export async function updateModule(id, moduleData) {
  const { name, description, icon, route, parentId, order, isActive } = moduleData

  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (icon !== undefined) updateData.icon = icon
  if (route !== undefined) updateData.route = route
  if (parentId !== undefined) updateData.parent_id = parentId
  if (order !== undefined) updateData.order = order
  if (isActive !== undefined) updateData.is_active = isActive

  const { data, error } = await supabase
    .from('modules')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Elimina un módulo
 * @param {string} id - UUID del módulo
 */
export async function deleteModule(id) {
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
