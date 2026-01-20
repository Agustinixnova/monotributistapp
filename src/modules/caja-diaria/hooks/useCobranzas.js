/**
 * Hook para gestionar cobranzas de cuenta corriente
 */

import { useState, useCallback } from 'react'
import { registrarPago, getPagosCliente } from '../services/cobranzasService'
import { getClientesConDeuda, getClienteById, getHistorialCliente } from '../services/clientesFiadoService'

export function useCobranzas() {
  const [clientesConDeuda, setClientesConDeuda] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar clientes con deuda
  const fetchClientesConDeuda = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getClientesConDeuda()

    if (err) {
      setError(err)
    } else {
      setClientesConDeuda(data || [])
    }
    setLoading(false)
  }, [])

  // Registrar pago
  const cobrar = async (pagoData) => {
    setError(null)
    const { data, error: err } = await registrarPago(pagoData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    // Refrescar lista de clientes con deuda
    await fetchClientesConDeuda()
    return { success: true, data }
  }

  // Obtener cliente con deuda por ID
  const obtenerCliente = async (clienteId) => {
    const { data, error: err } = await getClienteById(clienteId)
    if (err) {
      return { success: false, error: err, cliente: null }
    }
    return { success: true, cliente: data }
  }

  // Obtener historial de un cliente
  const obtenerHistorial = async (clienteId) => {
    const { data, error: err } = await getHistorialCliente(clienteId)
    if (err) {
      return { success: false, error: err, historial: [] }
    }
    return { success: true, historial: data || [] }
  }

  // Obtener pagos de un cliente
  const obtenerPagos = async (clienteId) => {
    const { data, error: err } = await getPagosCliente(clienteId)
    if (err) {
      return { success: false, error: err, pagos: [] }
    }
    return { success: true, pagos: data || [] }
  }

  return {
    clientesConDeuda,
    loading,
    error,
    refresh: fetchClientesConDeuda,
    cobrar,
    obtenerCliente,
    obtenerHistorial,
    obtenerPagos
  }
}
