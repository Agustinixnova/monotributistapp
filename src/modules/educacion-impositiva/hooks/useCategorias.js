import { useState, useEffect, useCallback } from 'react'
import {
  getCategorias,
  getCategoriasConConteo,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  reordenarCategorias
} from '../services/categoriasService'

/**
 * Hook para gestionar categorias
 */
export function useCategorias({ incluirInactivas = false, conConteo = false } = {}) {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = conConteo
        ? await getCategoriasConConteo()
        : await getCategorias(incluirInactivas)

      setCategorias(data)
    } catch (err) {
      console.error('Error cargando categorias:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [incluirInactivas, conConteo])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  const crear = async (datos) => {
    try {
      setGuardando(true)
      const nuevaCategoria = await crearCategoria(datos)
      await fetchCategorias()
      return nuevaCategoria
    } catch (err) {
      console.error('Error creando categoria:', err)
      setError(err.message)
      return null
    } finally {
      setGuardando(false)
    }
  }

  const actualizar = async (id, datos) => {
    try {
      setGuardando(true)
      const categoriaActualizada = await actualizarCategoria(id, datos)
      await fetchCategorias()
      return categoriaActualizada
    } catch (err) {
      console.error('Error actualizando categoria:', err)
      setError(err.message)
      return null
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    try {
      setGuardando(true)
      await eliminarCategoria(id)
      await fetchCategorias()
      return true
    } catch (err) {
      console.error('Error eliminando categoria:', err)
      setError(err.message)
      return false
    } finally {
      setGuardando(false)
    }
  }

  const reordenar = async (ordenamientos) => {
    try {
      setGuardando(true)
      await reordenarCategorias(ordenamientos)
      await fetchCategorias()
      return true
    } catch (err) {
      console.error('Error reordenando categorias:', err)
      setError(err.message)
      return false
    } finally {
      setGuardando(false)
    }
  }

  return {
    categorias,
    loading,
    error,
    guardando,
    refetch: fetchCategorias,
    crear,
    actualizar,
    eliminar,
    reordenar
  }
}
