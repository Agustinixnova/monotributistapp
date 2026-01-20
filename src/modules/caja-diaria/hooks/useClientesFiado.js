/**
 * Hook para gestionar clientes con cuenta corriente
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getClientes,
  getClientesConDeuda,
  getTodosClientesConSaldo,
  createCliente,
  updateCliente,
  deleteCliente,
  getDeudaCliente,
  getHistorialCliente
} from '../services/clientesFiadoService'

export function useClientesFiado() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar clientes
  const fetchClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getClientes()

    if (err) {
      setError(err)
    } else {
      setClientes(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  // Crear cliente
  const crear = async (clienteData) => {
    const { data, error: err } = await createCliente(clienteData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchClientes()
    return { success: true, data }
  }

  // Actualizar cliente
  const actualizar = async (id, clienteData) => {
    const { data, error: err } = await updateCliente(id, clienteData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchClientes()
    return { success: true, data }
  }

  // Eliminar cliente (soft delete)
  const eliminar = async (id) => {
    const { data, error: err } = await deleteCliente(id)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchClientes()
    return { success: true, data }
  }

  // Obtener deuda de un cliente
  const obtenerDeuda = async (clienteId) => {
    const { data, error: err } = await getDeudaCliente(clienteId)
    if (err) {
      return { success: false, error: err, deuda: 0 }
    }
    return { success: true, deuda: data }
  }

  // Obtener historial de un cliente
  const obtenerHistorial = async (clienteId) => {
    const { data, error: err } = await getHistorialCliente(clienteId)
    if (err) {
      return { success: false, error: err, historial: [] }
    }
    return { success: true, historial: data || [] }
  }

  return {
    clientes,
    loading,
    error,
    refresh: fetchClientes,
    crear,
    actualizar,
    eliminar,
    obtenerDeuda,
    obtenerHistorial
  }
}

/**
 * Hook para obtener clientes con deuda (solo los que deben)
 */
export function useClientesConDeuda() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getClientesConDeuda()

    if (err) {
      setError(err)
    } else {
      setClientes(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  return {
    clientes,
    loading,
    error,
    refresh: fetchClientes
  }
}

/**
 * Hook para obtener TODOS los clientes activos con su saldo
 * (para el modal de cobranzas)
 */
export function useTodosClientesConSaldo() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getTodosClientesConSaldo()

    if (err) {
      setError(err)
    } else {
      setClientes(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  return {
    clientes,
    loading,
    error,
    refresh: fetchClientes
  }
}
