/**
 * Hook para gestión de servicios de agenda
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getServicios,
  createServicio,
  updateServicio,
  deleteServicio
} from '../services/serviciosService'

export function useServicios(soloActivos = true) {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchServicios = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getServicios(soloActivos)

    if (fetchError) {
      setError(fetchError.message || 'Error al cargar servicios')
    } else {
      setServicios(data || [])
    }

    setLoading(false)
  }, [soloActivos])

  useEffect(() => {
    fetchServicios()
  }, [fetchServicios])

  const agregar = async (servicioData) => {
    const { data, error: createError } = await createServicio(servicioData)
    if (createError) {
      throw createError
    }
    setServicios(prev => [...prev, data])
    return data
  }

  const actualizar = async (id, servicioData) => {
    const { data, error: updateError } = await updateServicio(id, servicioData)
    if (updateError) {
      throw updateError
    }
    setServicios(prev => prev.map(s => s.id === id ? data : s))
    return data
  }

  const eliminar = async (id) => {
    const { error: deleteError } = await deleteServicio(id)
    if (deleteError) {
      throw deleteError
    }
    // Si soloActivos, remover de la lista; si no, actualizar el estado
    if (soloActivos) {
      setServicios(prev => prev.filter(s => s.id !== id))
    } else {
      setServicios(prev => prev.map(s => s.id === id ? { ...s, activo: false } : s))
    }
  }

  const recargar = () => {
    fetchServicios()
  }

  return {
    servicios,
    loading,
    error,
    agregar,
    actualizar,
    eliminar,
    recargar
  }
}

export default useServicios
