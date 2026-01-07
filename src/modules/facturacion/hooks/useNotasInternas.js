import { useState, useEffect, useCallback } from 'react'
import {
  getNotasCliente,
  createNota,
  updateNota,
  archivarNota,
  completarRecordatorio
} from '../services/notasInternasService'

export function useNotasInternas(clientId) {
  const [notas, setNotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNotas = useCallback(async () => {
    if (!clientId) return

    try {
      setLoading(true)
      setError(null)
      const data = await getNotasCliente(clientId)
      setNotas(data)
    } catch (err) {
      console.error('Error cargando notas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchNotas()
  }, [fetchNotas])

  const agregar = async (data) => {
    const result = await createNota({ ...data, clientId })
    await fetchNotas()
    return result
  }

  const actualizar = async (id, data) => {
    const result = await updateNota(id, data)
    await fetchNotas()
    return result
  }

  const archivar = async (id) => {
    await archivarNota(id)
    await fetchNotas()
  }

  const completar = async (id) => {
    await completarRecordatorio(id)
    await fetchNotas()
  }

  // Separar por tipo
  const notasUrgentes = notas.filter(n => n.tipo === 'urgente')
  const notasGenerales = notas.filter(n => n.tipo === 'general')
  const notasFacturacion = notas.filter(n => n.tipo === 'facturacion')
  const recordatorios = notas.filter(n => n.fecha_recordatorio && !n.recordatorio_completado)

  return {
    notas,
    notasUrgentes,
    notasGenerales,
    notasFacturacion,
    recordatorios,
    loading,
    error,
    refetch: fetchNotas,
    agregar,
    actualizar,
    archivar,
    completar
  }
}
