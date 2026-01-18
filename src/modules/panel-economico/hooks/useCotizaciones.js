/**
 * Hook para obtener cotizaciones de monedas
 */

import { useState, useEffect, useCallback } from 'react'
import { getCotizaciones } from '../services/dolarApiService'
import {
  getFromCache,
  setInCache,
  guardarValorAnterior,
  getValorAnterior
} from '../services/cacheService'

const CACHE_KEY = 'cotizaciones'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
const REFRESH_COOLDOWN = 30 * 1000 // 30 segundos entre refreshs manuales

/**
 * Hook para manejar cotizaciones de monedas
 * @returns {Object} { cotizaciones, loading, error, lastUpdate, refresh, canRefresh }
 */
export function useCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState(null)
  const [variaciones, setVariaciones] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(0)

  // Calcular variaciones respecto al dia anterior
  const calcularVariaciones = (data) => {
    const nuevasVariaciones = {}

    Object.keys(data).forEach(key => {
      const cotizacion = data[key]
      if (!cotizacion) return

      const valorAnterior = getValorAnterior(key)
      const valorActual = cotizacion.venta || cotizacion.compra

      if (valorAnterior && valorActual) {
        const diferencia = valorActual - valorAnterior
        const porcentaje = (diferencia / valorAnterior) * 100

        nuevasVariaciones[key] = {
          valorAnterior,
          diferencia,
          porcentaje,
          direccion: porcentaje > 0 ? 'sube' : porcentaje < 0 ? 'baja' : 'igual'
        }
      }

      // Guardar valor actual para comparacion futura
      if (valorActual) {
        guardarValorAnterior(key, valorActual)
      }
    })

    return nuevasVariaciones
  }

  // Fetch de cotizaciones
  const fetchCotizaciones = useCallback(async (forceRefresh = false) => {
    // Si no es forzado, intentar cache
    if (!forceRefresh) {
      const cached = getFromCache(CACHE_KEY)
      if (cached) {
        setCotizaciones(cached.data)
        setVariaciones(calcularVariaciones(cached.data))
        setLastUpdate(new Date(cached.timestamp))
        setLoading(false)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getCotizaciones()
      setCotizaciones(data)
      setVariaciones(calcularVariaciones(data))
      setLastUpdate(new Date())
      setLastRefresh(Date.now())

      setInCache(CACHE_KEY, data, CACHE_TTL)
    } catch (err) {
      console.error('Error fetching cotizaciones:', err)
      setError(err.message)

      // Si hay error, intentar usar cache aunque este expirado
      const cached = getFromCache(CACHE_KEY)
      if (cached) {
        setCotizaciones(cached.data)
        setVariaciones(calcularVariaciones(cached.data))
        setLastUpdate(new Date(cached.timestamp))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar al montar
  useEffect(() => {
    fetchCotizaciones()
  }, [fetchCotizaciones])

  // Verificar si puede hacer refresh (cooldown de 30s)
  const canRefresh = Date.now() - lastRefresh > REFRESH_COOLDOWN

  // Funcion de refresh manual
  const refresh = useCallback(() => {
    if (!canRefresh) return false
    fetchCotizaciones(true)
    return true
  }, [canRefresh, fetchCotizaciones])

  // Tiempo restante para poder hacer refresh
  const cooldownRestante = Math.max(0, REFRESH_COOLDOWN - (Date.now() - lastRefresh))

  return {
    cotizaciones,
    variaciones,
    loading,
    error,
    lastUpdate,
    refresh,
    canRefresh,
    cooldownRestante
  }
}
