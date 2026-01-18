/**
 * Hook para obtener feriados del año
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getFeriados } from '../services/argentinaDatosService'
import { getFromCache, setInCache } from '../services/cacheService'
import {
  getProximosFeriados,
  calcularVencimientoMonotributo,
  getDiasRestantes
} from '../utils/feriadosUtils'

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas (feriados no cambian)

/**
 * Hook para manejar feriados
 * @returns {Object} Feriados y utilidades
 */
export function useFeriados() {
  const [feriados, setFeriados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFeriados = useCallback(async () => {
    const anioActual = new Date().getFullYear()
    const cacheKey = `feriados_${anioActual}`

    // Intentar cache
    const cached = getFromCache(cacheKey)
    if (cached) {
      setFeriados(cached.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getFeriados(anioActual)
      setFeriados(data)
      setInCache(cacheKey, data, CACHE_TTL)
    } catch (err) {
      console.error('Error fetching feriados:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeriados()
  }, [fetchFeriados])

  // Proximos feriados (memoizado)
  const proximosFeriados = useMemo(() => {
    return getProximosFeriados(feriados, 6)
  }, [feriados])

  // Info del vencimiento del monotributo este mes
  const vencimientoMonotributo = useMemo(() => {
    return calcularVencimientoMonotributo(feriados)
  }, [feriados])

  // Proximo feriado
  const proximoFeriado = proximosFeriados[0] || null

  // Dias hasta el proximo feriado
  const diasHastaProximoFeriado = proximoFeriado
    ? getDiasRestantes(proximoFeriado.fecha)
    : null

  return {
    feriados,
    proximosFeriados,
    proximoFeriado,
    diasHastaProximoFeriado,
    vencimientoMonotributo,
    loading,
    error,
    recargar: fetchFeriados
  }
}
