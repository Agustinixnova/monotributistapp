/**
 * Hook para gestionar cobranzas de cuenta corriente
 */

import { useState, useCallback } from 'react'
import { registrarPago, getPagosCliente, editarPago, anularPago } from '../services/cobranzasService'
import { editarFiado, anularFiado } from '../services/fiadosService'
import { getTodosClientesConSaldo, getClienteById, getHistorialCliente } from '../services/clientesFiadoService'

export function useCobranzas() {
  const [clientesConDeuda, setClientesConDeuda] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar todos los clientes activos con su saldo
  const fetchClientesConDeuda = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getTodosClientesConSaldo()

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

  // Editar un movimiento (fiado o pago)
  const editarMovimiento = async (tipo, id, nuevoMonto, descripcion = null) => {
    setError(null)
    let result
    if (tipo === 'fiado') {
      result = await editarFiado(id, nuevoMonto, descripcion)
    } else {
      result = await editarPago(id, nuevoMonto, descripcion)
    }

    if (result.error) {
      setError(result.error)
      return { success: false, error: result.error }
    }
    return { success: true, data: result.data }
  }

  // Anular un movimiento (fiado o pago)
  const anularMovimiento = async (tipo, id) => {
    setError(null)
    let result
    if (tipo === 'fiado') {
      result = await anularFiado(id)
    } else {
      result = await anularPago(id)
    }

    if (result.error) {
      setError(result.error)
      return { success: false, error: result.error }
    }
    return { success: true }
  }

  return {
    clientesConDeuda,
    loading,
    error,
    refresh: fetchClientesConDeuda,
    cobrar,
    obtenerCliente,
    obtenerHistorial,
    obtenerPagos,
    editarMovimiento,
    anularMovimiento
  }
}
