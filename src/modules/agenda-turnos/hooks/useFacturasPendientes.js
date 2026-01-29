/**
 * Hook para gestionar facturas pendientes de emisión
 */

import { useState, useEffect, useCallback } from 'react'
import { getEffectiveUserId } from '../../caja-diaria/services/empleadosService'
import {
  obtenerFacturasPendientes,
  contarFacturasPendientes,
  actualizarIntento,
  descartarFacturaPendiente,
  eliminarFacturaPendiente,
  getNombreTipoComprobante,
  TIPOS_COMPROBANTE
} from '../services/facturasPendientesService'
import { emitirFacturaC, emitirNotaCreditoC, emitirNotaDebitoC } from '../services/afipService'
import { useFacturacion } from './useFacturacion'

export function useFacturasPendientes() {
  const [pendientes, setPendientes] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reintentando, setReintentando] = useState(null) // ID de la factura siendo reintentada
  const { config } = useFacturacion()

  // Cargar pendientes
  const cargar = useCallback(async () => {
    try {
      setLoading(true)
      const { userId } = await getEffectiveUserId()

      const [lista, cantidad] = await Promise.all([
        obtenerFacturasPendientes(userId),
        contarFacturasPendientes(userId)
      ])

      // Procesar datos para mostrar
      const procesadas = lista.map(p => ({
        ...p,
        tipoNombre: getNombreTipoComprobante(p.tipo_comprobante),
        clienteNombre: p.turno?.cliente
          ? `${p.turno.cliente.nombre || ''} ${p.turno.cliente.apellido || ''}`.trim()
          : p.datos_factura?.receptorNombre || 'Sin cliente',
        monto: p.datos_factura?.importeTotal || 0,
        fecha: p.turno?.fecha || p.created_at?.split('T')[0]
      }))

      setPendientes(procesadas)
      setCount(cantidad)
    } catch (err) {
      console.error('Error cargando facturas pendientes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar al montar
  useEffect(() => {
    cargar()
  }, [cargar])

  // Reintentar una factura
  const reintentar = useCallback(async (pendiente) => {
    if (!config) {
      throw new Error('Configuración de facturación no disponible')
    }

    setReintentando(pendiente.id)

    try {
      const { userId } = await getEffectiveUserId()
      const datos = pendiente.datos_factura

      let resultado

      switch (pendiente.tipo_comprobante) {
        case TIPOS_COMPROBANTE.FACTURA_C:
          resultado = await emitirFacturaC(userId, {
            ...datos,
            turnoId: pendiente.turno_id
          })
          break

        case TIPOS_COMPROBANTE.NOTA_CREDITO_C:
          resultado = await emitirNotaCreditoC(userId, {
            ...datos,
            turnoId: pendiente.turno_id
          })
          break

        case TIPOS_COMPROBANTE.NOTA_DEBITO_C:
          resultado = await emitirNotaDebitoC(userId, {
            ...datos,
            turnoId: pendiente.turno_id
          })
          break

        default:
          throw new Error('Tipo de comprobante no soportado')
      }

      // Éxito - actualizar estado
      await actualizarIntento(pendiente.id, { exito: true })

      // Recargar lista
      await cargar()

      return resultado
    } catch (err) {
      // Fallo - actualizar intentos
      await actualizarIntento(pendiente.id, { exito: false, error: err })
      await cargar()
      throw err
    } finally {
      setReintentando(null)
    }
  }, [config, cargar])

  // Reintentar todas las pendientes
  const reintentarTodas = useCallback(async () => {
    const resultados = {
      exitosos: 0,
      fallidos: 0,
      errores: []
    }

    for (const pendiente of pendientes) {
      try {
        await reintentar(pendiente)
        resultados.exitosos++
      } catch (err) {
        resultados.fallidos++
        resultados.errores.push({
          id: pendiente.id,
          cliente: pendiente.clienteNombre,
          error: err.message
        })
      }
    }

    return resultados
  }, [pendientes, reintentar])

  // Descartar una pendiente
  const descartar = useCallback(async (id) => {
    await descartarFacturaPendiente(id)
    await cargar()
  }, [cargar])

  // Eliminar una pendiente
  const eliminar = useCallback(async (id) => {
    await eliminarFacturaPendiente(id)
    await cargar()
  }, [cargar])

  return {
    pendientes,
    count,
    loading,
    reintentando,
    reintentar,
    reintentarTodas,
    descartar,
    eliminar,
    recargar: cargar
  }
}
