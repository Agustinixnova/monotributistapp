/**
 * Hook para obtener datos de inflacion
 */

import { useState, useEffect, useCallback } from 'react'
import { getInflacionMensual, getInflacionInteranual } from '../services/argentinaDatosService'
import { getFromCache, setInCache } from '../services/cacheService'
import {
  getUltimaInflacion,
  getInflacionMesAnterior,
  getUltimaInflacionInteranual,
  calcularInflacionAcumulada
} from '../utils/calculosIPC'

const CACHE_TTL = 60 * 60 * 1000 // 1 hora (la inflacion no cambia tan seguido)

/**
 * Hook para manejar datos de inflacion
 * @returns {Object} Datos de inflacion y utilidades
 */
export function useInflacion() {
  const [inflacionMensual, setInflacionMensual] = useState([])
  const [inflacionInteranual, setInflacionInteranual] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchInflacion = useCallback(async () => {
    // Intentar cache
    const cachedMensual = getFromCache('inflacion_mensual')
    const cachedInteranual = getFromCache('inflacion_interanual')

    if (cachedMensual && cachedInteranual) {
      setInflacionMensual(cachedMensual.data)
      setInflacionInteranual(cachedInteranual.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [mensual, interanual] = await Promise.all([
        getInflacionMensual(),
        getInflacionInteranual(),
      ])

      setInflacionMensual(mensual)
      setInflacionInteranual(interanual)

      setInCache('inflacion_mensual', mensual, CACHE_TTL)
      setInCache('inflacion_interanual', interanual, CACHE_TTL)
    } catch (err) {
      console.error('Error fetching inflacion:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInflacion()
  }, [fetchInflacion])

  // Datos calculados
  const ultimaInflacion = getUltimaInflacion(inflacionMensual)
  const inflacionMesAnterior = getInflacionMesAnterior(inflacionMensual)
  const ultimaInteranual = getUltimaInflacionInteranual(inflacionInteranual)

  // Funcion helper para calcular inflacion acumulada
  const getInflacionAcumulada = useCallback((fechaDesde, fechaHasta) => {
    return calcularInflacionAcumulada(inflacionMensual, fechaDesde, fechaHasta)
  }, [inflacionMensual])

  return {
    inflacionMensual,
    inflacionInteranual,
    loading,
    error,
    // Helpers
    ultimaInflacion,
    inflacionMesAnterior,
    ultimaInteranual,
    getInflacionAcumulada,
    recargar: fetchInflacion
  }
}
