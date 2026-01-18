/**
 * Hook para gestionar métodos de pago
 */

import { useState, useEffect } from 'react'
import {
  getMetodosPago,
  createMetodoPago,
  updateMetodoPago,
  deleteMetodoPago
} from '../services/metodosPagoService'

export function useMetodosPago() {
  const [metodos, setMetodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar métodos
  const fetchMetodos = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getMetodosPago()

    if (err) {
      setError(err)
    } else {
      setMetodos(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMetodos()
  }, [])

  // Crear método
  const crear = async (metodoData) => {
    const { data, error: err } = await createMetodoPago(metodoData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchMetodos()
    return { success: true, data }
  }

  // Actualizar método
  const actualizar = async (id, metodoData) => {
    const { data, error: err } = await updateMetodoPago(id, metodoData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchMetodos()
    return { success: true, data }
  }

  // Eliminar método
  const eliminar = async (id) => {
    const { data, error: err } = await deleteMetodoPago(id)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchMetodos()
    return { success: true, data }
  }

  return {
    metodos,
    loading,
    error,
    refresh: fetchMetodos,
    crear,
    actualizar,
    eliminar
  }
}
