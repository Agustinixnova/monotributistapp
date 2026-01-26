/**
 * Modal de detalle de turno con pagos
 */

import { useState, useEffect } from 'react'
import {
  X, Calendar, Clock, User, Scissors, DollarSign, CreditCard,
  Check, AlertCircle, Loader2, Phone, MessageCircle, Edit2,
  Wallet, Undo2, CheckCircle2, XCircle, Ban, Send, History,
  Banknote, Smartphone, QrCode, RotateCcw
} from 'lucide-react'
import { formatearMonto, formatearHora, ESTADOS_TURNO } from '../../utils/formatters'
import { formatFechaLarga, formatDuracion } from '../../utils/dateUtils'
import { usePagosTurno, useSenaRequerida } from '../../hooks/usePagos'
import { generarLinkRecordatorio, abrirWhatsApp } from '../../utils/whatsappUtils'
import ModalPago from '../pagos/ModalPago'

// Métodos de pago para el modal de finalizar
const METODOS_PAGO = [
  { id: 'efectivo', nombre: 'Efectivo', icono: Banknote, color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'transferencia', nombre: 'Transferencia', icono: CreditCard, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'mercadopago', nombre: 'MercadoPago', icono: Smartphone, color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { id: 'qr', nombre: 'QR', icono: QrCode, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'otro', nombre: 'Otro', icono: Wallet, color: 'bg-gray-100 text-gray-700 border-gray-300' }
]

export default function ModalDetalleTurno({
  isOpen,
  onClose,
  turno,
  onEditar,
  onCambiarEstado,
  onVerHistorial,
  onMarcarRecordatorio
}) {
  const [modalPago, setModalPago] = useState({ abierto: false, tipo: null })
  const [enviandoRecordatorio, setEnviandoRecordatorio] = useState(false)
  const [modalFinalizar, setModalFinalizar] = useState(false)
  const [metodoPagoFinal, setMetodoPagoFinal] = useState(null)
  const [finalizando, setFinalizando] = useState(false)
  const [modalCancelar, setModalCancelar] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  const {
    pagos,
    loading: loadingPagos,
    resumen,
    agregarPago,
    enviarACaja
  } = usePagosTurno(turno?.id, turno)

  // Calcular seña requerida
  const servicios = turno?.agenda_turno_servicios || turno?.servicios || []
  const { requiereSena, montoSena } = useSenaRequerida(servicios)

  if (!isOpen || !turno) return null

  const cliente = turno.cliente || turno.agenda_clientes
  const estadoConfig = ESTADOS_TURNO[turno.estado] || ESTADOS_TURNO.pendiente

  // Handler para enviar recordatorio WhatsApp
  const handleEnviarRecordatorio = () => {
    const serviciosInfo = servicios.map(s => ({
      nombre: s.servicio?.nombre || s.agenda_servicios?.nombre || 'Servicio'
    }))

    const link = generarLinkRecordatorio(turno, cliente, serviciosInfo)
    if (link) {
      abrirWhatsApp(link)
      // Marcar como enviado
      if (onMarcarRecordatorio) {
        onMarcarRecordatorio(turno.id)
      }
    }
  }

  // Info para pasar a ModalPago
  const turnoInfo = {
    cliente_nombre: cliente ? `${cliente.nombre} ${cliente.apellido || ''}` : 'Cliente',
    servicios_nombres: servicios.map(s => s.servicio?.nombre || s.agenda_servicios?.nombre || 'Servicio').join(', ')
  }

  // Handler para guardar pago
  const handleGuardarPago = async (pagoData) => {
    const pago = await agregarPago(pagoData)

    // Si quiere registrar en caja, hacerlo
    if (pagoData.registrarEnCaja) {
      await enviarACaja(pago.id, turnoInfo)
    }
  }

  // Handler para finalizar turno con pago
  const handleFinalizarTurno = async () => {
    // Si hay saldo pendiente, mostrar modal de pago
    if (resumen?.saldoPendiente > 0) {
      setModalFinalizar(true)
      return
    }
    // Si no hay saldo pendiente, finalizar directamente
    onCambiarEstado?.(turno.id, 'completado')
  }

  // Handler para confirmar finalización con pago
  const handleConfirmarFinalizacion = async () => {
    if (!metodoPagoFinal || !resumen?.saldoPendiente) return

    setFinalizando(true)
    try {
      // Registrar el pago final
      await agregarPago({
        tipo: 'pago_final',
        monto: resumen.saldoPendiente,
        metodo_pago_id: null,
        fecha_pago: new Date().toISOString().split('T')[0],
        notas: `Pago: ${METODOS_PAGO.find(m => m.id === metodoPagoFinal)?.nombre || metodoPagoFinal}`
      })

      // Cerrar modal y cambiar estado
      setModalFinalizar(false)
      setMetodoPagoFinal(null)
      onCambiarEstado?.(turno.id, 'completado')
    } catch (error) {
      console.error('Error al finalizar turno:', error)
    } finally {
      setFinalizando(false)
    }
  }

  // Handler para finalizar sin cobrar
  const handleFinalizarSinCobrar = () => {
    setModalFinalizar(false)
    setMetodoPagoFinal(null)
    onCambiarEstado?.(turno.id, 'completado')
  }

  // Handler para cancelar turno
  const handleCancelarTurno = () => {
    // Si tiene seña pagada, mostrar modal de opciones
    const tieneSenaPagada = pagos.some(p => p.tipo === 'sena')
    if (tieneSenaPagada) {
      setModalCancelar(true)
    } else {
      // Cancelar directamente
      onCambiarEstado?.(turno.id, 'cancelado')
    }
  }

  // Cancelar y devolver seña
  const handleCancelarConDevolucion = async () => {
    // Verificar si ya hay devolución registrada
    const yaHayDevolucion = pagos.some(p => p.tipo === 'devolucion')
    if (yaHayDevolucion) {
      // Ya hay devolución, solo cancelar
      setModalCancelar(false)
      onCambiarEstado?.(turno.id, 'cancelado')
      onClose?.() // Cerrar modal principal
      return
    }

    setCancelando(true)
    try {
      // Registrar devolución
      const totalSenas = pagos.filter(p => p.tipo === 'sena').reduce((sum, p) => sum + p.monto, 0)
      await agregarPago({
        tipo: 'devolucion',
        monto: totalSenas,
        metodo_pago_id: null,
        fecha_pago: new Date().toISOString().split('T')[0],
        notas: 'Devolución por cancelación'
      })
      // Cancelar turno y cerrar modales
      setModalCancelar(false)
      onCambiarEstado?.(turno.id, 'cancelado')
      onClose?.() // Cerrar modal principal
    } catch (error) {
      console.error('Error al devolver seña:', error)
    } finally {
      setCancelando(false)
    }
  }

  // Cancelar sin devolver (cliente reprogramará)
  const handleCancelarSinDevolucion = () => {
    setModalCancelar(false)
    onCambiarEstado?.(turno.id, 'cancelado')
    onClose?.() // Cerrar modal principal
  }

  // Botones de acción rápida según estado
  const renderAccionesEstado = () => {
    switch (turno.estado) {
      case 'pendiente':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onCambiarEstado?.(turno.id, 'confirmado')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              <Check className="w-4 h-4" />
              Confirmar
            </button>
            <button
              onClick={handleCancelarTurno}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        )
      case 'confirmado':
      case 'en_curso': // Mantener compatibilidad con turnos existentes
        return (
          <div className="flex gap-2">
            <button
              onClick={handleFinalizarTurno}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar
            </button>
            <button
              onClick={() => onCambiarEstado?.(turno.id, 'no_asistio')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
            >
              <XCircle className="w-4 h-4" />
              No asistió
            </button>
            <button
              onClick={handleCancelarTurno}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className={`px-5 py-4 flex items-center justify-between ${estadoConfig.bgClass}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ${estadoConfig.textClass}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-heading font-semibold text-lg ${estadoConfig.textClass}`}>
                    Detalle del Turno
                  </h3>
                  <span className={`text-sm ${estadoConfig.textClass} opacity-80`}>
                    {estadoConfig.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditar?.(turno)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Edit2 className={`w-5 h-5 ${estadoConfig.textClass}`} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X className={`w-5 h-5 ${estadoConfig.textClass}`} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Fecha y hora */}
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatFechaLarga(turno.fecha)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatearHora(turno.hora_inicio)} - {formatearHora(turno.hora_fin)}</span>
                </div>
              </div>

              {/* Cliente */}
              {cliente && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                      {cliente.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {cliente.nombre} {cliente.apellido || ''}
                      </p>
                      {(cliente.whatsapp || cliente.telefono) && (
                        <p className="text-sm text-gray-500">{cliente.whatsapp || cliente.telefono}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {onVerHistorial && (
                        <button
                          onClick={() => onVerHistorial(cliente.id)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                          title="Ver historial"
                        >
                          <History className="w-5 h-5" />
                        </button>
                      )}
                      {(cliente.whatsapp || cliente.telefono) && (
                        <a
                          href={`https://wa.me/${(cliente.whatsapp || cliente.telefono).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                          title="Abrir WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Botón enviar recordatorio */}
                  {['pendiente', 'confirmado'].includes(turno.estado) && (cliente.whatsapp || cliente.telefono) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={handleEnviarRecordatorio}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm ${
                          turno.recordatorio_enviado
                            ? 'bg-green-100 text-green-700'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        {turno.recordatorio_enviado ? 'Recordatorio enviado ✓' : 'Enviar recordatorio'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Servicios */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Servicios
                </h4>
                <div className="space-y-2">
                  {servicios.map((s, i) => {
                    const servicio = s.servicio || s.agenda_servicios || s
                    return (
                      <div key={i} className="flex items-center justify-between bg-white border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2 h-8 rounded-full"
                            style={{ backgroundColor: servicio.color || '#6366F1' }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{servicio.nombre}</p>
                            <p className="text-xs text-gray-500">{formatDuracion(s.duracion || servicio.duracion_minutos)}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">{formatearMonto(s.precio)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Cobros - Flujo simplificado */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cobros
                </h4>

                {loadingPagos ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* Card de Seña */}
                    {(montoSena > 0 || pagos.some(p => p.tipo === 'sena')) && (
                      <div className={`rounded-xl p-4 ${
                        pagos.some(p => p.tipo === 'sena')
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              pagos.some(p => p.tipo === 'sena')
                                ? 'bg-amber-200 text-amber-700'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                              <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Seña</p>
                              {pagos.some(p => p.tipo === 'sena') ? (
                                <p className="text-sm text-amber-600">
                                  {pagos.find(p => p.tipo === 'sena')?.notas?.replace('Pago: ', '') || 'Cobrada'}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500">Sugerido: {formatearMonto(montoSena)}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {pagos.some(p => p.tipo === 'sena') ? (
                              <>
                                <p className="font-bold text-amber-700">
                                  {formatearMonto(pagos.filter(p => p.tipo === 'sena').reduce((sum, p) => sum + p.monto, 0))}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <Check className="w-3 h-3" />
                                  Cobrada
                                </div>
                              </>
                            ) : turno.estado !== 'cancelado' ? (
                              <button
                                onClick={() => setModalPago({ abierto: true, tipo: 'sena' })}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm"
                              >
                                Registrar seña
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card de Saldo / Pago final */}
                    <div className={`rounded-xl p-4 ${
                      resumen?.estaPagado
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-white border border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            resumen?.estaPagado
                              ? 'bg-green-200 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {resumen?.estaPagado ? 'Pagado' : 'Saldo pendiente'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Total: {formatearMonto(resumen?.precioTotal || 0)}
                              {resumen?.totalSenas > 0 && ` - Seña: ${formatearMonto(resumen.totalSenas)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {resumen?.estaPagado ? (
                            <>
                              <p className="font-bold text-green-700">{formatearMonto(resumen?.precioTotal || 0)}</p>
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="w-3 h-3" />
                                Completado
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-gray-900 mb-1">
                                {formatearMonto(resumen?.saldoPendiente || resumen?.precioTotal || 0)}
                              </p>
                              {/* No mostrar botón de completar pago si está cancelado */}
                              {turno.estado !== 'cancelado' && (
                                <button
                                  onClick={() => setModalPago({ abierto: true, tipo: 'pago_final' })}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
                                >
                                  Completar pago
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Historial de pagos (colapsable si hay) */}
                    {pagos.length > 0 && (
                      <details className="bg-gray-50 rounded-lg">
                        <summary className="px-4 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 rounded-lg">
                          Ver historial de pagos ({pagos.length})
                        </summary>
                        <div className="px-4 pb-3 space-y-2">
                          {pagos.map(pago => {
                            // Formatear fecha y hora
                            const fechaPago = pago.fecha_pago || pago.created_at?.split('T')[0]
                            const horaPago = pago.created_at ? new Date(pago.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''

                            return (
                              <div key={pago.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-200 last:border-0">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${
                                      pago.tipo === 'sena' ? 'text-amber-700' :
                                      pago.tipo === 'devolucion' ? 'text-red-700' :
                                      'text-green-700'
                                    }`}>
                                      {pago.tipo === 'sena' ? 'Seña' : pago.tipo === 'devolucion' ? 'Devolución' : 'Pago'}
                                    </span>
                                    <span className="text-gray-400">
                                      {pago.notas?.replace('Pago: ', '') || 'Efectivo'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {fechaPago} {horaPago && `• ${horaPago}`}
                                  </p>
                                </div>
                                <span className={`font-medium ${pago.tipo === 'devolucion' ? 'text-red-600' : ''}`}>
                                  {pago.tipo === 'devolucion' ? '-' : ''}{formatearMonto(pago.monto)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )}
                  </>
                )}
              </div>

              {/* Notas */}
              {turno.notas && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500 mb-1">Notas</p>
                  <p className="text-gray-700">{turno.notas}</p>
                </div>
              )}
            </div>

            {/* Footer - Acciones de estado */}
            {['pendiente', 'confirmado', 'en_curso'].includes(turno.estado) && (
              <div className="border-t p-4">
                {renderAccionesEstado()}
              </div>
            )}

            {/* Footer para turnos cancelados - Retomar turno */}
            {turno.estado === 'cancelado' && (
              <div className="border-t p-4">
                <button
                  onClick={() => {
                    onCambiarEstado?.(turno.id, 'pendiente')
                    onClose?.()
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retomar turno
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      <ModalPago
        isOpen={modalPago.abierto}
        onClose={() => setModalPago({ abierto: false, tipo: null })}
        onGuardar={handleGuardarPago}
        tipo={modalPago.tipo}
        montoSugerido={montoSena}
        saldoPendiente={resumen?.saldoPendiente || 0}
        turnoInfo={turnoInfo}
      />

      {/* Modal de finalizar turno con cobro */}
      {modalFinalizar && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => !finalizando && setModalFinalizar(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      Cobrar y finalizar
                    </h3>
                    <p className="text-sm text-gray-600">
                      Saldo pendiente: <span className="font-semibold text-emerald-600">{formatearMonto(resumen?.saldoPendiente || 0)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-4">¿Cómo pagó el cliente?</p>

                <div className="grid grid-cols-2 gap-2">
                  {METODOS_PAGO.map(metodo => {
                    const Icono = metodo.icono
                    const seleccionado = metodoPagoFinal === metodo.id
                    return (
                      <button
                        key={metodo.id}
                        onClick={() => setMetodoPagoFinal(metodo.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          seleccionado
                            ? metodo.color + ' border-current'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icono className="w-5 h-5" />
                        <span className="text-sm font-medium">{metodo.nombre}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t bg-gray-50 flex gap-2">
                <button
                  onClick={handleFinalizarSinCobrar}
                  disabled={finalizando}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm"
                >
                  Sin cobrar
                </button>
                <button
                  onClick={handleConfirmarFinalizacion}
                  disabled={!metodoPagoFinal || finalizando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
                >
                  {finalizando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Cobrar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cancelar turno con seña */}
      {modalCancelar && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => !cancelando && setModalCancelar(false)} />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">
                      Cancelar turno
                    </h3>
                    <p className="text-sm text-gray-600">
                      Este turno tiene seña de <span className="font-semibold text-amber-600">
                        {formatearMonto(pagos.filter(p => p.tipo === 'sena').reduce((sum, p) => sum + p.monto, 0))}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-4">¿Qué hacemos con la seña?</p>

                <div className="space-y-3">
                  <button
                    onClick={handleCancelarConDevolucion}
                    disabled={cancelando}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                      <Undo2 className="w-5 h-5 text-red-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Devolver seña</p>
                      <p className="text-xs text-gray-500">El cliente no reprogramará</p>
                    </div>
                  </button>

                  <button
                    onClick={handleCancelarSinDevolucion}
                    disabled={cancelando}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Mantener seña</p>
                      <p className="text-xs text-gray-500">El cliente reprogramará para otro día</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t bg-gray-50">
                <button
                  onClick={() => setModalCancelar(false)}
                  disabled={cancelando}
                  className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Volver
                </button>
              </div>

              {cancelando && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
