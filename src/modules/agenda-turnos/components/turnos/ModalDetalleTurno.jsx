/**
 * Modal de detalle de turno con pagos
 */

import { useState } from 'react'
import {
  X, Calendar, Clock, User, Scissors, DollarSign, CreditCard,
  Check, AlertCircle, Loader2, Phone, MessageCircle, Edit2,
  Wallet, Undo2, CheckCircle2, XCircle, Ban, Send, History
} from 'lucide-react'
import { formatearMonto, formatearHora, ESTADOS_TURNO } from '../../utils/formatters'
import { formatFechaLarga, formatDuracion } from '../../utils/dateUtils'
import { usePagosTurno, useSenaRequerida } from '../../hooks/usePagos'
import { generarLinkRecordatorio, abrirWhatsApp } from '../../utils/whatsappUtils'
import ModalPago from '../pagos/ModalPago'

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
              onClick={() => onCambiarEstado?.(turno.id, 'cancelado')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        )
      case 'confirmado':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onCambiarEstado?.(turno.id, 'en_curso')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              <Clock className="w-4 h-4" />
              Iniciar turno
            </button>
            <button
              onClick={() => onCambiarEstado?.(turno.id, 'no_asistio')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
            >
              <Ban className="w-4 h-4" />
              No asistió
            </button>
          </div>
        )
      case 'en_curso':
        return (
          <button
            onClick={() => onCambiarEstado?.(turno.id, 'completado')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Finalizar turno
          </button>
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

              {/* Pagos */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pagos
                </h4>

                {loadingPagos ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pagos.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-3">
                        No hay pagos registrados
                      </p>
                    ) : (
                      pagos.map(pago => (
                        <div key={pago.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              pago.tipo === 'sena' ? 'bg-amber-100 text-amber-600' :
                              pago.tipo === 'devolucion' ? 'bg-red-100 text-red-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {pago.tipo === 'sena' ? <Wallet className="w-4 h-4" /> :
                               pago.tipo === 'devolucion' ? <Undo2 className="w-4 h-4" /> :
                               <DollarSign className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {pago.tipo === 'sena' ? 'Seña' : pago.tipo === 'devolucion' ? 'Devolución' : 'Pago'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {pago.metodo_pago?.nombre || 'Efectivo'}
                                {pago.registrado_en_caja && (
                                  <span className="ml-2 text-green-600">• En caja</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className={`font-semibold ${pago.tipo === 'devolucion' ? 'text-red-600' : 'text-gray-900'}`}>
                            {pago.tipo === 'devolucion' ? '-' : ''}{formatearMonto(pago.monto)}
                          </span>
                        </div>
                      ))
                    )}

                    {/* Resumen de pagos */}
                    {resumen && (
                      <div className="bg-blue-50 rounded-lg p-3 mt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total servicios</span>
                          <span className="font-medium">{formatearMonto(resumen.precioTotal)}</span>
                        </div>
                        {resumen.totalSenas > 0 && (
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-600">Seña cobrada</span>
                            <span className="font-medium text-amber-600">-{formatearMonto(resumen.totalSenas)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm mt-1 pt-2 border-t border-blue-200">
                          <span className="font-medium text-gray-700">Saldo pendiente</span>
                          <span className={`font-bold ${resumen.saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {resumen.saldoPendiente > 0 ? formatearMonto(resumen.saldoPendiente) : 'Pagado'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Botones de pago */}
                    <div className="flex gap-2 mt-3">
                      {resumen?.saldoPendiente > 0 && (
                        <>
                          {requiereSena && !pagos.some(p => p.tipo === 'sena') && (
                            <button
                              onClick={() => setModalPago({ abierto: true, tipo: 'sena' })}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg font-medium text-sm"
                            >
                              <Wallet className="w-4 h-4" />
                              Cobrar seña
                            </button>
                          )}
                          <button
                            onClick={() => setModalPago({ abierto: true, tipo: 'pago_final' })}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium text-sm"
                          >
                            <DollarSign className="w-4 h-4" />
                            Cobrar
                          </button>
                        </>
                      )}
                      {pagos.some(p => p.tipo === 'sena') && turno.estado === 'cancelado' && (
                        <button
                          onClick={() => setModalPago({ abierto: true, tipo: 'devolucion' })}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm"
                        >
                          <Undo2 className="w-4 h-4" />
                          Devolver seña
                        </button>
                      )}
                    </div>
                  </div>
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
    </>
  )
}
