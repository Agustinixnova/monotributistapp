/**
 * Hook para resumen mensual en tiempo real
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getGastosMes, getGastosUltimosMeses } from '../services/gastosService'
import { getIngresosMes } from '../services/ingresosService'
import { getPresupuestosMes } from '../services/presupuestosService'
import {
  calcularTotalGastos,
  calcularTotalAhorro,
  agruparPorCategoria,
  agruparPorMetodoPago,
  calcularPorcentajes,
  calcularAhorro,
  calcularVariacion,
  calcularVariacionCategorias,
  getTopCategorias
} from '../utils/calculosFinanzas'
import { getPrimerDiaMes } from '../utils/formatters'

/**
 * Hook para obtener resumen mensual calculado en tiempo real
 * @param {Date} fecha - Fecha del mes (opcional)
 * @returns {Object} Resumen mensual
 */
export function useResumenMensual(fecha) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados de datos crudos
  const [gastosMesActual, setGastosMesActual] = useState([])
  const [gastosMesAnterior, setGastosMesAnterior] = useState([])
  const [ingresos, setIngresos] = useState(null)
  const [presupuestos, setPresupuestos] = useState([])

  // Convertir fecha a string para evitar loops infinitos
  const mesActual = useMemo(() => {
    const f = fecha || new Date()
    return getPrimerDiaMes(f)
  }, [fecha])

  // Cargar todos los datos
  const cargarDatos = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      // Crear fecha desde el mes actual
      const fechaActual = new Date(mesActual + 'T00:00:00')

      // Fecha del mes anterior
      const fechaAnterior = new Date(fechaActual)
      fechaAnterior.setMonth(fechaAnterior.getMonth() - 1)

      // Cargar todo en paralelo
      const [gastosActual, gastosAnterior, ingresosData, presupuestosData] = await Promise.all([
        getGastosMes(user.id, fechaActual),
        getGastosMes(user.id, fechaAnterior),
        getIngresosMes(user.id, fechaActual),
        getPresupuestosMes(user.id, fechaActual)
      ])

      setGastosMesActual(gastosActual)
      setGastosMesAnterior(gastosAnterior)
      setIngresos(ingresosData)
      setPresupuestos(presupuestosData)
    } catch (err) {
      console.error('Error cargando resumen:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, mesActual])

  // Cargar al montar y cuando cambie la fecha
  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Calculos memoizados
  const resumen = useMemo(() => {
    // Total mes actual
    const totalMesActual = calcularTotalGastos(gastosMesActual)
    const totalMesAnterior = calcularTotalGastos(gastosMesAnterior)

    // Agrupaciones
    const categoriasMesActual = agruparPorCategoria(gastosMesActual)
    const categoriasMesAnterior = agruparPorCategoria(gastosMesAnterior)

    // Con porcentajes
    const categoriasConPorcentaje = calcularPorcentajes(categoriasMesActual, totalMesActual)

    // Por metodo de pago
    const porMetodoPago = agruparPorMetodoPago(gastosMesActual)

    // Top 3 categorias
    const topCategorias = getTopCategorias(categoriasConPorcentaje, 3)

    // Variacion vs mes anterior
    const variacionTotal = calcularVariacion(totalMesActual, totalMesAnterior)

    // Variacion por categoria
    const variacionCategorias = calcularVariacionCategorias(categoriasMesActual, categoriasMesAnterior)

    // Total invertido en categoria Ahorro
    const totalInvertidoAhorro = calcularTotalAhorro(gastosMesActual)

    // Ahorro (con tracking de inversiones)
    const ahorro = calcularAhorro(ingresos, totalMesActual, totalInvertidoAhorro)

    // Dias restantes del mes
    const hoy = new Date()
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
    const diasRestantes = ultimoDia - hoy.getDate()

    return {
      totalMesActual,
      totalMesAnterior,
      categorias: categoriasConPorcentaje,
      categoriasMesAnterior,
      topCategorias,
      porMetodoPago,
      variacionTotal,
      variacionCategorias,
      ahorro,
      cantidadGastos: gastosMesActual.length,
      diasRestantes,
      ingresos,
      presupuestos
    }
  }, [gastosMesActual, gastosMesAnterior, ingresos, presupuestos])

  return {
    ...resumen,
    gastos: gastosMesActual,
    loading,
    error,
    recargar: cargarDatos
  }
}
