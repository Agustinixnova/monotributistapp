/**
 * Hook principal para Caja Diaria
 * Orquesta todos los hooks del módulo
 */

import { useState } from 'react'
import { useMovimientos } from './useMovimientos'
import { useResumenDia } from './useResumenDia'
import { useCierreCaja } from './useCierreCaja'
import { useMetodosPago } from './useMetodosPago'
import { useCategorias } from './useCategorias'
import { useArqueos } from './useArqueos'
import { getFechaHoy } from '../utils/formatters'

export function useCajaDiaria() {
  const [fecha, setFecha] = useState(getFechaHoy())

  // Hooks principales
  const movimientos = useMovimientos(fecha)
  const resumen = useResumenDia(fecha)
  const cierre = useCierreCaja(fecha)
  const metodosPago = useMetodosPago()
  const categorias = useCategorias()
  const arqueos = useArqueos(fecha)

  // Cambiar fecha
  const cambiarFecha = (nuevaFecha) => {
    setFecha(nuevaFecha)
  }

  // Ir al día de hoy
  const irAHoy = () => {
    setFecha(getFechaHoy())
  }

  // Refrescar todo
  const refreshAll = async () => {
    await Promise.all([
      movimientos.refresh(),
      resumen.refresh(),
      cierre.refresh(),
      metodosPago.refresh(),
      categorias.refresh(),
      arqueos.refresh()
    ])
  }

  // Loading general (si alguno está cargando)
  const loading = movimientos.loading || resumen.loading || cierre.loading

  // Error general (primer error encontrado)
  const error = movimientos.error || resumen.error || cierre.error

  return {
    fecha,
    cambiarFecha,
    irAHoy,
    movimientos,
    resumen,
    cierre,
    metodosPago,
    categorias,
    arqueos,
    loading,
    error,
    refreshAll
  }
}
