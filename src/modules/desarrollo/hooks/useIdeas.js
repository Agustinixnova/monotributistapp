import { useState, useEffect, useCallback } from 'react'
import { ideasService } from '../services/ideasService'
import { useAuth } from '../../../auth/hooks/useAuth'

export function useIdeas() {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await ideasService.getAll()
    setIdeas(data || [])
    setError(error?.message)
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Agrupar por etapa para el tablero
  const ideasPorEtapa = ideas.reduce((acc, idea) => {
    const etapa = idea.etapa || 'idea'
    if (!acc[etapa]) acc[etapa] = []
    acc[etapa].push(idea)
    return acc
  }, {})

  const crear = async (datos) => {
    const { data, error } = await ideasService.create({ ...datos, creado_por: user.id })
    if (!error && data) {
      setIdeas(prev => [data, ...prev])
    }
    return { data, error }
  }

  const actualizar = async (id, campos) => {
    const { data, error } = await ideasService.update(id, campos)
    if (!error && data) {
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, ...campos } : i))
    }
    return { data, error }
  }

  const mover = async (id, nuevaEtapa) => {
    const { error } = await ideasService.moverEtapa(id, nuevaEtapa)
    if (!error) {
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, etapa: nuevaEtapa } : i))
    }
    return { error }
  }

  const eliminar = async (id) => {
    const { error } = await ideasService.delete(id)
    if (!error) {
      setIdeas(prev => prev.filter(i => i.id !== id))
    }
    return { error }
  }

  return { ideas, ideasPorEtapa, loading, error, refetch: cargar, crear, actualizar, mover, eliminar }
}

// Hook para una idea específica
export function useIdea(id) {
  const [idea, setIdea] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const cargar = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data, error } = await ideasService.getById(id)
    setIdea(data)
    setError(error?.message)
    setLoading(false)
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  const actualizar = async (campos) => {
    const { data, error } = await ideasService.update(id, campos)
    if (!error && data) {
      setIdea(prev => ({ ...prev, ...campos }))
    }
    return { data, error }
  }

  const agregarComentario = async (contenido) => {
    const { data, error } = await ideasService.agregarComentario(id, user.id, contenido)
    if (!error && data) {
      setIdea(prev => ({
        ...prev,
        comentarios: [...(prev.comentarios || []), data]
      }))
    }
    return { data, error }
  }

  const marcarFiscalListo = async () => {
    const { data, error } = await ideasService.marcarFiscalListo(id, user.id)
    if (!error) {
      setIdea(prev => ({
        ...prev,
        fiscal_listo: true,
        fiscal_completado_por: user.id,
        fiscal_completado_fecha: new Date().toISOString()
      }))
    }
    return { data, error }
  }

  const marcarUxListo = async () => {
    const { data, error } = await ideasService.marcarUxListo(id, user.id)
    if (!error) {
      setIdea(prev => ({
        ...prev,
        ux_listo: true,
        ux_completado_por: user.id,
        ux_completado_fecha: new Date().toISOString()
      }))
    }
    return { data, error }
  }

  return {
    idea,
    loading,
    error,
    refetch: cargar,
    actualizar,
    agregarComentario,
    marcarFiscalListo,
    marcarUxListo
  }
}
