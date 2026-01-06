import { useState, useEffect, useCallback } from 'react'
import {
  getFacturacionCliente,
  getFacturacionMes,
  getTotalesPorMes,
  createFacturacionMensual,
  updateFacturacionMensual,
  deleteFacturacionMensual,
  getAcumulado12Meses
} from '../services/facturacionService'

/**
 * Hook para gestionar facturación mensual
 * NUEVO MODELO: Múltiples cargas por mes
 */
export function useFacturacionMensual(clientId) {
  // Todas las cargas del cliente
  const [cargas, setCargas] = useState([])
  // Totales agrupados por mes
  const [totalesPorMes, setTotalesPorMes] = useState([])
  // Acumulado 12 meses
  const [acumulado, setAcumulado] = useState({ total: 0, cargas: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!clientId) return

    try {
      setLoading(true)
      setError(null)

      const [cargasData, totalesData, acumuladoData] = await Promise.all([
        getFacturacionCliente(clientId),
        getTotalesPorMes(clientId, 12),
        getAcumulado12Meses(clientId)
      ])

      setCargas(cargasData || [])
      setTotalesPorMes(totalesData || [])
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

  // Crear nueva carga
  const crear = async (data) => {
    const result = await createFacturacionMensual({ ...data, clientId })
    await fetchData()
    return result
  }

  // Actualizar carga existente
  const actualizar = async (id, data) => {
    const result = await updateFacturacionMensual(id, data)
    await fetchData()
    return result
  }

  // Eliminar carga
  const eliminar = async (id) => {
    await deleteFacturacionMensual(id)
    await fetchData()
  }

  // Obtener cargas de un mes específico
  const getCargasMes = async (anio, mes) => {
    return getFacturacionMes(clientId, anio, mes)
  }

  // Obtener total de un mes (del cache)
  const getTotalMes = (anio, mes) => {
    const mes_ = totalesPorMes.find(t => t.anio === anio && t.mes === mes)
    return mes_?.total || 0
  }

  // Marcar como revisado (workflow contadora)
  const marcarRevisado = async (id, userId, nota = null) => {
    return actualizar(id, {
      estadoRevision: 'revisado',
      revisadoPor: userId,
      notaRevision: nota
    })
  }

  // Marcar como observado
  const marcarObservado = async (id, userId, nota) => {
    return actualizar(id, {
      estadoRevision: 'observado',
      revisadoPor: userId,
      notaRevision: nota
    })
  }

  return {
    // Datos
    cargas,              // Todas las cargas individuales
    totalesPorMes,       // Totales agrupados por mes
    acumulado,           // Acumulado 12 meses
    loading,
    error,

    // Acciones
    refetch: fetchData,
    crear,
    actualizar,
    eliminar,
    getCargasMes,
    getTotalMes,
    marcarRevisado,
    marcarObservado,

    // Backwards compatibility
    facturaciones: totalesPorMes  // Para componentes que esperan este nombre
  }
}
