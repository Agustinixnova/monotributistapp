/**
 * Hook para gestion de ingresos
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { getIngresosMes, guardarIngresos } from '../services/ingresosService'
import { getPrimerDiaMes } from '../utils/formatters'

/**
 * Hook para manejar ingresos del mes
 * @param {Date} fecha - Fecha del mes (opcional)
 * @returns {Object} Estado y funciones de ingresos
 */
export function useIngresos(fecha) {
  const { user } = useAuth()
  const [ingresos, setIngresos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Convertir fecha a string para evitar loops infinitos
  const mesActual = useMemo(() => {
    const f = fecha || new Date()
    return getPrimerDiaMes(f)
  }, [fecha])

  // Cargar ingresos del mes
  const cargarIngresos = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const fechaActual = new Date(mesActual + 'T00:00:00')
      const data = await getIngresosMes(user.id, fechaActual)
      setIngresos(data)
    } catch (err) {
      console.error('Error cargando ingresos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, mesActual])

  // Cargar al montar y cuando cambie la fecha
  useEffect(() => {
    cargarIngresos()
  }, [cargarIngresos])

  // Guardar ingresos
  const guardar = useCallback(async (datosIngresos) => {
    if (!user?.id) throw new Error('Usuario no autenticado')

    const fechaActual = new Date(mesActual + 'T00:00:00')
    const ingresosGuardados = await guardarIngresos({
      ...datosIngresos,
      userId: user.id,
      fecha: fechaActual
    })

    setIngresos(ingresosGuardados)
    return ingresosGuardados
  }, [user?.id, mesActual])

  // Calcular totales
  const totalIngresos = (Number(ingresos?.ingreso_principal) || 0) +
                        (Number(ingresos?.otros_ingresos) || 0) +
                        (Number(ingresos?.ingresos_extra) || 0)

  return {
    ingresos,
    totalIngresos,
    loading,
    error,
    recargar: cargarIngresos,
    guardar
  }
}
