import { useState, useEffect, useCallback } from 'react'
import { escalasService } from '../services/escalasService'
import { ALERTAS_DEFAULTS } from '../utils/escalasUtils'

/**
 * Hook para gestionar la configuracion de alertas
 */
export function useAlertasConfig() {
  const [config, setConfig] = useState(ALERTAS_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Cargar configuracion
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await escalasService.getAlertasConfig()
      if (data) {
        setConfig(data)
      }
    } catch (err) {
      console.error('Error fetching alertas config:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar configuracion
  const updateConfig = useCallback(async (newConfig) => {
    try {
      setSaving(true)
      setError(null)
      const updated = await escalasService.updateAlertasConfig(newConfig)
      setConfig(updated)
      return updated
    } catch (err) {
      console.error('Error updating alertas config:', err)
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    loading,
    error,
    saving,
    fetchConfig,
    updateConfig
  }
}

export default useAlertasConfig
