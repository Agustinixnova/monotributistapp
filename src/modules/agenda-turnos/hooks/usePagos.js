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
  calcularSenaRequerida,
  anularPagosSenaTurno
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
    if (!turnoId) {
      console.log('[usePagosTurno] No turnoId provided')
      return
    }

    console.log('[usePagosTurno] Fetching pagos for turno:', turnoId)
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getPagosTurno(turnoId)

    console.log('[usePagosTurno] Result:', { data, error: fetchError })

    if (fetchError) {
      console.error('[usePagosTurno] Error:', fetchError)
      setError(fetchError.message)
    } else {
      console.log('[usePagosTurno] Pagos loaded:', data?.length || 0, 'registros')
      setPagos(data || [])
    }

    setLoading(false)
  }, [turnoId])

  useEffect(() => {
    fetchPagos()
  }, [fetchPagos])

  // Calcular resumen
  const resumen = turno ? calcularResumenPagos(turno, pagos) : null

  // Debug: mostrar cálculo del resumen
  if (turno && resumen) {
    console.log('[usePagosTurno] Resumen calculado:', {
      precioTotal: resumen.precioTotal,
      totalPagado: resumen.totalPagado,
      totalSenas: resumen.totalSenas,
      saldoPendiente: resumen.saldoPendiente,
      pagosCount: pagos.length
    })
  }

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

  // Anular/eliminar pagos de seña (cuando se devuelve la seña)
  const anularPagosSena = async () => {
    const { success, error } = await anularPagosSenaTurno(turnoId)
    if (error) throw error
    // Remover las señas de la lista local
    setPagos(prev => prev.filter(p => p.tipo !== 'sena'))
    return success
  }

  return {
    pagos,
    loading,
    error,
    resumen,
    agregarPago,
    enviarACaja,
    anularPagosSena,
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
