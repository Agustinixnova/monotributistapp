/**
 * Hook para gestionar movimientos de caja
 */

import { useState, useEffect } from 'react'
import {
  getMovimientosByFecha,
  createMovimiento,
  anularMovimiento
} from '../services/movimientosService'
import { getFechaHoy } from '../utils/formatters'

export function useMovimientos(fecha = null) {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fechaActual = fecha || getFechaHoy()

  // Cargar movimientos de la fecha
  const fetchMovimientos = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getMovimientosByFecha(fechaActual)

    if (err) {
      setError(err)
    } else {
      setMovimientos(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMovimientos()
  }, [fechaActual])

  // Crear movimiento
  const crear = async (movimientoData) => {
    const { data, error: err } = await createMovimiento({
      ...movimientoData,
      fecha: fechaActual
    })

    if (err) {
      setError(err)
      return { success: false, error: err }
    }

    await fetchMovimientos()
    return { success: true, data }
  }

  // Anular movimiento
  const anular = async (id, motivo = '') => {
    const { data, error: err } = await anularMovimiento(id, motivo)

    if (err) {
      setError(err)
      return { success: false, error: err }
    }

    await fetchMovimientos()
    return { success: true, data }
  }

  return {
    movimientos,
    loading,
    error,
    refresh: fetchMovimientos,
    crear,
    anular
  }
}
