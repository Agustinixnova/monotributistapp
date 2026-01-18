/**
 * Hook para generar consejos automaticos
 */

import { useMemo } from 'react'
import { generarConsejos } from '../utils/consejosLogic'
import { calcularPorcentajes } from '../utils/calculosFinanzas'

/**
 * Hook para obtener consejos basados en el resumen mensual
 * @param {Object} resumen - Resumen mensual del hook useResumenMensual
 * @returns {Array} Lista de consejos
 */
export function useConsejos(resumen) {
  const consejos = useMemo(() => {
    if (!resumen || resumen.loading) return []

    // Agregar porcentajes a categorias del mes anterior
    const categoriasMesAnteriorConPorcentaje = calcularPorcentajes(
      resumen.categoriasMesAnterior || [],
      resumen.totalMesAnterior || 0
    )

    // Determinar si es el primer mes (no hay datos del mes anterior)
    const esPrimerMes = resumen.totalMesAnterior === 0 && resumen.cantidadGastos > 0

    // Dias en el mes
    const hoy = new Date()
    const diasEnElMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()

    return generarConsejos({
      gastosMesActual: resumen.gastos || [],
      gastosMesAnterior: [], // No lo pasamos porque no tenemos los gastos crudos del mes anterior
      categoriasMesActual: resumen.categorias || [],
      categoriasMesAnterior: categoriasMesAnteriorConPorcentaje,
      totalMesActual: resumen.totalMesActual || 0,
      totalMesAnterior: resumen.totalMesAnterior || 0,
      ingresos: resumen.ingresos,
      presupuestos: resumen.presupuestos || [],
      diasEnElMes,
      diasRestantesMes: resumen.diasRestantes || 15,
      esPrimerMes
    })
  }, [resumen])

  return consejos
}
