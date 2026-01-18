/**
 * Hook para obtener historico del dolar para graficos
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getHistoricoDolarUltimosDias } from '../services/argentinaDatosService'
import { getFromCache, setInCache } from '../services/cacheService'

const CACHE_TTL = 30 * 60 * 1000 // 30 minutos

/**
 * Hook para manejar historico del dolar
 * @param {string} casa - Tipo de dolar (blue, oficial, etc)
 * @param {number} dias - Cantidad de dias a mostrar
 * @returns {Object} Historico y estadisticas
 */
export function useHistoricoDolar(casa = 'blue', dias = 30) {
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cacheKey = `historico_${casa}_${dias}`

  const fetchHistorico = useCallback(async () => {
    // Intentar cache
    const cached = getFromCache(cacheKey)
    if (cached) {
      setHistorico(cached.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getHistoricoDolarUltimosDias(casa, dias)
      setHistorico(data)
      setInCache(cacheKey, data, CACHE_TTL)
    } catch (err) {
      console.error('Error fetching historico:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [casa, dias, cacheKey])

  useEffect(() => {
    fetchHistorico()
  }, [fetchHistorico])

  // Estadisticas calculadas
  const estadisticas = useMemo(() => {
    if (!historico || historico.length === 0) {
      return { minimo: null, maximo: null, promedio: null, variacion: null }
    }

    const valores = historico.map(h => h.venta || h.compra).filter(v => v)

    if (valores.length === 0) {
      return { minimo: null, maximo: null, promedio: null, variacion: null }
    }

    const minimo = Math.min(...valores)
    const maximo = Math.max(...valores)
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length

    // Encontrar fecha del minimo y maximo
    const itemMinimo = historico.find(h => (h.venta || h.compra) === minimo)
    const itemMaximo = historico.find(h => (h.venta || h.compra) === maximo)

    // Variacion desde el primer dia
    const primerValor = valores[0]
    const ultimoValor = valores[valores.length - 1]
    const variacion = primerValor ? ((ultimoValor - primerValor) / primerValor) * 100 : 0

    return {
      minimo: { valor: minimo, fecha: itemMinimo?.fecha },
      maximo: { valor: maximo, fecha: itemMaximo?.fecha },
      promedio,
      variacion,
      primerValor,
      ultimoValor
    }
  }, [historico])

  // Datos formateados para Recharts
  const datosGrafico = useMemo(() => {
    return historico.map(h => ({
      fecha: h.fecha,
      // Formatear fecha para el eje X
      fechaCorta: new Date(h.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short'
      }),
      venta: h.venta,
      compra: h.compra
    }))
  }, [historico])

  return {
    historico,
    datosGrafico,
    estadisticas,
    loading,
    error,
    recargar: fetchHistorico
  }
}
