import { useState, useEffect } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { ROLES_EDITORES } from '../utils/permisos'

/**
 * Hook para verificar si el usuario puede editar contenido educativo
 */
export function useCanEditEducacion() {
  const { user } = useAuth()
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [roleName, setRoleName] = useState(null)

  useEffect(() => {
    const checkPermiso = async () => {
      if (!user?.id) {
        setCanEdit(false)
        setLoading(false)
        return
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('roles(name)')
          .eq('id', user.id)
          .single()

        if (error) throw error

        const rol = profile?.roles?.name
        console.log('useCanEditEducacion - Rol detectado:', rol, '| Puede editar:', ROLES_EDITORES.includes(rol))
        setRoleName(rol)
        setCanEdit(ROLES_EDITORES.includes(rol))
      } catch (err) {
        console.error('Error verificando permisos:', err)
        setCanEdit(false)
      } finally {
        setLoading(false)
      }
    }

    checkPermiso()
  }, [user?.id])

  return {
    canEdit,
    loading,
    cargando: loading,
    roleName
  }
}
