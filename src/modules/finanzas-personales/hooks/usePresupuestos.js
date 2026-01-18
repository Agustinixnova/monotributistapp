/**
 * Hook para gestion de presupuestos por categoria
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../../auth/hooks/useAuth'
import {
  getPresupuestosMes,
  guardarPresupuesto,
  eliminarPresupuesto,
  copiarPresupuestosMesAnterior
} from '../services/presupuestosService'
import { getPrimerDiaMes } from '../utils/formatters'

/**
 * Hook para manejar presupuestos del mes
 * @param {Date} fecha - Fecha del mes (opcional)
 * @returns {Object} Estado y funciones de presupuestos
 */
export function usePresupuestos(fecha) {
  const { user } = useAuth()
  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Convertir fecha a string para evitar loops infinitos
  const mesActual = useMemo(() => {
    const f = fecha || new Date()
    return getPrimerDiaMes(f)
  }, [fecha])

  // Cargar presupuestos del mes
  const cargarPresupuestos = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const fechaActual = new Date(mesActual + 'T00:00:00')
      const data = await getPresupuestosMes(user.id, fechaActual)
      setPresupuestos(data || [])
    } catch (err) {
      console.error('Error cargando presupuestos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, mesActual])

  // Cargar al montar y cuando cambie la fecha
  useEffect(() => {
    cargarPresupuestos()
  }, [cargarPresupuestos])

  // Guardar/actualizar presupuesto
  const guardar = useCallback(async (categoriaId, montoLimite, alerta80 = true) => {
    if (!user?.id) throw new Error('Usuario no autenticado')

    const fechaActual = new Date(mesActual + 'T00:00:00')
    const presupuestoGuardado = await guardarPresupuesto({
      userId: user.id,
      categoriaId,
      montoLimite,
      alerta80,
      fecha: fechaActual
    })

    // Actualizar lista local
    setPresupuestos(prev => {
      const index = prev.findIndex(p => p.categoria_id === categoriaId)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = presupuestoGuardado
        return updated
      }
      return [...prev, presupuestoGuardado]
    })

    return presupuestoGuardado
  }, [user?.id, mesActual])

  // Eliminar presupuesto
  const eliminar = useCallback(async (presupuestoId) => {
    await eliminarPresupuesto(presupuestoId)
    setPresupuestos(prev => prev.filter(p => p.id !== presupuestoId))
  }, [])

  // Copiar del mes anterior
  const copiarMesAnterior = useCallback(async () => {
    if (!user?.id) throw new Error('Usuario no autenticado')

    const copiados = await copiarPresupuestosMesAnterior(user.id)
    if (copiados.length > 0) {
      setPresupuestos(copiados)
    }
    return copiados
  }, [user?.id])

  // Obtener presupuesto de una categoria
  const getPresupuestoCategoria = useCallback((categoriaId) => {
    return presupuestos.find(p => p.categoria_id === categoriaId)
  }, [presupuestos])

  return {
    presupuestos,
    loading,
    error,
    recargar: cargarPresupuestos,
    guardar,
    eliminar,
    copiarMesAnterior,
    getPresupuestoCategoria
  }
}
