import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import {
  getArticulos,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo,
  cambiarEstadoArticulo,
  toggleDestacado,
  reordenarArticulos
} from '../services/articulosService'

/**
 * Hook para gestionar lista de articulos
 */
export function useArticulos({ categoriaId = null, soloPublicados = true, busqueda = '' } = {}) {
  const { user } = useAuth()
  const [articulos, setArticulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const fetchArticulos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getArticulos({ categoriaId, soloPublicados, busqueda })
      setArticulos(data)
    } catch (err) {
      console.error('Error cargando articulos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [categoriaId, soloPublicados, busqueda])

  useEffect(() => {
    fetchArticulos()
  }, [fetchArticulos])

  const crear = async (datos) => {
    if (!user) return null
    try {
      setGuardando(true)
      const nuevoArticulo = await crearArticulo(datos, user.id)
      await fetchArticulos()
      return nuevoArticulo
    } catch (err) {
      console.error('Error creando articulo:', err)
      setError(err.message)
      return null
    } finally {
      setGuardando(false)
    }
  }

  const actualizar = async (id, datos) => {
    if (!user) return null
    try {
      setGuardando(true)
      const articuloActualizado = await actualizarArticulo(id, datos, user.id)
      await fetchArticulos()
      return articuloActualizado
    } catch (err) {
      console.error('Error actualizando articulo:', err)
      setError(err.message)
      return null
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id) => {
    try {
      setGuardando(true)
      await eliminarArticulo(id)
      await fetchArticulos()
      return true
    } catch (err) {
      console.error('Error eliminando articulo:', err)
      setError(err.message)
      return false
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    if (!user) return null
    try {
      setGuardando(true)
      const articulo = await cambiarEstadoArticulo(id, nuevoEstado, user.id)
      await fetchArticulos()
      return articulo
    } catch (err) {
      console.error('Error cambiando estado:', err)
      setError(err.message)
      return null
    } finally {
      setGuardando(false)
    }
  }

  const marcarDestacado = async (id, destacado) => {
    if (!user) return null
    try {
      setGuardando(true)
      const articulo = await toggleDestacado(id, destacado, user.id)
      await fetchArticulos()
      return articulo
    } catch (err) {
      console.error('Error marcando destacado:', err)
      setError(err.message)
      return null
    } finally {
      setGuardando(false)
    }
  }

  const reordenar = async (ordenamientos) => {
    try {
      setGuardando(true)
      await reordenarArticulos(ordenamientos)
      await fetchArticulos()
      return true
    } catch (err) {
      console.error('Error reordenando:', err)
      setError(err.message)
      return false
    } finally {
      setGuardando(false)
    }
  }

  // Separar destacados
  const destacados = articulos.filter(a => a.destacado)
  const noDestacados = articulos.filter(a => !a.destacado)

  return {
    articulos,
    destacados,
    noDestacados,
    loading,
    cargando: loading,
    error,
    guardando,
    refetch: fetchArticulos,
    crear,
    actualizar,
    eliminar,
    cambiarEstado,
    toggleDestacado: marcarDestacado,
    reordenar
  }
}
