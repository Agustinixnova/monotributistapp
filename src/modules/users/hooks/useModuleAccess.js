import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

/**
 * Hook para gestión de acceso a módulos de un usuario
 * @param {string} userId - UUID del usuario
 */
export function useModuleAccess(userId) {
  const [moduleAccess, setModuleAccess] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchModuleAccess = useCallback(async () => {
    if (!userId) {
      setModuleAccess([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('user_module_access')
        .select(`
          *,
          module:modules(*)
        `)
        .eq('user_id', userId)

      if (fetchError) throw fetchError
      setModuleAccess(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchModuleAccess()
  }, [fetchModuleAccess])

  /**
   * Otorga acceso a un módulo
   * @param {string} moduleId - UUID del módulo
   */
  const grantAccess = async (moduleId) => {
    try {
      setLoading(true)
      setError(null)

      const { error: insertError } = await supabase
        .from('user_module_access')
        .insert({
          user_id: userId,
          module_id: moduleId
        })

      if (insertError) throw insertError
      await fetchModuleAccess()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Revoca acceso a un módulo
   * @param {string} moduleId - UUID del módulo
   */
  const revokeAccess = async (moduleId) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('user_module_access')
        .delete()
        .eq('user_id', userId)
        .eq('module_id', moduleId)

      if (deleteError) throw deleteError
      await fetchModuleAccess()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Actualiza todos los accesos de un usuario
   * @param {string[]} moduleIds - Array de UUIDs de módulos
   */
  const updateAccess = async (moduleIds) => {
    try {
      setLoading(true)
      setError(null)

      // Eliminar accesos actuales
      const { error: deleteError } = await supabase
        .from('user_module_access')
        .delete()
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // Insertar nuevos accesos
      if (moduleIds.length > 0) {
        const newAccess = moduleIds.map(moduleId => ({
          user_id: userId,
          module_id: moduleId
        }))

        const { error: insertError } = await supabase
          .from('user_module_access')
          .insert(newAccess)

        if (insertError) throw insertError
      }

      await fetchModuleAccess()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verifica si el usuario tiene acceso a un módulo
   * @param {string} moduleSlug - Slug del módulo
   */
  const hasAccess = (moduleSlug) => {
    return moduleAccess.some(access => access.module?.slug === moduleSlug)
  }

  return {
    moduleAccess,
    loading,
    error,
    refetch: fetchModuleAccess,
    grantAccess,
    revokeAccess,
    updateAccess,
    hasAccess
  }
}
