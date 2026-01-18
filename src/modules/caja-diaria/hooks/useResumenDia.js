/**
 * Hook para obtener resumen del día
 */

import { useState, useEffect } from 'react'
import { getResumenDia, getTotalesPorMetodo } from '../services/movimientosService'
import { getFechaHoy } from '../utils/formatters'

export function useResumenDia(fecha = null) {
  const [resumen, setResumen] = useState(null)
  const [totalesPorMetodo, setTotalesPorMetodo] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fechaActual = fecha || getFechaHoy()

  // Cargar resumen
  const fetchResumen = async () => {
    setLoading(true)
    setError(null)

    // Obtener resumen general
    const { data: dataResumen, error: errResumen } = await getResumenDia(fechaActual)

    // Obtener totales por método
    const { data: dataMetodos, error: errMetodos } = await getTotalesPorMetodo(fechaActual)

    if (errResumen || errMetodos) {
      setError(errResumen || errMetodos)
    } else {
      setResumen(dataResumen || {
        total_entradas: 0,
        total_salidas: 0,
        saldo: 0,
        efectivo_entradas: 0,
        efectivo_salidas: 0,
        efectivo_saldo: 0,
        digital_entradas: 0,
        digital_salidas: 0
      })
      setTotalesPorMetodo(dataMetodos || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchResumen()
  }, [fechaActual])

  return {
    resumen,
    totalesPorMetodo,
    loading,
    error,
    refresh: fetchResumen
  }
}
