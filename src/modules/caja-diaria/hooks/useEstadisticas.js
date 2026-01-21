/**
 * Hook para manejar estadísticas de Caja Diaria
 */

import { useState } from 'react'
import {
  getEstadisticasResumen,
  getEstadisticasEvolucionDiaria,
  getEstadisticasCategorias,
  getEstadisticasMetodosPago,
  getEstadisticasDiasSemana,
  getEstadisticasCuentaCorriente
} from '../services/estadisticasService'

export function useEstadisticas() {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)

  const cargarEstadisticas = async ({ fechaDesde, fechaHasta }) => {
    setLoading(true)
    setError(null)

    try {
      // Cargar todas las estadísticas en paralelo
      const [
        resumen,
        evolucion,
        ingresosCateg,
        egresosCateg,
        metodosPago,
        diasSemana,
        cuentaCorriente
      ] = await Promise.all([
        getEstadisticasResumen({ fechaDesde, fechaHasta }),
        getEstadisticasEvolucionDiaria({ fechaDesde, fechaHasta }),
        getEstadisticasCategorias({ fechaDesde, fechaHasta, tipo: 'entrada' }),
        getEstadisticasCategorias({ fechaDesde, fechaHasta, tipo: 'salida' }),
        getEstadisticasMetodosPago({ fechaDesde, fechaHasta }),
        getEstadisticasDiasSemana({ fechaDesde, fechaHasta }),
        getEstadisticasCuentaCorriente({ fechaDesde, fechaHasta })
      ])

      setDatos({
        resumen: resumen.data,
        evolucion: evolucion.data,
        ingresosCateg: ingresosCateg.data,
        egresosCateg: egresosCateg.data,
        metodosPago: metodosPago.data,
        diasSemana: diasSemana.data,
        cuentaCorriente: cuentaCorriente.data
      })
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    datos,
    error,
    cargarEstadisticas
  }
}
