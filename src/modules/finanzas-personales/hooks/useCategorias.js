/**
 * Hook para gestion de categorias
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} from '../services/categoriasService'

/**
 * Hook para manejar categorias
 * @returns {Object} Estado y funciones de categorias
 */
export function useCategorias() {
  const { user } = useAuth()
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar categorias
  const cargarCategorias = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getCategorias()
      setCategorias(data)
    } catch (err) {
      console.error('Error cargando categorias:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar al montar
  useEffect(() => {
    cargarCategorias()
  }, [cargarCategorias])

  // Agregar categoria personalizada
  const agregarCategoria = useCallback(async (datosCategoria) => {
    if (!user?.id) throw new Error('Usuario no autenticado')

    const nuevaCategoria = await crearCategoria({
      ...datosCategoria,
      userId: user.id
    })

    // Agregar al estado local
    setCategorias(prev => [...prev, nuevaCategoria])

    return nuevaCategoria
  }, [user?.id])

  // Editar categoria personalizada
  const editarCategoria = useCallback(async (id, datosCategoria) => {
    const categoriaActualizada = await actualizarCategoria(id, datosCategoria)

    // Actualizar en el estado local
    setCategorias(prev => prev.map(c => c.id === id ? categoriaActualizada : c))

    return categoriaActualizada
  }, [])

  // Eliminar categoria personalizada
  const borrarCategoria = useCallback(async (id) => {
    await eliminarCategoria(id)

    // Remover del estado local
    setCategorias(prev => prev.filter(c => c.id !== id))
  }, [])

  // Separar categorias del sistema y personalizadas
  const categoriasSistema = categorias.filter(c => c.es_sistema)
  const categoriasPersonalizadas = categorias.filter(c => !c.es_sistema)

  return {
    categorias,
    categoriasSistema,
    categoriasPersonalizadas,
    loading,
    error,
    recargar: cargarCategorias,
    agregarCategoria,
    editarCategoria,
    borrarCategoria
  }
}
