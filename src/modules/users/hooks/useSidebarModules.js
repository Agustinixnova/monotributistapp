import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../auth/hooks/useAuth'

// Roles con acceso total (ven todos los módulos)
const FULL_ACCESS_ROLES = ['admin', 'desarrollo', 'contadora_principal', 'comunicadora']

/**
 * Hook para obtener los módulos del sidebar del usuario actual
 * - Usuarios con roles de acceso total ven TODOS los módulos
 * - Otros usuarios: módulos por defecto del rol + accesos adicionales
 */
export function useSidebarModules() {
  const { user } = useAuth()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUserModules = useCallback(async () => {
    if (!user) {
      setModules([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. Obtener el perfil del usuario con su rol
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const roleName = profile.roles?.name

      // 2. Si tiene rol de acceso total, obtener TODOS los módulos activos
      if (FULL_ACCESS_ROLES.includes(roleName)) {
        const { data: allModules, error: allModulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true })

        if (allModulesError) throw allModulesError
        setModules(allModules || [])
        return
      }

      // 3. Para otros roles: obtener módulos por defecto del rol
      const { data: roleModules, error: roleModulesError } = await supabase
        .from('role_default_modules')
        .select('module_id')
        .eq('role_id', profile.role_id)

      if (roleModulesError) throw roleModulesError

      // 4. Obtener accesos adicionales del usuario
      const { data: userModules, error: userModulesError } = await supabase
        .from('user_module_access')
        .select('module_id')
        .eq('user_id', user.id)

      if (userModulesError) throw userModulesError

      // 5. Combinar IDs de módulos (sin duplicados)
      const roleModuleIds = roleModules?.map(rm => rm.module_id) || []
      const userModuleIds = userModules?.map(um => um.module_id) || []
      const allModuleIds = [...new Set([...roleModuleIds, ...userModuleIds])]

      if (allModuleIds.length === 0) {
        setModules([])
        setLoading(false)
        return
      }

      // 6. Obtener detalles de los módulos
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .in('id', allModuleIds)
        .eq('is_active', true)
        .order('order', { ascending: true })

      if (modulesError) throw modulesError

      setModules(modulesData || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching sidebar modules:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUserModules()
  }, [fetchUserModules])

  /**
   * Verifica si el usuario tiene acceso a un módulo por slug
   * @param {string} slug - Slug del módulo
   */
  const hasAccessToModule = (slug) => {
    return modules.some(m => m.slug === slug)
  }

  /**
   * Obtiene un módulo por slug
   * @param {string} slug - Slug del módulo
   */
  const getModuleBySlug = (slug) => {
    return modules.find(m => m.slug === slug)
  }

  return {
    modules,
    loading,
    error,
    refetch: fetchUserModules,
    hasAccessToModule,
    getModuleBySlug
  }
}
