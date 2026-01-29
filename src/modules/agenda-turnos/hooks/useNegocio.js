/**
 * Hook para gestionar datos del negocio
 */

import { useState, useEffect, useCallback } from 'react'
import { getNegocio, saveNegocio } from '../services/negocioService'

export function useNegocio() {
  const [negocio, setNegocio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Cargar datos del negocio
  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await getNegocio()
      if (error) throw error
      setNegocio(data)
    } catch (err) {
      console.error('Error cargando negocio:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Guardar datos del negocio
  const guardar = useCallback(async (datos) => {
    setSaving(true)
    setError(null)

    try {
      const { data, error } = await saveNegocio(datos)
      if (error) throw error
      setNegocio(data)
      return { success: true, data }
    } catch (err) {
      console.error('Error guardando negocio:', err)
      setError(err.message)
      return { success: false, error: err }
    } finally {
      setSaving(false)
    }
  }, [])

  // Cargar al montar
  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    negocio,
    loading,
    saving,
    error,
    guardar,
    recargar: cargar
  }
}

export default useNegocio
