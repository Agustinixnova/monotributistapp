/**
 * Hook para obtener indicadores economicos (UVA, riesgo pais, tasas)
 */

import { useState, useEffect, useCallback } from 'react'
import { getUVA, getRiesgoPais, getTasasPlazoFijo } from '../services/argentinaDatosService'
import { getFromCache, setInCache } from '../services/cacheService'

const CACHE_TTL_UVA = 60 * 60 * 1000 // 1 hora
const CACHE_TTL_RIESGO = 30 * 60 * 1000 // 30 minutos
const CACHE_TTL_TASAS = 60 * 60 * 1000 // 1 hora

/**
 * Hook para manejar indicadores economicos
 * @returns {Object} Indicadores y estado
 */
export function useIndicadores() {
  const [uva, setUva] = useState(null)
  const [riesgoPais, setRiesgoPais] = useState(null)
  const [tasas, setTasas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchIndicadores = useCallback(async () => {
    // Intentar cache
    const cachedUva = getFromCache('uva')
    const cachedRiesgo = getFromCache('riesgo_pais')
    const cachedTasas = getFromCache('tasas_plazo_fijo')

    let necesitaFetch = false

    if (cachedUva) {
      setUva(cachedUva.data)
    } else {
      necesitaFetch = true
    }

    if (cachedRiesgo) {
      setRiesgoPais(cachedRiesgo.data)
    } else {
      necesitaFetch = true
    }

    if (cachedTasas) {
      setTasas(cachedTasas.data)
    } else {
      necesitaFetch = true
    }

    if (!necesitaFetch) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = await Promise.allSettled([
        !cachedUva ? getUVA() : Promise.resolve(cachedUva.data),
        !cachedRiesgo ? getRiesgoPais() : Promise.resolve(cachedRiesgo.data),
        !cachedTasas ? getTasasPlazoFijo() : Promise.resolve(cachedTasas.data),
      ])

      // Procesar UVA
      if (results[0].status === 'fulfilled') {
        const uvaData = results[0].value
        // Si es array, tomar el ultimo valor
        const ultimoUva = Array.isArray(uvaData) ? uvaData[uvaData.length - 1] : uvaData
        setUva(ultimoUva)
        if (!cachedUva) setInCache('uva', ultimoUva, CACHE_TTL_UVA)
      }

      // Procesar Riesgo Pais
      if (results[1].status === 'fulfilled') {
        setRiesgoPais(results[1].value)
        if (!cachedRiesgo) setInCache('riesgo_pais', results[1].value, CACHE_TTL_RIESGO)
      }

      // Procesar Tasas - convertir decimal a porcentaje y normalizar estructura
      if (results[2].status === 'fulfilled') {
        const tasasData = results[2].value
        // La API devuelve { entidad, tnaClientes, tnaNoClientes, fecha }
        // Normalizamos a { entidad, tna, fecha } y convertimos decimal a porcentaje
        const tasasNormalizadas = Array.isArray(tasasData)
          ? tasasData.map(t => ({
              entidad: t.entidad,
              tna: t.tnaClientes ? t.tnaClientes * 100 : null, // 0.35 -> 35
              fecha: t.fecha
            }))
          : []
        setTasas(tasasNormalizadas)
        if (!cachedTasas) setInCache('tasas_plazo_fijo', tasasNormalizadas, CACHE_TTL_TASAS)
      }

      // Verificar si hubo errores
      const errores = results.filter(r => r.status === 'rejected')
      if (errores.length === results.length) {
        throw new Error('Error cargando todos los indicadores')
      }
    } catch (err) {
      console.error('Error fetching indicadores:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIndicadores()
  }, [fetchIndicadores])

  // Obtener tasa del Banco Nacion (o la primera disponible)
  const tasaBancoNacion = tasas.find(t =>
    t.entidad?.toLowerCase().includes('nacion')
  ) || tasas[0]

  return {
    uva,
    riesgoPais,
    tasas,
    tasaBancoNacion,
    loading,
    error,
    recargar: fetchIndicadores
  }
}
