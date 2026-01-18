/**
 * Hook para gestionar cierre de caja
 */

import { useState, useEffect } from 'react'
import {
  getCierreCaja,
  upsertCierreCaja,
  getSaldoInicial,
  guardarSaldoInicial as guardarSaldoInicialService
} from '../services/cierresService'
import { getFechaHoy } from '../utils/formatters'

export function useCierreCaja(fecha = null) {
  const [cierre, setCierre] = useState(null)
  const [saldoInicial, setSaldoInicial] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fechaActual = fecha || getFechaHoy()

  // Cargar cierre y saldo inicial
  const fetchCierre = async () => {
    setLoading(true)
    setError(null)

    // Obtener cierre actual
    const { data: dataCierre, error: errCierre } = await getCierreCaja(fechaActual)

    // Obtener saldo inicial (efectivo final del día anterior)
    const { data: dataSaldo, error: errSaldo } = await getSaldoInicial(fechaActual)

    if (errCierre || errSaldo) {
      setError(errCierre || errSaldo)
    } else {
      setCierre(dataCierre)
      setSaldoInicial(parseFloat(dataSaldo || 0))
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchCierre()
  }, [fechaActual])

  // Guardar cierre
  const guardarCierre = async (cierreData) => {
    const { data, error: err } = await upsertCierreCaja({
      ...cierreData,
      fecha: fechaActual,
      saldo_inicial: saldoInicial
    })

    if (err) {
      setError(err)
      return { success: false, error: err }
    }

    await fetchCierre()
    return { success: true, data }
  }

  // Verificar si el día está cerrado
  const estaCerrado = () => {
    return cierre?.cerrado === true
  }

  // Actualizar solo el saldo inicial (sin cerrar la caja)
  const actualizarSaldoInicial = async (nuevoSaldo) => {
    const { data, error: err } = await guardarSaldoInicialService(fechaActual, nuevoSaldo)

    if (err) {
      setError(err)
      return { success: false, error: err }
    }

    await fetchCierre()
    return { success: true, data }
  }

  return {
    cierre,
    saldoInicial,
    loading,
    error,
    refresh: fetchCierre,
    guardarCierre,
    actualizarSaldoInicial,
    estaCerrado
  }
}
