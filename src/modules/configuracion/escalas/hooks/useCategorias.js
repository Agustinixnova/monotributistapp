import { useState, useEffect, useCallback } from 'react'
import { escalasService } from '../services/escalasService'

/**
 * Hook para gestionar las categorias del monotributo
 */
export function useCategorias() {
  const [categorias, setCategorias] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Cargar categorias vigentes
  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await escalasService.getCategoriasVigentes()
      setCategorias(data || [])
    } catch (err) {
      console.error('Error fetching categorias:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar historial de escalas
  const fetchHistorial = useCallback(async () => {
    try {
      const data = await escalasService.getHistorialEscalas()
      setHistorial(data || [])
    } catch (err) {
      console.error('Error fetching historial:', err)
    }
  }, [])

  // Actualizar una categoria individual
  const updateCategoria = useCallback(async (id, data) => {
    try {
      setSaving(true)
      setError(null)
      const updated = await escalasService.updateCategoria(id, data)
      setCategorias(prev => prev.map(cat => cat.id === id ? updated : cat))
      return updated
    } catch (err) {
      console.error('Error updating categoria:', err)
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  // Cargar nueva escala completa
  const cargarNuevaEscala = useCallback(async (nuevasCategorias, vigente_desde) => {
    try {
      setSaving(true)
      setError(null)
      await escalasService.cargarNuevaEscala(nuevasCategorias, vigente_desde)
      await fetchCategorias()
      await fetchHistorial()
    } catch (err) {
      console.error('Error cargando nueva escala:', err)
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [fetchCategorias, fetchHistorial])

  // Obtener categorias de un periodo especifico
  const getCategoriasPorPeriodo = useCallback(async (vigente_desde, vigente_hasta) => {
    try {
      return await escalasService.getCategoriasPorPeriodo(vigente_desde, vigente_hasta)
    } catch (err) {
      console.error('Error fetching categorias por periodo:', err)
      throw err
    }
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    fetchCategorias()
    fetchHistorial()
  }, [fetchCategorias, fetchHistorial])

  // Obtener fecha de vigencia actual
  const fechaVigencia = categorias.length > 0 ? categorias[0].vigente_desde : null

  return {
    categorias,
    historial,
    loading,
    error,
    saving,
    fechaVigencia,
    fetchCategorias,
    fetchHistorial,
    updateCategoria,
    cargarNuevaEscala,
    getCategoriasPorPeriodo
  }
}

export default useCategorias
