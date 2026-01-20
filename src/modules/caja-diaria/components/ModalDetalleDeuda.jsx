/**
 * Modal de detalle de cuenta corriente de un cliente y formulario de cobro
 */

import { useState, useEffect } from 'react'
import { X, User, Phone, ChevronDown, ChevronUp, Check, HandCoins, History } from 'lucide-react'
import { useCobranzas } from '../hooks/useCobranzas'
import { formatearMonto, formatearFechaCorta, formatearHora } from '../utils/formatters'
import InputMonto from './InputMonto'
import IconoDinamico from './IconoDinamico'

export default function ModalDetalleDeuda({
  isOpen,
  onClose,
  cliente,
  metodosPago,
  onPagoRegistrado
}) {
  const { cobrar, obtenerHistorial } = useCobranzas()

  const [historial, setHistorial] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  // Form de cobro
  const [montoCobro, setMontoCobro] = useState(0)
  const [metodoPagoId, setMetodoPagoId] = useState(null)
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && cliente) {
      // Resetear form
      setMontoCobro(cliente.deuda_total || 0)
      setMetodoPagoId(metodosPago?.[0]?.id || null)
      setNota('')
      setError('')
      setMostrarHistorial(false)

      // Cargar historial
      const cargarHistorial = async () => {
        setLoadingHistorial(true)
        const { historial: data } = await obtenerHistorial(cliente.id)
        setHistorial(data || [])
        setLoadingHistorial(false)
      }
      cargarHistorial()
    }
  }, [isOpen, cliente, metodosPago, obtenerHistorial])

  const handleCobrar = async () => {
    if (montoCobro <= 0) {
      setError('Ingresá un monto mayor a 0')
      return
    }
    if (!metodoPagoId) {
      setError('Seleccioná un método de pago')
      return
    }

    setGuardando(true)
    setError('')

    const result = await cobrar({
      cliente_id: cliente.id,
      monto: montoCobro,
      metodo_pago_id: metodoPagoId,
      nota: nota.trim() || `Cobro deuda - ${cliente.nombre} ${cliente.apellido || ''}`.trim()
    })

    setGuardando(false)

    if (result.success) {
      if (onPagoRegistrado) {
        onPagoRegistrado()
      }
      onClose()
    } else {
      setError(result.error?.message || 'Error al registrar el cobro')
    }
  }

  if (!isOpen || !cliente) return null

  const nombreCompleto = `${cliente.nombre} ${cliente.apellido || ''}`.trim()
  const deudaTotal = parseFloat(cliente.deuda_total || 0)

  // Separar historial en cuenta corriente y pagos
  const cuentasCorrientes = historial.filter(h => h.tipo === 'fiado')
  const pagos = historial.filter(h => h.tipo === 'pago')

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-emerald-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <HandCoins className="w-5 h-5" />
              <h3 className="font-heading font-semibold text-lg">Cobrar Deuda</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto">
            {/* Info del cliente */}
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-bold text-lg">
                    {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0) || ''}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{nombreCompleto}</h4>
                  {cliente.telefono && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {cliente.telefono}
                    </p>
                  )}
                </div>
              </div>

              {/* Deuda total */}
              <div className="mt-4 bg-red-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Deuda total:</span>
                  <span className="text-2xl font-bold text-red-600">{formatearMonto(deudaTotal)}</span>
                </div>
              </div>
            </div>

            {/* Formulario de cobro */}
            <div className="p-5 space-y-4">
              {/* Monto a cobrar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a cobrar
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
                  <InputMonto
                    value={montoCobro}
                    onChange={setMontoCobro}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 text-2xl font-bold border-2 border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-emerald-600 text-right"
                  />
                </div>
                {montoCobro > deudaTotal && (
                  <p className="text-xs text-orange-600 mt-1">
                    El monto supera la deuda actual
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setMontoCobro(deudaTotal)}
                    className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                  >
                    Total ({formatearMonto(deudaTotal)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMontoCobro(Math.floor(deudaTotal / 2))}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Mitad
                  </button>
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {metodosPago?.map(metodo => {
                    const seleccionado = metodoPagoId === metodo.id
                    return (
                      <button
                        key={metodo.id}
                        type="button"
                        onClick={() => setMetodoPagoId(metodo.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          seleccionado
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconoDinamico
                          nombre={metodo.icono}
                          className={`w-5 h-5 ${seleccionado ? 'text-emerald-600' : 'text-gray-500'}`}
                        />
                        <span className={`text-sm font-medium ${
                          seleccionado ? 'text-emerald-700' : 'text-gray-700'
                        }`}>
                          {metodo.nombre}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nota */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota (opcional)
                </label>
                <input
                  type="text"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Ej: Pago parcial acordado"
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Historial colapsable */}
            <div className="border-t border-gray-200">
              <button
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                className="w-full px-5 py-3 flex items-center justify-between text-gray-600 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span className="text-sm font-medium">Historial de movimientos</span>
                </div>
                {mostrarHistorial ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {mostrarHistorial && (
                <div className="px-5 pb-4">
                  {loadingHistorial ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    </div>
                  ) : historial.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Sin movimientos registrados
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {historial.map((item, idx) => (
                        <div
                          key={`${item.tipo}-${item.id}-${idx}`}
                          className={`p-3 rounded-lg text-sm ${
                            item.tipo === 'fiado' ? 'bg-red-50' : 'bg-emerald-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium ${
                              item.tipo === 'fiado' ? 'text-red-700' : 'text-emerald-700'
                            }`}>
                              {item.tipo === 'fiado' ? 'Cta. Cte.' : 'Pago'}
                            </span>
                            <span className={`font-bold ${
                              item.tipo === 'fiado' ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                              {item.tipo === 'fiado' ? '+' : '-'}{formatearMonto(item.monto)}
                            </span>
                          </div>
                          {item.descripcion && (
                            <p className="text-gray-600 text-xs mb-1">{item.descripcion}</p>
                          )}
                          <div className="text-xs text-gray-400 flex flex-wrap gap-x-3">
                            <span>{formatearFechaCorta(item.fecha)} {formatearHora(item.hora)}</span>
                            {item.metodo_pago && <span>{item.metodo_pago}</span>}
                            {item.created_by_nombre && (
                              <span className="text-gray-500">
                                Por: {item.created_by_nombre}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleCobrar}
              disabled={guardando || montoCobro <= 0 || !metodoPagoId}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg"
            >
              <Check className="w-5 h-5" />
              {guardando ? 'Cobrando...' : 'Cobrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
