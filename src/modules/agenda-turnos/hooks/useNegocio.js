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

  // Helpers para modalidades de trabajo
  const modalidades = negocio?.modalidades_trabajo || ['local']
  const tieneModalidad = useCallback((modalidad) => {
    return modalidades.includes(modalidad)
  }, [modalidades])

  const tieneLocal = tieneModalidad('local')
  const tieneDomicilio = tieneModalidad('domicilio')
  const tieneVideollamada = tieneModalidad('videollamada')

  // Si tiene múltiples modalidades, el turno debe elegir cuál
  const requiereSeleccionModalidad = modalidades.length > 1

  // Modalidad por defecto (la primera configurada)
  const modalidadDefault = modalidades[0] || 'local'

  return {
    negocio,
    loading,
    saving,
    error,
    guardar,
    recargar: cargar,
    // Helpers de modalidades
    modalidades,
    tieneModalidad,
    tieneLocal,
    tieneDomicilio,
    tieneVideollamada,
    requiereSeleccionModalidad,
    modalidadDefault
  }
}

export default useNegocio
