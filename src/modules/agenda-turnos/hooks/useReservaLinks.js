/**
 * Hook para gestionar links de reserva
 */

import { useState, useEffect, useCallback } from 'react'
import {
  crearLink,
  getLinks,
  eliminarLink
} from '../services/reservaLinksService'

export function useReservaLinks() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Cargar links del profesional
  const cargar = useCallback(async (filtros = {}) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await getLinks(filtros)
      if (error) throw error
      setLinks(data || [])
    } catch (err) {
      console.error('Error cargando links:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Crear nuevo link
  const crear = useCallback(async (datos) => {
    setSaving(true)
    setError(null)

    try {
      const { data, error } = await crearLink(datos)
      if (error) throw error

      // Agregar al estado local
      setLinks(prev => [data, ...prev])

      return { success: true, data }
    } catch (err) {
      console.error('Error creando link:', err)
      setError(err.message)
      return { success: false, error: err }
    } finally {
      setSaving(false)
    }
  }, [])

  // Eliminar link
  const eliminar = useCallback(async (linkId) => {
    try {
      const { success, error } = await eliminarLink(linkId)
      if (error) throw error

      // Remover del estado local
      setLinks(prev => prev.filter(l => l.id !== linkId))

      return { success: true }
    } catch (err) {
      console.error('Error eliminando link:', err)
      return { success: false, error: err }
    }
  }, [])

  // Obtener links activos
  const linksActivos = links.filter(l => l.estado === 'activo')

  // Obtener links usados
  const linksUsados = links.filter(l => l.estado === 'usado')

  // Obtener links expirados
  const linksExpirados = links.filter(l => l.estado === 'expirado')

  // Cargar al montar
  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    links,
    linksActivos,
    linksUsados,
    linksExpirados,
    loading,
    saving,
    error,
    crear,
    eliminar,
    recargar: cargar
  }
}

export default useReservaLinks
