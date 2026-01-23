/**
 * Hook para gestión de clientes de agenda
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  buscarClientes
} from '../services/clientesService'

export function useClientes(options = {}) {
  const { soloActivos = true, busqueda = '', autoLoad = true } = options

  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(autoLoad)
  const [error, setError] = useState(null)

  const fetchClientes = useCallback(async (busquedaOverride) => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getClientes({
      soloActivos,
      busqueda: busquedaOverride ?? busqueda
    })

    if (fetchError) {
      setError(fetchError.message || 'Error al cargar clientes')
    } else {
      setClientes(data || [])
    }

    setLoading(false)
  }, [soloActivos, busqueda])

  useEffect(() => {
    if (autoLoad) {
      fetchClientes()
    }
  }, [fetchClientes, autoLoad])

  const agregar = async (clienteData) => {
    const { data, error: createError } = await createCliente(clienteData)
    if (createError) {
      throw createError
    }
    setClientes(prev => [data, ...prev])
    return data
  }

  const actualizar = async (id, clienteData) => {
    const { data, error: updateError } = await updateCliente(id, clienteData)
    if (updateError) {
      throw updateError
    }
    setClientes(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  const eliminar = async (id) => {
    const { error: deleteError } = await deleteCliente(id)
    if (deleteError) {
      throw deleteError
    }
    if (soloActivos) {
      setClientes(prev => prev.filter(c => c.id !== id))
    } else {
      setClientes(prev => prev.map(c => c.id === id ? { ...c, activo: false } : c))
    }
  }

  const buscar = async (texto) => {
    const { data, error: searchError } = await buscarClientes(texto)
    if (searchError) {
      throw searchError
    }
    return data || []
  }

  const recargar = (busquedaOverride) => {
    fetchClientes(busquedaOverride)
  }

  return {
    clientes,
    loading,
    error,
    agregar,
    actualizar,
    eliminar,
    buscar,
    recargar
  }
}

export default useClientes
