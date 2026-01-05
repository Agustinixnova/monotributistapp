import { useState, useEffect, useCallback } from 'react'
import { reportesService } from '../services/reportesService'
import { useAuth } from '../../../auth/hooks/useAuth'

export function useReportes(filtrosIniciales = {}) {
  const [reportes, setReportes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState(filtrosIniciales)
  const { user } = useAuth()

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data } = await reportesService.getAll(filtros)
    setReportes(data || [])
    setLoading(false)
  }, [filtros])

  useEffect(() => { cargar() }, [cargar])

  const crear = async (datos) => {
    const { data, error } = await reportesService.create({ ...datos, reportado_por: user.id })
    if (!error && data) {
      setReportes(prev => [data, ...prev])
    }
    return { data, error }
  }

  const cambiarEstado = async (id, estado) => {
    const { error } = await reportesService.cambiarEstado(id, estado)
    if (!error) {
      setReportes(prev => prev.map(r => r.id === id ? { ...r, estado } : r))
    }
    return { error }
  }

  const eliminar = async (id) => {
    const { error } = await reportesService.delete(id)
    if (!error) {
      setReportes(prev => prev.filter(r => r.id !== id))
    }
    return { error }
  }

  const actualizarFiltros = (nuevosFiltros) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }))
  }

  return {
    reportes,
    loading,
    filtros,
    actualizarFiltros,
    refetch: cargar,
    crear,
    cambiarEstado,
    eliminar
  }
}

// Hook para un reporte específico
export function useReporte(id) {
  const [reporte, setReporte] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const cargar = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data, error } = await reportesService.getById(id)

    // Si el reporte está pendiente, cambiarlo a abierto automáticamente
    if (data && data.estado === 'pendiente') {
      await reportesService.cambiarEstado(id, 'abierto')
      data.estado = 'abierto'
    }

    setReporte(data)
    setError(error?.message)
    setLoading(false)
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  const agregarMensaje = async (contenido) => {
    const { data, error } = await reportesService.agregarMensaje(id, user.id, contenido)
    if (!error && data) {
      setReporte(prev => ({
        ...prev,
        mensajes: [...(prev.mensajes || []), data]
      }))
    }
    return { data, error }
  }

  const cambiarEstado = async (nuevoEstado) => {
    const { data, error } = await reportesService.cambiarEstado(id, nuevoEstado)
    if (!error) {
      setReporte(prev => ({ ...prev, estado: nuevoEstado }))
    }
    return { data, error }
  }

  return {
    reporte,
    loading,
    error,
    refetch: cargar,
    agregarMensaje,
    cambiarEstado
  }
}
