/**
 * Hook para gestionar espacios/salones
 * Solo se usa en modo "espacios"
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getEspacios,
  getEspaciosActivos,
  createEspacio,
  updateEspacio,
  deleteEspacio,
  reordenarEspacios
} from '../services/espaciosService'

/**
 * Hook principal para gestionar espacios
 */
export function useEspacios() {
  const [espacios, setEspacios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar espacios
  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await getEspacios()
      if (error) throw error
      setEspacios(data)
    } catch (err) {
      console.error('Error cargando espacios:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar al montar
  useEffect(() => {
    cargar()
  }, [cargar])

  // Crear espacio
  const crear = useCallback(async (espacioData) => {
    try {
      const { data, error } = await createEspacio(espacioData)
      if (error) throw error

      setEspacios(prev => [...prev, data])
      return { success: true, data }
    } catch (err) {
      console.error('Error creando espacio:', err)
      return { success: false, error: err }
    }
  }, [])

  // Actualizar espacio
  const actualizar = useCallback(async (id, espacioData) => {
    try {
      const { data, error } = await updateEspacio(id, espacioData)
      if (error) throw error

      setEspacios(prev => prev.map(e => e.id === id ? data : e))
      return { success: true, data }
    } catch (err) {
      console.error('Error actualizando espacio:', err)
      return { success: false, error: err }
    }
  }, [])

  // Eliminar espacio
  const eliminar = useCallback(async (id) => {
    try {
      const { error } = await deleteEspacio(id)
      if (error) throw error

      setEspacios(prev => prev.filter(e => e.id !== id))
      return { success: true }
    } catch (err) {
      console.error('Error eliminando espacio:', err)
      return { success: false, error: err }
    }
  }, [])

  // Reordenar espacios
  const reordenar = useCallback(async (nuevosEspacios) => {
    // Actualizar estado local inmediatamente
    setEspacios(nuevosEspacios)

    // Actualizar en la base de datos
    const espaciosOrdenados = nuevosEspacios.map((e, index) => ({
      id: e.id,
      orden: index
    }))

    try {
      const { error } = await reordenarEspacios(espaciosOrdenados)
      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('Error reordenando espacios:', err)
      // Revertir cambios en caso de error
      cargar()
      return { success: false, error: err }
    }
  }, [cargar])

  // Espacios activos
  const espaciosActivos = espacios.filter(e => e.activo)

  // Flag para saber si hay múltiples espacios
  const tieneMuchosEspacios = espaciosActivos.length > 1

  return {
    espacios,
    espaciosActivos,
    loading,
    error,
    crear,
    actualizar,
    eliminar,
    reordenar,
    recargar: cargar,
    tieneMuchosEspacios
  }
}

/**
 * Hook simple para obtener solo espacios activos (para selectores)
 */
export function useEspaciosActivos() {
  const [espacios, setEspacios] = useState([])
  const [loading, setLoading] = useState(true)
  const [espacioActivo, setEspacioActivo] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data, error } = await getEspaciosActivos()

      if (!error && data) {
        setEspacios(data)

        // Seleccionar el primero por defecto
        if (data.length > 0 && !espacioActivo) {
          setEspacioActivo(data[0].id)
        }
      }

      setLoading(false)
    }

    fetch()
  }, [])

  return {
    espacios,
    loading,
    espacioActivo,
    setEspacioActivo,
    tieneMuchos: espacios.length > 1
  }
}

export default useEspacios
