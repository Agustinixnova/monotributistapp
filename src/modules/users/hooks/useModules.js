import { useState, useEffect, useCallback } from 'react'
import { getModules, getAllModules, syncModulesFromSidebar } from '../services/moduleService'

/**
 * Hook para gestión de módulos
 * @param {boolean} includeInactive - Incluir módulos inactivos
 */
export function useModules(includeInactive = false) {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = includeInactive ? await getAllModules() : await getModules()
      setModules(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [includeInactive])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  const handleSyncFromSidebar = async (menuItems) => {
    try {
      setLoading(true)
      setError(null)
      await syncModulesFromSidebar(menuItems)
      await fetchModules()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    modules,
    loading,
    error,
    refetch: fetchModules,
    syncFromSidebar: handleSyncFromSidebar
  }
}
