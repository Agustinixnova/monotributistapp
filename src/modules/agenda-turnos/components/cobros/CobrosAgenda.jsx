/**
 * Caja Simple para Agenda - Vista de cobros
 * Muestra los pagos recibidos (señas y pagos finales) de forma simple
 */

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, CreditCard, Banknote, Smartphone, QrCode, Wallet, Clock, User, Check, AlertCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import { getEffectiveUserId } from '../../../caja-diaria/services/empleadosService'
import { formatearMonto } from '../../utils/formatters'
import { getFechaHoyArgentina, formatFechaLarga } from '../../utils/dateUtils'

// Períodos de filtro
const PERIODOS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mes' },
]

// Iconos por método de pago (extraído de las notas)
const getMetodoIcono = (notas) => {
  if (!notas) return Wallet
  const notasLower = notas.toLowerCase()
  if (notasLower.includes('efectivo')) return Banknote
  if (notasLower.includes('transferencia')) return CreditCard
  if (notasLower.includes('mercadopago')) return Smartphone
  if (notasLower.includes('qr')) return QrCode
  return Wallet
}

const getMetodoNombre = (notas) => {
  if (!notas) return 'Otro'
  if (notas.includes('Efectivo')) return 'Efectivo'
  if (notas.includes('Transferencia')) return 'Transferencia'
  if (notas.includes('MercadoPago')) return 'MercadoPago'
  if (notas.includes('QR')) return 'QR'
  return 'Otro'
}

