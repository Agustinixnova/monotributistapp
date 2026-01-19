import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../auth/hooks/useAuth'

// Roles con acceso total (ven todos los módulos)
const FULL_ACCESS_ROLES = ['admin', 'desarrollo', 'contadora_principal', 'comunicadora']

// Módulos para usuarios gratuitos (operador_gastos)
const FREE_USER_MODULES = [
  { id: 'dashboard', name: 'Dashboard', slug: 'dashboard', route: '/', icon: 'LayoutDashboard', order: 1, is_active: true },
  { id: 'mis-finanzas', name: 'Mis Finanzas', slug: 'mis-finanzas', route: '/herramientas/mis-finanzas', icon: 'Wallet', order: 2, is_active: true },
  { id: 'panel-economico', name: 'Panel Económico', slug: 'panel-economico', route: '/herramientas/panel-economico', icon: 'TrendingUp', order: 3, is_active: true },
  { id: 'caja-diaria', name: 'Caja Diaria', slug: 'caja-diaria', route: '/herramientas/caja-diaria', icon: 'Wallet2', order: 4, is_active: true },
  { id: 'educacion-impositiva', name: 'Educación Impositiva', slug: 'educacion-impositiva', route: '/educacion', icon: 'GraduationCap', order: 5, is_active: true },
  { id: 'mi-perfil', name: 'Mi Perfil', slug: 'mi-perfil', route: '/mi-perfil', icon: 'UserCircle', order: 6, is_active: true },
]

/**
 * Hook para obtener los módulos del sidebar del usuario actual
 * - Usuarios con roles de acceso total ven TODOS los módulos
 * - Usuarios gratuitos (operador_gastos): ven módulos específicos de free
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

      // 1. Primero verificar si es usuario gratuito (usuarios_free)
      const { data: freeUser, error: freeUserError } = await supabase
        .from('usuarios_free')
        .select('role_id')
        .eq('id', user.id)
        .maybeSingle()

      // Si es usuario gratuito, retornar módulos específicos
      if (freeUser && !freeUserError) {
        setModules(FREE_USER_MODULES)
        setLoading(false)
        return
      }

      // 2. Si no es usuario gratuito, obtener el perfil premium
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) throw profileError
      if (!profile) {
        // Usuario no encontrado en ninguna tabla
        setModules([])
        setLoading(false)
        return
      }

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
