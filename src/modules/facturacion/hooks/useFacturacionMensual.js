import { useState, useEffect, useCallback } from 'react'
import {
  getFacturacionCliente,
  createFacturacionMensual,
  updateFacturacionMensual,
  deleteFacturacionMensual,
  getAcumulado12Meses
} from '../services/facturacionService'

export function useFacturacionMensual(clientId) {
  const [facturaciones, setFacturaciones] = useState([])
  const [acumulado, setAcumulado] = useState({ total: 0, meses: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!clientId) return

    try {
      setLoading(true)
      setError(null)

      const [facturacionesData, acumuladoData] = await Promise.all([
        getFacturacionCliente(clientId),
        getAcumulado12Meses(clientId)
      ])

      setFacturaciones(facturacionesData || [])
      setAcumulado(acumuladoData)
    } catch (err) {
      console.error('Error cargando facturación:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const crear = async (data) => {
    const result = await createFacturacionMensual({ ...data, clientId })
    await fetchData()
    return result
  }

  const actualizar = async (id, data) => {
    const result = await updateFacturacionMensual(id, data)
    await fetchData()
    return result
  }

  const eliminar = async (id) => {
    await deleteFacturacionMensual(id)
    await fetchData()
  }

  const marcarRevisado = async (id, userId, nota = null) => {
    return actualizar(id, {
      estadoRevision: 'revisado',
      revisadoPor: userId,
      notaRevision: nota
    })
  }

  const marcarObservado = async (id, userId, nota) => {
    return actualizar(id, {
      estadoRevision: 'observado',
      revisadoPor: userId,
      notaRevision: nota
    })
  }

  const cerrarMes = async (id, userId) => {
    return actualizar(id, {
      estado: 'cerrado',
      cerradoPor: userId
    })
  }

  return {
    facturaciones,
    acumulado,
    loading,
    error,
    refetch: fetchData,
    crear,
    actualizar,
    eliminar,
    marcarRevisado,
    marcarObservado,
    cerrarMes
  }
}
