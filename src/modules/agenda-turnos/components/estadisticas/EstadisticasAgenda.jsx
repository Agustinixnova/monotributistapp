/**
 * Dashboard de estadísticas de la agenda
 */

import { useState, useEffect } from 'react'
import {
  Calendar, DollarSign, Users, TrendingUp, TrendingDown,
  Clock, CheckCircle, XCircle, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight, Scissors
} from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'

export default function EstadisticasAgenda({ profesionalId = null }) {
  const [periodo, setPeriodo] = useState('mes') // semana, mes, anio
  const [fechaBase, setFechaBase] = useState(new Date())
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [periodo, fechaBase, profesionalId])

  const getFechasRango = () => {
    const fecha = new Date(fechaBase)
    let inicio, fin

    if (periodo === 'semana') {
      const diaSemana = fecha.getDay()
      inicio = new Date(fecha)
      inicio.setDate(fecha.getDate() - diaSemana + 1) // Lunes
      fin = new Date(inicio)
      fin.setDate(inicio.getDate() + 6) // Domingo
    } else if (periodo === 'mes') {
      inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
    } else { // anio
      inicio = new Date(fecha.getFullYear(), 0, 1)
      fin = new Date(fecha.getFullYear(), 11, 31)
    }

    return {
      inicio: inicio.toISOString().split('T')[0],
      fin: fin.toISOString().split('T')[0]
    }
  }

  const cargarEstadisticas = async () => {
    setLoading(true)
    try {
      const { userId, esDuenio } = await getEffectiveUserId()
      const { inicio, fin } = getFechasRango()

      // Query base de turnos
      let query = supabase
        .from('agenda_turnos')
        .select(`
          id,
          fecha,
          hora_inicio,
          hora_fin,
          estado,
          profesional_id,
          servicios:agenda_turno_servicios(
            precio,
            duracion
          ),
          pagos:agenda_turno_pagos(
            tipo,
            monto
          )
        `)
        .gte('fecha', inicio)
        .lte('fecha', fin)

      // Filtrar por dueño o profesional específico
      if (profesionalId && profesionalId !== 'todos') {
        query = query.eq('profesional_id', profesionalId)
      } else if (esDuenio) {
        query = query.eq('duenio_id', userId)
      } else {
        query = query.eq('profesional_id', userId)
      }

      const { data: turnos, error } = await query

      if (error) throw error

      // Calcular estadísticas
      const estadisticas = calcularStats(turnos || [])
      setStats(estadisticas)

    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    }
    setLoading(false)
  }

  const calcularStats = (turnos) => {
    const stats = {
      totalTurnos: turnos.length,
      completados: 0,
      cancelados: 0,
      noAsistio: 0,
      pendientes: 0,
      ingresoTotal: 0,
      ingresoPorCompletado: 0,
      serviciosPorTurno: 0,
      turnosPorDia: {},
      serviciosMasVendidos: {},
      tasaCompletado: 0,
      tasaCancelacion: 0
    }

    let totalServicios = 0

    turnos.forEach(turno => {
      // Contar estados
      switch (turno.estado) {
        case 'completado':
          stats.completados++
          break
        case 'cancelado':
          stats.cancelados++
          break
        case 'no_asistio':
          stats.noAsistio++
          break
        case 'pendiente':
        case 'confirmado':
          stats.pendientes++
          break
      }

      // Contar por día de la semana
      const fecha = new Date(turno.fecha + 'T12:00:00')
      const dia = fecha.getDay()
      stats.turnosPorDia[dia] = (stats.turnosPorDia[dia] || 0) + 1

      // Sumar ingresos de turnos completados
      if (turno.estado === 'completado') {
        const pagos = turno.pagos || []
        pagos.forEach(pago => {
          if (pago.tipo !== 'devolucion') {
            stats.ingresoTotal += parseFloat(pago.monto) || 0
          } else {
            stats.ingresoTotal -= parseFloat(pago.monto) || 0
          }
        })
      }

      // Contar servicios
      const servicios = turno.servicios || []
      totalServicios += servicios.length
    })

    // Calcular promedios y tasas
    if (stats.completados > 0) {
      stats.ingresoPorCompletado = stats.ingresoTotal / stats.completados
    }

    if (turnos.length > 0) {
      stats.serviciosPorTurno = totalServicios / turnos.length
    }

    const turnosFinalizados = stats.completados + stats.cancelados + stats.noAsistio
    if (turnosFinalizados > 0) {
      stats.tasaCompletado = (stats.completados / turnosFinalizados) * 100
      stats.tasaCancelacion = ((stats.cancelados + stats.noAsistio) / turnosFinalizados) * 100
    }

    // Convertir turnos por día a array ordenado
    stats.turnosPorDiaArray = [1, 2, 3, 4, 5, 6, 0].map(dia => ({
      dia,
      nombre: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dia],
      cantidad: stats.turnosPorDia[dia] || 0
    }))

    // Máximo para la barra de progreso
    stats.maxTurnosDia = Math.max(...stats.turnosPorDiaArray.map(d => d.cantidad), 1)

    return stats
  }

  const navegarPeriodo = (direccion) => {
    const nueva = new Date(fechaBase)
    if (periodo === 'semana') {
      nueva.setDate(nueva.getDate() + (direccion * 7))
    } else if (periodo === 'mes') {
      nueva.setMonth(nueva.getMonth() + direccion)
    } else {
      nueva.setFullYear(nueva.getFullYear() + direccion)
    }
    setFechaBase(nueva)
  }

  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(monto || 0)
  }

  const getLabelPeriodo = () => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    if (periodo === 'semana') {
      const { inicio, fin } = getFechasRango()
      return `${inicio.split('-')[2]}/${inicio.split('-')[1]} - ${fin.split('-')[2]}/${fin.split('-')[1]}`
    } else if (periodo === 'mes') {
      return `${meses[fechaBase.getMonth()]} ${fechaBase.getFullYear()}`
    } else {
      return `${fechaBase.getFullYear()}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'semana', label: 'Semana' },
            { id: 'mes', label: 'Mes' },
            { id: 'anio', label: 'Año' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                periodo === p.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Navegación */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navegarPeriodo(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-gray-900 min-w-[150px] text-center">
            {getLabelPeriodo()}
          </span>
          <button
            onClick={() => navegarPeriodo(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-500 mt-2">Cargando estadísticas...</p>
        </div>
      ) : stats ? (
        <>
          {/* Cards principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Total turnos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTurnos}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.pendientes} pendientes
              </p>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm">Ingresos</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatMonto(stats.ingresoTotal)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatMonto(stats.ingresoPorCompletado)} promedio
              </p>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">Completados</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.completados}</p>
              <p className={`text-sm mt-1 ${stats.tasaCompletado >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                {stats.tasaCompletado.toFixed(0)}% del total
              </p>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm">Cancelados</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelados + stats.noAsistio}</p>
              <p className={`text-sm mt-1 ${stats.tasaCancelacion <= 20 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.tasaCancelacion.toFixed(0)}% del total
              </p>
            </div>
          </div>

          {/* Distribución por día */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Turnos por día de la semana
            </h3>
            <div className="space-y-3">
              {stats.turnosPorDiaArray.map(d => (
                <div key={d.dia} className="flex items-center gap-3">
                  <span className="w-10 text-sm text-gray-600">{d.nombre}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(d.cantidad / stats.maxTurnosDia) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-medium text-gray-700 text-right">
                    {d.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de estados */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              Resumen de estados
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.completados}</p>
                  <p className="text-sm text-green-600">Completados</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pendientes}</p>
                  <p className="text-sm text-yellow-600">Pendientes</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.cancelados}</p>
                  <p className="text-sm text-red-600">Cancelados</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-700">{stats.noAsistio}</p>
                  <p className="text-sm text-orange-600">No asistió</p>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas adicionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-gray-500" />
                Promedio de servicios por turno
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {stats.serviciosPorTurno.toFixed(1)}
              </p>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-500" />
                Ticket promedio
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {formatMonto(stats.ingresoPorCompletado)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay datos para mostrar</p>
        </div>
      )}
    </div>
  )
}
