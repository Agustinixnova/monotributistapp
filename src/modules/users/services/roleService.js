import { supabase } from '../../../lib/supabase'

/**
 * Servicio para gestión de roles
 */

/**
 * Obtiene todos los roles con sus módulos por defecto
 */
export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select(`
      *,
      default_modules:role_default_modules(
        module_id,
        module:modules(id, name, slug)
      )
    `)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Obtiene un rol por ID con sus módulos asignados
 * @param {string} id - UUID del rol
 */
export async function getRoleById(id) {
  const { data, error } = await supabase
    .from('roles')
    .select(`
      *,
      default_modules:role_default_modules(
        *,
        module:modules(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Crea un nuevo rol
 * @param {Object} roleData
 * @param {string} roleData.name - Identificador único
 * @param {string} roleData.displayName - Nombre para mostrar
 * @param {string} roleData.description - Descripción
 * @param {string[]} roleData.moduleIds - IDs de módulos a asignar por defecto
 */
export async function createRole(roleData) {
  const { name, displayName, description, moduleIds = [] } = roleData

  // 1. Crear el rol
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .insert({
      name,
      display_name: displayName,
      description,
      is_system: false
    })
    .select()
    .single()

  if (roleError) throw roleError

  // 2. Asignar módulos por defecto
  if (moduleIds.length > 0) {
    const roleModules = moduleIds.map(moduleId => ({
      role_id: role.id,
      module_id: moduleId
    }))

    const { error: modulesError } = await supabase
      .from('role_default_modules')
      .insert(roleModules)

    if (modulesError) throw modulesError
  }

  return role
}

/**
 * Actualiza un rol existente
 * @param {string} id - UUID del rol
 * @param {Object} roleData
 */
export async function updateRole(id, roleData) {
  const { displayName, description, moduleIds } = roleData

  // 1. Actualizar datos del rol
  const updateData = {}
  if (displayName !== undefined) updateData.display_name = displayName
  if (description !== undefined) updateData.description = description

  if (Object.keys(updateData).length > 0) {
    const { error: roleError } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', id)

    if (roleError) throw roleError
  }

  // 2. Si se proporcionan moduleIds, actualizar asignaciones
  if (moduleIds !== undefined) {
    // Eliminar asignaciones actuales
    const { error: deleteError } = await supabase
      .from('role_default_modules')
      .delete()
      .eq('role_id', id)

    if (deleteError) throw deleteError

    // Insertar nuevas asignaciones
    if (moduleIds.length > 0) {
      const roleModules = moduleIds.map(moduleId => ({
        role_id: id,
        module_id: moduleId
      }))

      const { error: insertError } = await supabase
        .from('role_default_modules')
        .insert(roleModules)

      if (insertError) throw insertError
    }
  }

  return getRoleById(id)
}

/**
 * Elimina un rol (solo si no es de sistema)
 * @param {string} id - UUID del rol
 */
export async function deleteRole(id) {
  // Verificar que no sea un rol de sistema
  const { data: role, error: fetchError } = await supabase
    .from('roles')
    .select('is_system')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  if (role.is_system) {
    throw new Error('No se puede eliminar un rol de sistema')
  }

  const { error: deleteError } = await supabase
    .from('roles')
    .delete()
    .eq('id', id)

  if (deleteError) throw deleteError
  return true
}
