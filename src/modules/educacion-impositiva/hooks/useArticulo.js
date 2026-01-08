import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import {
  getArticuloBySlug,
  getArticuloById,
  actualizarArticulo,
  eliminarArticulo
} from '../services/articulosService'

/**
 * Hook para un articulo especifico
 */
export function useArticulo(slugOrId, { porId = false } = {}) {
  const { user } = useAuth()
  const [articulo, setArticulo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const fetchArticulo = useCallback(async () => {
    if (!slugOrId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = porId
        ? await getArticuloById(slugOrId)
        : await getArticuloBySlug(slugOrId)

      setArticulo(data)
    } catch (err) {
      console.error('Error cargando articulo:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slugOrId, porId])

  useEffect(() => {
    fetchArticulo()
  }, [fetchArticulo])

  const actualizar = async (datos) => {
    if (!user || !articulo) return null
    try {
      setGuardando(true)
      const articuloActualizado = await actualizarArticulo(articulo.id, datos, user.id)
      setArticulo(articuloActualizado)
      return articuloActualizado
    } catch (err) {
      console.error('Error actualizando articulo:', err)
      setError(err.message)
      return null
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    if (!articulo) return false
    try {
      setGuardando(true)
      await eliminarArticulo(articulo.id)
      return true
    } catch (err) {
      console.error('Error eliminando articulo:', err)
      setError(err.message)
      return false
    } finally {
      setGuardando(false)
    }
  }

  return {
    articulo,
    cargando: loading,
    loading,
    error,
    guardando,
    refetch: fetchArticulo,
    actualizar,
    eliminar
  }
}

/**
 * Hook wrapper para obtener articulo por slug
 */
export function useArticuloBySlug(slug) {
  return useArticulo(slug, { porId: false })
}
