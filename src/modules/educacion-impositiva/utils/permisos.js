/**
 * Roles que pueden editar contenido educativo
 */
export const ROLES_EDITORES = [
  'admin',
  'contadora_principal',
  'comunicadora',
  'desarrollo'
]

/**
 * Verificar si un rol puede editar
 */
export function puedeEditar(roleName) {
  return ROLES_EDITORES.includes(roleName)
}

/**
 * Verificar si el usuario puede editar basado en su profile
 */
export function usuarioPuedeEditar(profile) {
  if (!profile?.roles?.name) return false
  return puedeEditar(profile.roles.name)
}
