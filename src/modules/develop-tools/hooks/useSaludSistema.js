/**
 * Hook para gestionar el estado de salud del sistema
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { checkAll } from '../services/saludService'

export function useSaludSistema(autoRefresh = false, intervalo = 60000) {
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const intervalRef = useRef(null)

  const verificar = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const resultado = await checkAll()
      setDatos(resultado)
      setUltimaActualizacion(new Date())
    } catch (err) {
      console.error('Error verificando salud del sistema:', err)
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Verificación inicial
  useEffect(() => {
    verificar()
  }, [verificar])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && intervalo > 0) {
      intervalRef.current = setInterval(verificar, intervalo)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, intervalo, verificar])

  return {
    datos,
    loading,
    error,
    ultimaActualizacion,
    refrescar: verificar
  }
}

export default useSaludSistema