export default function CobrosAgenda() {
  const [periodo, setPeriodo] = useState('hoy')
  const [fechaCustom, setFechaCustom] = useState(getFechaHoyArgentina())
  const [cobros, setCobros] = useState([])
  const [turnosPendientes, setTurnosPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [totales, setTotales] = useState({
    total: 0,
    efectivo: 0,
    transferencia: 0,
    mercadopago: 0,
    qr: 0,
    otro: 0
  })

  // Calcular rango de fechas según período
  const calcularRangoFechas = () => {
    const hoy = getFechaHoyArgentina()

    if (periodo === 'hoy') {
      return { desde: hoy, hasta: hoy }
    }

    if (periodo === 'semana') {
      const fecha = new Date(hoy + 'T12:00:00')
      const diaSemana = fecha.getDay()
      const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana
      const lunes = new Date(fecha)
      lunes.setDate(fecha.getDate() + diffLunes)
      const domingo = new Date(lunes)
      domingo.setDate(lunes.getDate() + 6)

      return {
        desde: lunes.toISOString().split('T')[0],
        hasta: domingo.toISOString().split('T')[0]
      }
    }

    if (periodo === 'mes') {
      const fecha = new Date(hoy + 'T12:00:00')
      const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)

      return {
        desde: primerDia.toISOString().split('T')[0],
        hasta: ultimoDia.toISOString().split('T')[0]
      }
    }

    return { desde: fechaCustom, hasta: fechaCustom }
  }

  // Cargar cobros
  useEffect(() => {
    const cargarCobros = async () => {
      setLoading(true)

      try {
        const { userId } = await getEffectiveUserId()
        if (!userId) return

        const { desde, hasta } = calcularRangoFechas()

        // Obtener pagos del período
        const { data: pagos, error } = await supabase
          .from('agenda_turno_pagos')
          .select(`
            *,
            turno:agenda_turnos(
              id,
              fecha,
              hora_inicio,
              cliente:agenda_clientes(nombre, apellido),
              servicios:agenda_turno_servicios(
                servicio:agenda_servicios(nombre)
              )
            )
          `)
          .gte('fecha_pago', desde)
          .lte('fecha_pago', hasta)
          .order('fecha_pago', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) throw error

        // Filtrar solo los del usuario (a través del turno)
        const pagosUsuario = pagos?.filter(p => p.turno) || []
        setCobros(pagosUsuario)

        // Calcular totales
        const nuevosTotales = {
          total: 0,
          efectivo: 0,
          transferencia: 0,
          mercadopago: 0,
          qr: 0,
          otro: 0
        }

        pagosUsuario.forEach(pago => {
          nuevosTotales.total += pago.monto
          const metodo = getMetodoNombre(pago.notas).toLowerCase()
          if (nuevosTotales[metodo] !== undefined) {
            nuevosTotales[metodo] += pago.monto
          } else {
            nuevosTotales.otro += pago.monto
          }
        })

        setTotales(nuevosTotales)

        // Obtener turnos del día con seña pendiente
        if (periodo === 'hoy') {
          const { data: turnos } = await supabase
            .from('agenda_turnos')
            .select(`
              id,
              fecha,
              hora_inicio,
              estado,
              cliente:agenda_clientes(nombre, apellido),
              servicios:agenda_turno_servicios(
                precio,
                servicio:agenda_servicios(nombre, requiere_sena, porcentaje_sena)
              ),
              pagos:agenda_turno_pagos(monto, tipo)
            `)
            .eq('duenio_id', userId)
            .eq('fecha', desde)
            .in('estado', ['pendiente', 'confirmado', 'en_curso'])

          // Filtrar turnos que tienen seña configurada pero no pagada
          const pendientes = turnos?.filter(t => {
            const requiereSena = t.servicios?.some(s => s.servicio?.requiere_sena)
            const tieneSenaPagada = t.pagos?.some(p => p.tipo === 'sena')
            return requiereSena && !tieneSenaPagada
          }) || []

          setTurnosPendientes(pendientes)
        } else {
          setTurnosPendientes([])
        }

      } catch (error) {
        console.error('Error cargando cobros:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarCobros()
  }, [periodo, fechaCustom])

  const { desde, hasta } = calcularRangoFechas()

  return (
    <div className="space-y-4">
      {/* Filtro de período */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {PERIODOS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              periodo === p.id
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium opacity-90">
            {periodo === 'hoy' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : 'Este mes'}
          </h3>
          <DollarSign className="w-5 h-5 opacity-70" />
        </div>
        <p className="text-3xl font-bold mb-1">{formatearMonto(totales.total)}</p>
        <p className="text-sm opacity-80">{cobros.length} cobro{cobros.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Desglose por método */}
      {totales.total > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {totales.efectivo > 0 && (
            <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
              <Banknote className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600">Efectivo</p>
                <p className="font-semibold text-green-800">{formatearMonto(totales.efectivo)}</p>
              </div>
            </div>
          )}
          {totales.transferencia > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600">Transferencia</p>
                <p className="font-semibold text-blue-800">{formatearMonto(totales.transferencia)}</p>
              </div>
            </div>
          )}
          {totales.mercadopago > 0 && (
            <div className="bg-sky-50 rounded-lg p-3 flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-sky-600" />
              <div>
                <p className="text-xs text-sky-600">MercadoPago</p>
                <p className="font-semibold text-sky-800">{formatearMonto(totales.mercadopago)}</p>
              </div>
            </div>
          )}
          {totales.qr > 0 && (
            <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-3">
              <QrCode className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600">QR</p>
                <p className="font-semibold text-purple-800">{formatearMonto(totales.qr)}</p>
              </div>
            </div>
          )}
          {totales.otro > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Otro</p>
                <p className="font-semibold text-gray-800">{formatearMonto(totales.otro)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Señas pendientes (solo hoy) */}
      {turnosPendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium text-amber-800">Señas pendientes hoy</h4>
          </div>
          <div className="space-y-2">
            {turnosPendientes.map(turno => {
              const senaSugerida = turno.servicios?.reduce((sum, s) => {
                if (s.servicio?.requiere_sena && s.servicio?.porcentaje_sena) {
                  return sum + Math.round((s.precio * s.servicio.porcentaje_sena) / 100)
                }
                return sum
              }, 0) || 0

              return (
                <div key={turno.id} className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {turno.cliente?.nombre} {turno.cliente?.apellido || ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {turno.hora_inicio?.substring(0, 5)} • {turno.servicios?.map(s => s.servicio?.nombre).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-700">
                        {formatearMonto(senaSugerida)}
                      </p>
                      <p className="text-xs text-amber-600">sugerida</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lista de cobros */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Movimientos</h4>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : cobros.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No hay cobros en este período</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cobros.map(cobro => {
              const MetodoIcono = getMetodoIcono(cobro.notas)
              const metodoNombre = getMetodoNombre(cobro.notas)
              const clienteNombre = cobro.turno?.cliente
                ? `${cobro.turno.cliente.nombre} ${cobro.turno.cliente.apellido || ''}`.trim()
                : 'Cliente'
              const serviciosNombres = cobro.turno?.servicios
                ?.map(s => s.servicio?.nombre)
                .filter(Boolean)
                .join(', ') || 'Servicio'

              return (
                <div
                  key={cobro.id}
                  className="bg-white border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      cobro.tipo === 'sena' ? 'bg-amber-100' : 'bg-emerald-100'
                    }`}>
                      <MetodoIcono className={`w-5 h-5 ${
                        cobro.tipo === 'sena' ? 'text-amber-600' : 'text-emerald-600'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{clienteNombre}</p>
                        <p className={`font-semibold ${
                          cobro.tipo === 'sena' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          +{formatearMonto(cobro.monto)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{serviciosNombres}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          cobro.tipo === 'sena'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {cobro.tipo === 'sena' ? 'Seña' : 'Pago'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {metodoNombre}
                        </span>
                        {cobro.turno?.hora_inicio && (
                          <span className="text-xs text-gray-400">
                            • {cobro.turno.hora_inicio.substring(0, 5)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
