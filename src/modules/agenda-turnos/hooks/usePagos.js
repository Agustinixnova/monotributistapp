/**
 * Hook para gestión de pagos de turnos
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getMetodosPago,
  getPagosTurno,
  registrarPago,
  registrarEnCaja,
  calcularResumenPagos,
  calcularSenaRequerida
} from '../services/pagosService'

/**
 * Hook para métodos de pago
 */
export function useMetodosPago() {
  const [metodos, setMetodos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data, error } = await getMetodosPago()
      if (!error && data) {
        setMetodos(data)
      }
      setLoading(false)
    }
    fetch()
  }, [])

  return { metodos, loading }
}

/**
 * Hook para pagos de un turno específico
 */
export function usePagosTurno(turnoId, turno = null) {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPagos = useCallback(async () => {
    if (!turnoId) return

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getPagosTurno(turnoId)

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPagos(data || [])
    }

    setLoading(false)
  }, [turnoId])

  useEffect(() => {
    fetchPagos()
  }, [fetchPagos])

  // Calcular resumen
  const resumen = turno ? calcularResumenPagos(turno, pagos) : null

  // Registrar nuevo pago
  const agregarPago = async (pagoData) => {
    const { data, error } = await registrarPago(turnoId, pagoData)
    if (error) throw error
    setPagos(prev => [...prev, data])
    return data
  }

  // Registrar pago en caja
  const enviarACaja = async (pagoId, turnoInfo) => {
    const { data, error } = await registrarEnCaja(pagoId, turnoInfo)
    if (error) throw error
    // Actualizar el pago en la lista
    setPagos(prev => prev.map(p =>
      p.id === pagoId ? { ...p, registrado_en_caja: true, caja_movimiento_id: data.id } : p
    ))
    return data
  }

  return {
    pagos,
    loading,
    error,
    resumen,
    agregarPago,
    enviarACaja,
    recargar: fetchPagos
  }
}

/**
 * Hook para calcular seña requerida
 */
export function useSenaRequerida(servicios = []) {
  return calcularSenaRequerida(servicios)
}

export default usePagosTurno
