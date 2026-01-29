/**
 * Modal para registrar pago de turno (seña o pago final)
 * Versión simplificada con métodos de pago predefinidos
 */

import { useState, useEffect } from 'react'
import {
  X, DollarSign, Wallet, Loader2, Check, AlertCircle,
  Banknote, CreditCard, Smartphone, QrCode, MessageCircle, Save
} from 'lucide-react'
import { formatearMonto } from '../../utils/formatters'
import { getFechaHoyArgentina } from '../../utils/dateUtils'
import { useNegocio } from '../../hooks/useNegocio'

// Plantillas por defecto para mensajes de pago
const PLANTILLA_SENA_DEFAULT = `¡Hola {nombre}! 👋

Para completar la seña de *{monto}*, podés transferir a:

💳 *Alias:* {alias}

Una vez que hagas la transferencia, enviame el comprobante por acá 📲

¡Gracias! ✨
{negocio}`

const PLANTILLA_PAGO_DEFAULT = `¡Hola {nombre}! 👋

Para completar el pago de *{monto}*, podés transferir a:

💳 *Alias:* {alias}

Una vez que hagas la transferencia, enviame el comprobante por acá 📲

¡Gracias! ✨
{negocio}`

// Métodos de pago predefinidos
const METODOS_PAGO = [
  { id: 'efectivo', nombre: 'Efectivo', icono: Banknote, color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'transferencia', nombre: 'Transferencia', icono: CreditCard, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'mercadopago', nombre: 'MercadoPago', icono: Smartphone, color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { id: 'qr', nombre: 'QR', icono: QrCode, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'canje', nombre: 'Canje/Gratis', icono: Wallet, color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { id: 'otro', nombre: 'Otro', icono: Wallet, color: 'bg-gray-100 text-gray-700 border-gray-300' }
]

export default function ModalPago({
  isOpen,
  onClose,
  onGuardar,
  tipo = 'sena', // 'sena', 'pago_final', 'devolucion'
  montoSugerido = 0,
  saldoPendiente = 0,
  turnoInfo = {}
}) {
  const [monto, setMonto] = useState(0)
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [mostrarOpcionesTransferencia, setMostrarOpcionesTransferencia] = useState(false)

  // Hook para obtener datos del negocio (alias_pago)
  const { negocio } = useNegocio()

  // Reset form al abrir
  useEffect(() => {
    if (isOpen) {
      const montoInicial = tipo === 'pago_final' ? saldoPendiente : montoSugerido
      setMonto(montoInicial || 0)
      setMetodoPago('efectivo')
      setError(null)
      setMostrarOpcionesTransferencia(false)
    }
  }, [isOpen, tipo, montoSugerido, saldoPendiente])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Si es canje/gratis, cerrar sin crear movimiento
    if (metodoPago === 'canje') {
      onClose()
      return
    }

    if (!monto || monto <= 0) {
      setError('Ingresá un monto válido')
      return
    }

    if (!metodoPago) {
      setError('Seleccioná un método de pago')
      return
    }

    // Si es transferencia o mercadopago, mostrar opciones
    if ((metodoPago === 'transferencia' || metodoPago === 'mercadopago') && !mostrarOpcionesTransferencia) {
      setMostrarOpcionesTransferencia(true)
      return
    }

    // Si ya pasó por las opciones o es otro método, guardar directamente
    await guardarPago()
  }

  // Función para guardar el pago
  const guardarPago = async () => {
    setGuardando(true)
    setError(null)

    try {
      const metodoNombre = METODOS_PAGO.find(m => m.id === metodoPago)?.nombre || metodoPago

      await onGuardar({
        tipo,
        monto: parseFloat(monto),
        metodo_pago_id: null, // No usamos FK
        fecha_pago: getFechaHoyArgentina(),
        notas: `Pago: ${metodoNombre}`,
        registrarEnCaja: false // Por ahora no registramos en caja diaria compleja
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al registrar pago')
    } finally {
      setGuardando(false)
    }
  }

  // Función para enviar WhatsApp con datos de transferencia y luego guardar
  const enviarWhatsAppYGuardar = async () => {
    const alias = negocio?.alias_pago
    const nombreNegocio = negocio?.nombre_negocio || 'Mi negocio'
    const clienteWhatsapp = turnoInfo.cliente_whatsapp
    const clienteNombre = turnoInfo.cliente_nombre || 'Cliente'

    if (!alias) {
      setError('No tenés configurado un alias de pago. Configuralo en "Mi Negocio".')
      return
    }

    if (!clienteWhatsapp) {
      setError('El cliente no tiene WhatsApp registrado')
      return
    }

    // Obtener plantilla configurada o usar la por defecto
    const plantilla = tipo === 'sena'
      ? (negocio?.plantilla_sena || PLANTILLA_SENA_DEFAULT)
      : (negocio?.plantilla_pago || PLANTILLA_PAGO_DEFAULT)

    // Reemplazar variables en la plantilla
    const mensaje = plantilla
      .replace(/{nombre}/g, clienteNombre)
      .replace(/{monto}/g, formatearMonto(monto))
      .replace(/{alias}/g, alias)
      .replace(/{negocio}/g, nombreNegocio)

    // Abrir WhatsApp
    const telefono = clienteWhatsapp.replace(/\D/g, '')
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')

    // Guardar el pago
    await guardarPago()
  }

  // Función para solo guardar sin enviar WhatsApp
  const soloGuardar = async () => {
    await guardarPago()
  }

  // Configuración según tipo
  const config = {
    sena: { titulo: 'Registrar Seña', color: 'amber', bgHeader: 'bg-amber-50', Icon: Wallet },
    pago_final: { titulo: 'Completar Pago', color: 'green', bgHeader: 'bg-green-50', Icon: DollarSign },
    devolucion: { titulo: 'Devolver Seña', color: 'red', bgHeader: 'bg-red-50', Icon: AlertCircle }
  }[tipo] || { titulo: 'Registrar Pago', color: 'green', bgHeader: 'bg-green-50', Icon: DollarSign }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between ${config.bgHeader} border-b`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-${config.color}-500 flex items-center justify-center`}>
              <config.Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900">{config.titulo}</h3>
              {turnoInfo.cliente_nombre && (
                <p className="text-sm text-gray-500">{turnoInfo.cliente_nombre}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto a cobrar
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={monto || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setMonto(val === '' ? 0 : parseInt(val, 10))
                }}
                className="w-full pl-10 pr-4 py-4 text-2xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                placeholder="0"
                autoFocus
              />
            </div>
            {tipo === 'sena' && montoSugerido > 0 && (
              <button
                type="button"
                onClick={() => setMonto(montoSugerido)}
                className="mt-2 text-sm text-amber-600 hover:text-amber-700"
              >
                Usar sugerido: {formatearMonto(montoSugerido)}
              </button>
            )}
            {tipo === 'pago_final' && saldoPendiente > 0 && monto !== saldoPendiente && (
              <button
                type="button"
                onClick={() => setMonto(saldoPendiente)}
                className="mt-2 text-sm text-green-600 hover:text-green-700"
              >
                Usar saldo completo: {formatearMonto(saldoPendiente)}
              </button>
            )}
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Cómo pagó?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {METODOS_PAGO.map(metodo => {
                const Icono = metodo.icono
                const seleccionado = metodoPago === metodo.id
                return (
                  <button
                    key={metodo.id}
                    type="button"
                    onClick={() => setMetodoPago(metodo.id)}
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

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !monto || monto <= 0}
              className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                tipo === 'devolucion'
                  ? 'bg-red-600 hover:bg-red-700'
                  : tipo === 'sena'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {guardando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {tipo === 'sena' ? 'Cobrar seña' : tipo === 'devolucion' ? 'Devolver' : 'Cobrar'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sub-modal de opciones para transferencia/mercadopago */}
        {mostrarOpcionesTransferencia && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 rounded-2xl"
              onClick={() => setMostrarOpcionesTransferencia(false)}
            />

            <div className="relative bg-white rounded-xl shadow-xl w-[90%] max-w-xs overflow-hidden">
              {/* Header */}
              <div className="bg-blue-50 px-4 py-3 flex items-center gap-3 border-b">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-gray-900">
                    {tipo === 'sena' ? 'Cobrar seña' : 'Cobrar pago'}
                  </h3>
                  <p className="text-xs text-blue-700">
                    {formatearMonto(monto)} por {METODOS_PAGO.find(m => m.id === metodoPago)?.nombre}
                  </p>
                </div>
              </div>

              {/* Contenido con opciones */}
              <div className="p-4 space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Opción 1: Solo guardar */}
                <button
                  type="button"
                  onClick={soloGuardar}
                  disabled={guardando}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Save className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Solo guardar {tipo === 'sena' ? 'seña' : 'cobro'}</p>
                    <p className="text-xs text-gray-500">Registrar sin enviar mensaje</p>
                  </div>
                </button>

                {/* Opción 2: Enviar WhatsApp y guardar */}
                <button
                  type="button"
                  onClick={enviarWhatsAppYGuardar}
                  disabled={guardando || !turnoInfo.cliente_whatsapp}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    turnoInfo.cliente_whatsapp
                      ? 'border-green-200 hover:border-green-400 hover:bg-green-50'
                      : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    turnoInfo.cliente_whatsapp ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <MessageCircle className={`w-5 h-5 ${
                      turnoInfo.cliente_whatsapp ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <p className={`font-medium ${turnoInfo.cliente_whatsapp ? 'text-gray-900' : 'text-gray-500'}`}>
                      Enviar alias por WhatsApp
                    </p>
                    <p className="text-xs text-gray-500">
                      {turnoInfo.cliente_whatsapp
                        ? `Enviar datos de pago y guardar`
                        : 'Cliente sin WhatsApp'}
                    </p>
                    {negocio?.alias_pago && turnoInfo.cliente_whatsapp && (
                      <p className="text-xs text-blue-600 mt-1">
                        Alias: {negocio.alias_pago}
                      </p>
                    )}
                  </div>
                </button>

                {!negocio?.alias_pago && (
                  <p className="text-xs text-amber-600 text-center">
                    ⚠️ No tenés configurado un alias de pago
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-4 py-3 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setMostrarOpcionesTransferencia(false)}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
