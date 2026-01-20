/**
 * Modal para registrar una venta en cuenta corriente
 * Maneja el flujo completo: selección de cliente, monto, y guardado
 */

import { useState, useEffect } from 'react'
import { X, Check, HandCoins, User, AlertTriangle } from 'lucide-react'
import { createFiado } from '../services/fiadosService'
import { getDeudaCliente } from '../services/clientesFiadoService'
import { formatearMonto } from '../utils/formatters'
import InputMonto from './InputMonto'
import ModalSelectorCliente from './ModalSelectorCliente'
import ModalAvisoLimite from './ModalAvisoLimite'

export default function ModalRegistrarFiado({
  isOpen,
  onClose,
  onGuardado,
  montoInicial = 0
}) {
  // Estado del flujo
  const [etapa, setEtapa] = useState('cliente') // 'cliente' | 'monto'

  // Cliente seleccionado
  const [cliente, setCliente] = useState(null)

  // Datos de la cuenta corriente
  const [monto, setMonto] = useState(0)
  const [descripcion, setDescripcion] = useState('')

  // UI
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [showAvisoLimite, setShowAvisoLimite] = useState(false)
  const [clientePendiente, setClientePendiente] = useState(null)

  // Reset cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setEtapa('cliente')
      setCliente(null)
      setMonto(montoInicial || 0)
      setDescripcion('')
      setError('')
      setShowAvisoLimite(false)
      setClientePendiente(null)
    }
  }, [isOpen, montoInicial])

  // Cuando se selecciona un cliente
  const handleSelectCliente = async (clienteSeleccionado) => {
    // Si supera el límite, mostrar aviso
    if (clienteSeleccionado.supera_limite) {
      setClientePendiente(clienteSeleccionado)
      setShowAvisoLimite(true)
    } else {
      // Continuar con el flujo normal
      confirmarCliente(clienteSeleccionado)
    }
  }

  // Confirmar cliente (después del aviso de límite o directo)
  const confirmarCliente = (clienteConfirmado) => {
    setCliente(clienteConfirmado)
    setShowAvisoLimite(false)
    setClientePendiente(null)
    setEtapa('monto')
  }

  // Guardar cuenta corriente
  const handleGuardar = async () => {
    if (monto <= 0) {
      setError('Ingresá un monto mayor a 0')
      return
    }

    setGuardando(true)
    setError('')

    const { data, error: err } = await createFiado({
      cliente_id: cliente.id,
      monto,
      descripcion: descripcion.trim() || null
    })

    setGuardando(false)

    if (err) {
      setError(err.message || 'Error al registrar en cuenta corriente')
    } else {
      if (onGuardado) {
        onGuardado(data)
      }
      onClose()
    }
  }

  if (!isOpen) return null

  const nombreCliente = cliente
    ? `${cliente.nombre} ${cliente.apellido || ''}`.trim()
    : ''

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-amber-500 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Cuenta Corriente</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Etapa: Seleccionar cliente */}
              {etapa === 'cliente' && (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Seleccioná un cliente
                  </h4>
                  <p className="text-gray-500 mb-6">
                    Elegí el cliente para cargar en cuenta corriente
                  </p>
                  <button
                    onClick={() => setEtapa('selector')}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg"
                  >
                    Seleccionar cliente
                  </button>
                </div>
              )}

              {/* Etapa: Ingresar monto */}
              {etapa === 'monto' && cliente && (
                <div className="space-y-5">
                  {/* Cliente seleccionado */}
                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center">
                        <span className="text-amber-700 font-bold">
                          {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0) || ''}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{nombreCliente}</p>
                        {cliente.deuda_actual > 0 && (
                          <p className="text-sm text-red-600">
                            Deuda actual: {formatearMonto(cliente.deuda_actual)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setEtapa('selector')}
                        className="ml-auto text-sm text-amber-600 hover:text-amber-700"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>

                  {/* Monto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto a cargar
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                      <InputMonto
                        value={monto}
                        onChange={setMonto}
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-4 text-3xl font-bold border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-amber-600 text-right"
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (opcional)
                    </label>
                    <input
                      type="text"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Ej: Pan, leche, galletitas"
                      maxLength={200}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  {/* Aviso: no afecta caja */}
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      La cuenta corriente <strong>no se registra como movimiento</strong> en la caja del día.
                      Solo registra la deuda del cliente.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {etapa === 'monto' && (
              <div className="border-t border-gray-200 px-5 py-4 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando || monto <= 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg"
                >
                  <Check className="w-5 h-5" />
                  {guardando ? 'Guardando...' : 'Cargar a Cuenta'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Selector de Cliente */}
      <ModalSelectorCliente
        isOpen={etapa === 'selector'}
        onClose={() => setEtapa(cliente ? 'monto' : 'cliente')}
        onSelect={handleSelectCliente}
        montoFiado={monto || montoInicial}
      />

      {/* Modal Aviso Límite */}
      <ModalAvisoLimite
        isOpen={showAvisoLimite}
        onClose={() => {
          setShowAvisoLimite(false)
          setClientePendiente(null)
        }}
        onConfirmar={() => confirmarCliente(clientePendiente)}
        cliente={clientePendiente}
        montoFiado={monto || montoInicial}
      />
    </>
  )
}
