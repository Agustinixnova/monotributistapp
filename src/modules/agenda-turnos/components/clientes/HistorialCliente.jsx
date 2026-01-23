/**
 * Historial completo de un cliente
 * Muestra turnos pasados, estadísticas y preferencias
 */

import { useState, useEffect } from 'react'
import {
  X, Calendar, Clock, DollarSign, TrendingUp, Star,
  CheckCircle, XCircle, AlertCircle, Loader2, Phone
} from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'
import { formatFechaCorta } from '../../utils/dateUtils'

export default function HistorialCliente({ clienteId, onClose }) {
  const [cliente, setCliente] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clienteId) {
      cargarHistorial()
    }
  }, [clienteId])

  const cargarHistorial = async () => {
    setLoading(true)
    try {
      const { userId } = await getEffectiveUserId()

      // Cargar cliente
      const { data: clienteData } = await supabase
        .from('agenda_clientes')
        .select('*')
        .eq('id', clienteId)
        .single()

      setCliente(clienteData)

      // Cargar todos los turnos del cliente
      const { data: turnosData } = await supabase
        .from('agenda_turnos')
        .select(`
          *,
          servicios:agenda_turno_servicios(
            id,
            precio,
            duracion,
            servicio:servicio_id(id, nombre, color)
          ),
          pagos:agenda_turno_pagos(
            id,
            tipo,
            monto,
            fecha_pago
          )
        `)
        .eq('cliente_id', clienteId)
        .order('fecha', { ascending: false })

      setTurnos(turnosData || [])

      // Calcular estadísticas
      calcularEstadisticas(turnosData || [])
    } catch (err) {
      console.error('Error cargando historial:', err)
    }
    setLoading(false)
  }

  const calcularEstadisticas = (turnosData) => {
    const stats = {
      totalTurnos: turnosData.length,
      completados: 0,
      cancelados: 0,
      noAsistio: 0,
      totalGastado: 0,
      promedioGasto: 0,
      ultimaVisita: null,
      primeraVisita: null,
      serviciosFavoritos: {},
      tasaAsistencia: 0
    }

    turnosData.forEach(turno => {
      // Contar por estado
      if (turno.estado === 'completado') {
        stats.completados++

        // Sumar pagos
        const pagos = turno.pagos || []
        pagos.forEach(pago => {
          if (pago.tipo !== 'devolucion') {
            stats.totalGastado += parseFloat(pago.monto) || 0
          } else {
            stats.totalGastado -= parseFloat(pago.monto) || 0
          }
        })

        // Contar servicios favoritos
        const servicios = turno.servicios || []
        servicios.forEach(s => {
          const nombre = s.servicio?.nombre || 'Sin nombre'
          stats.serviciosFavoritos[nombre] = (stats.serviciosFavoritos[nombre] || 0) + 1
        })
      } else if (turno.estado === 'cancelado') {
        stats.cancelados++
      } else if (turno.estado === 'no_asistio') {
        stats.noAsistio++
      }

      // Fechas
      if (!stats.ultimaVisita || turno.fecha > stats.ultimaVisita) {
        if (turno.estado === 'completado') {
          stats.ultimaVisita = turno.fecha
        }
      }
      if (!stats.primeraVisita || turno.fecha < stats.primeraVisita) {
        stats.primeraVisita = turno.fecha
      }
    })

    // Promedios y tasas
    if (stats.completados > 0) {
      stats.promedioGasto = stats.totalGastado / stats.completados
    }

    const turnosRelevantes = stats.completados + stats.cancelados + stats.noAsistio
    if (turnosRelevantes > 0) {
      stats.tasaAsistencia = (stats.completados / turnosRelevantes) * 100
    }

    // Top 3 servicios favoritos
    stats.topServicios = Object.entries(stats.serviciosFavoritos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))

    setEstadisticas(stats)
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { color: 'bg-yellow-100 text-yellow-700', label: 'Pendiente' },
      confirmado: { color: 'bg-green-100 text-green-700', label: 'Confirmado' },
      en_curso: { color: 'bg-blue-100 text-blue-700', label: 'En curso' },
      completado: { color: 'bg-gray-100 text-gray-700', label: 'Completado' },
      cancelado: { color: 'bg-red-100 text-red-700', label: 'Cancelado' },
      no_asistio: { color: 'bg-orange-100 text-orange-700', label: 'No asistió' }
    }
    return badges[estado] || { color: 'bg-gray-100 text-gray-600', label: estado }
  }

  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(monto || 0)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-500 mt-2">Cargando historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {cliente?.nombre}
            </h2>
            {cliente?.telefono && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Phone className="w-3 h-3" />
                {cliente.telefono}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  Total turnos
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {estadisticas.totalTurnos}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Completados
                </div>
                <p className="text-xl font-bold text-green-600">
                  {estadisticas.completados}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <DollarSign className="w-4 h-4" />
                  Total gastado
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {formatMonto(estadisticas.totalGastado)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Asistencia
                </div>
                <p className={`text-xl font-bold ${
                  estadisticas.tasaAsistencia >= 80 ? 'text-green-600' :
                  estadisticas.tasaAsistencia >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {estadisticas.tasaAsistencia.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Servicios favoritos */}
            {estadisticas.topServicios.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Servicios más frecuentes
                </p>
                <div className="flex flex-wrap gap-2">
                  {estadisticas.topServicios.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {s.nombre} ({s.cantidad}x)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              {estadisticas.primeraVisita && (
                <span>
                  Primera visita: {formatFechaCorta(estadisticas.primeraVisita)}
                </span>
              )}
              {estadisticas.ultimaVisita && (
                <span>
                  Última visita: {formatFechaCorta(estadisticas.ultimaVisita)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Lista de turnos */}
        <div className="max-h-[400px] overflow-y-auto">
          {turnos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay turnos registrados</p>
            </div>
          ) : (
            <div className="divide-y">
              {turnos.map(turno => {
                const badge = getEstadoBadge(turno.estado)
                const servicios = turno.servicios || []
                const pagos = turno.pagos || []
                const totalPagado = pagos.reduce((acc, p) =>
                  acc + (p.tipo !== 'devolucion' ? parseFloat(p.monto) : -parseFloat(p.monto)), 0
                )

                return (
                  <div key={turno.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {formatFechaCorta(turno.fecha)}
                          </span>
                          <span className="text-gray-500">
                            {turno.hora_inicio?.substring(0, 5)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Servicios */}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {servicios.map((s, i) => (
                            <span
                              key={i}
                              className="text-sm text-gray-600"
                              style={{
                                borderLeft: `3px solid ${s.servicio?.color || '#6B7280'}`,
                                paddingLeft: '6px'
                              }}
                            >
                              {s.servicio?.nombre || 'Servicio'}
                            </span>
                          ))}
                        </div>

                        {/* Notas */}
                        {turno.notas && (
                          <p className="mt-1 text-sm text-gray-500 italic">
                            {turno.notas}
                          </p>
                        )}
                      </div>

                      {/* Monto */}
                      {totalPagado > 0 && (
                        <span className="text-sm font-medium text-gray-700">
                          {formatMonto(totalPagado)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
