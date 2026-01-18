/**
 * Hook para gestionar categorías
 */

import { useState, useEffect } from 'react'
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from '../services/categoriasService'

export function useCategorias(tipo = null) {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar categorías
  const fetchCategorias = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getCategorias(tipo)

    if (err) {
      setError(err)
    } else {
      setCategorias(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCategorias()
  }, [tipo])

  // Crear categoría
  const crear = async (categoriaData) => {
    const { data, error: err } = await createCategoria(categoriaData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchCategorias()
    return { success: true, data }
  }

  // Actualizar categoría
  const actualizar = async (id, categoriaData) => {
    const { data, error: err } = await updateCategoria(id, categoriaData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchCategorias()
    return { success: true, data }
  }

  // Eliminar categoría
  const eliminar = async (id) => {
    const { data, error: err } = await deleteCategoria(id)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchCategorias()
    return { success: true, data }
  }

  return {
    categorias,
    loading,
    error,
    refresh: fetchCategorias,
    crear,
    actualizar,
    eliminar
  }
}
