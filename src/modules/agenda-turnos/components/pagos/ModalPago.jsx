/**
 * Modal para registrar pago de turno (seña o pago final)
 */

import { useState, useEffect } from 'react'
import { X, DollarSign, CreditCard, Wallet, Loader2, Check, AlertCircle } from 'lucide-react'
import { useMetodosPago } from '../../hooks/usePagos'
import { formatearMonto } from '../../utils/formatters'
import { getFechaHoyArgentina } from '../../utils/dateUtils'

export default function ModalPago({
  isOpen,
  onClose,
  onGuardar,
  tipo = 'sena', // 'sena', 'pago_final', 'devolucion'
  montoSugerido = 0,
  saldoPendiente = 0,
  turnoInfo = {}
}) {
  const { metodos, loading: loadingMetodos } = useMetodosPago()

  const [form, setForm] = useState({
    monto: 0,
    metodo_pago_id: null,
    fecha_pago: getFechaHoyArgentina(),
    notas: '',
    registrarEnCaja: true
  })

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // Reset form al abrir
  useEffect(() => {
    if (isOpen) {
      const montoInicial = tipo === 'pago_final' ? saldoPendiente : montoSugerido
      setForm({
        monto: montoInicial,
        metodo_pago_id: metodos[0]?.id || null,
        fecha_pago: getFechaHoyArgentina(),
        notas: '',
        registrarEnCaja: true
      })
      setError(null)
    }
  }, [isOpen, tipo, montoSugerido, saldoPendiente, metodos])

  // Actualizar método de pago cuando carguen los métodos
  useEffect(() => {
    if (metodos.length > 0 && !form.metodo_pago_id) {
      setForm(f => ({ ...f, metodo_pago_id: metodos[0].id }))
    }
  }, [metodos])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.monto || form.monto <= 0) {
      setError('Ingresá un monto válido')
      return
    }

    if (!form.metodo_pago_id) {
      setError('Seleccioná un método de pago')
      return
    }

    setGuardando(true)
    setError(null)

    try {
      await onGuardar({
        tipo,
        monto: parseFloat(form.monto),
        metodo_pago_id: form.metodo_pago_id,
        fecha_pago: form.fecha_pago,
        notas: form.notas || null,
        registrarEnCaja: form.registrarEnCaja
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al registrar pago')
    } finally {
      setGuardando(false)
    }
  }

  // Títulos según tipo
  const titulos = {
    sena: { titulo: 'Registrar Seña', color: 'amber', icon: Wallet },
    pago_final: { titulo: 'Cobrar Turno', color: 'green', icon: DollarSign },
    devolucion: { titulo: 'Devolver Seña', color: 'red', icon: AlertCircle }
  }

  const config = titulos[tipo] || titulos.pago_final
  const Icon = config.icon

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between bg-${config.color}-50 border-b border-${config.color}-100`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-${config.color}-500 flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900">{config.titulo}</h3>
              {turnoInfo.cliente_nombre && (
                <p className="text-sm text-gray-500">{turnoInfo.cliente_nombre}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
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

          {/* Info del turno */}
          {turnoInfo.servicios_nombres && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-600">Servicio: <span className="font-medium text-gray-900">{turnoInfo.servicios_nombres}</span></p>
              {saldoPendiente > 0 && tipo !== 'sena' && (
                <p className="text-gray-600 mt-1">Saldo pendiente: <span className="font-medium text-gray-900">{formatearMonto(saldoPendiente)}</span></p>
              )}
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={form.monto}
                onChange={(e) => setForm(f => ({ ...f, monto: e.target.value }))}
                className="w-full pl-8 pr-4 py-3 text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            {tipo === 'sena' && montoSugerido > 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Seña sugerida: {formatearMonto(montoSugerido)}
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago
            </label>
            {loadingMetodos ? (
              <div className="text-center py-4">
                <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {metodos.map(metodo => (
                  <button
                    key={metodo.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, metodo_pago_id: metodo.id }))}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      form.metodo_pago_id === metodo.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">{metodo.nombre}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha del pago
            </label>
            <input
              type="date"
              value={form.fecha_pago}
              onChange={(e) => setForm(f => ({ ...f, fecha_pago: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Registrar en caja */}
          <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={form.registrarEnCaja}
              onChange={(e) => setForm(f => ({ ...f, registrarEnCaja: e.target.checked }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Registrar en Caja Diaria</p>
              <p className="text-xs text-gray-500">El pago aparecerá como movimiento en tu caja</p>
            </div>
          </label>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={form.notas}
              onChange={(e) => setForm(f => ({ ...f, notas: e.target.value }))}
              placeholder="Observaciones del pago..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !form.monto || !form.metodo_pago_id}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                tipo === 'devolucion'
                  ? 'bg-red-600 hover:bg-red-700'
                  : tipo === 'sena'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {tipo === 'sena' ? 'Cobrar seña' : tipo === 'devolucion' ? 'Devolver' : 'Cobrar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
