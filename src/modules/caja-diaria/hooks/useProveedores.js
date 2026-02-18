/**
 * Hook para gestionar proveedores
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor
} from '../services/proveedoresService'

export function useProveedores() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar proveedores
  const fetchProveedores = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getProveedores()

    if (err) {
      setError(err)
    } else {
      setProveedores(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProveedores()
  }, [fetchProveedores])

  // Crear proveedor
  const crear = async (proveedorData) => {
    const { data, error: err } = await createProveedor(proveedorData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchProveedores()
    return { success: true, data }
  }

  // Actualizar proveedor
  const actualizar = async (id, proveedorData) => {
    const { data, error: err } = await updateProveedor(id, proveedorData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchProveedores()
    return { success: true, data }
  }

  // Eliminar proveedor (soft delete)
  const eliminar = async (id) => {
    const { data, error: err } = await deleteProveedor(id)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchProveedores()
    return { success: true, data }
  }

  return {
    proveedores,
    loading,
    error,
    refresh: fetchProveedores,
    crear,
    actualizar,
    eliminar
  }
}
