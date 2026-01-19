/**
 * Hook para gestionar alias de pago
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAliasPago,
  createAliasPago,
  updateAliasPago,
  deleteAliasPago,
  uploadQRImage,
  deleteQRImage
} from '../services/aliasPagoService'

export function useAliasPago() {
  const [alias, setAlias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlias = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getAliasPago()
    if (error) {
      setError(error)
    } else {
      setAlias(data || [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAlias()
  }, [fetchAlias])

  const crear = async (data) => {
    const result = await createAliasPago(data)
    if (!result.error) {
      setAlias(prev => [...prev, result.data])
    }
    return result
  }

  const actualizar = async (id, data) => {
    const result = await updateAliasPago(id, data)
    if (!result.error) {
      setAlias(prev => prev.map(a => a.id === id ? result.data : a))
    }
    return result
  }

  const eliminar = async (id) => {
    const result = await deleteAliasPago(id)
    if (result.success) {
      setAlias(prev => prev.filter(a => a.id !== id))
    }
    return result
  }

  const subirQR = async (file) => {
    return await uploadQRImage(file)
  }

  const eliminarQR = async () => {
    return await deleteQRImage()
  }

  return {
    alias,
    loading,
    error,
    refetch: fetchAlias,
    crear,
    actualizar,
    eliminar,
    subirQR,
    eliminarQR
  }
}
