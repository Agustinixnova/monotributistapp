/**
 * Modal para registrar ventas divididas entre Eliana y Hugo
 * Crea dos movimientos de entrada con un solo formulario
 * Cada persona puede tener su propio método de pago
 */

import { useState, useEffect, useRef } from 'react'
import { X, Users, DollarSign, ChevronDown } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'

export default function ModalVentaDividida({
  isOpen,
  onClose,
  categorias,
  metodosPago,
  onGuardar
}) {
  const [montoEliana, setMontoEliana] = useState('')
  const [montoHugo, setMontoHugo] = useState('')
  const [metodoEliana, setMetodoEliana] = useState(null)
  const [metodoHugo, setMetodoHugo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const inputElianaRef = useRef(null)

  // Buscar método de pago efectivo por defecto
  const metodoEfectivo = metodosPago?.find(m => m.es_efectivo)

  // Resetear al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setMontoEliana('')
      setMontoHugo('')
      // Por defecto, efectivo para ambos
      setMetodoEliana(metodoEfectivo?.id || null)
      setMetodoHugo(metodoEfectivo?.id || null)
      setError(null)
      // Focus en el primer input
      setTimeout(() => inputElianaRef.current?.focus(), 100)
    }
  }, [isOpen, metodoEfectivo])

  // Calcular total
  const totalEliana = parseFloat(montoEliana) || 0
  const totalHugo = parseFloat(montoHugo) || 0
  const total = totalEliana + totalHugo

  // Buscar categorías por nombre
  const categoriaEliana = categorias?.find(c =>
    c.nombre?.toLowerCase() === 'venta en local' && c.tipo === 'entrada'
  )
  const categoriaHugo = categorias?.find(c =>
    c.nombre?.toLowerCase() === 'venta hugo' && c.tipo === 'entrada'
  )

  const handleGuardar = async () => {
    // Validaciones
    if (totalEliana <= 0 && totalHugo <= 0) {
      setError('Ingresá al menos un monto')
      return
    }

    if (totalEliana > 0 && !metodoEliana) {
      setError('Seleccioná el método de pago para Eliana')
      return
    }

    if (totalHugo > 0 && !metodoHugo) {
      setError('Seleccioná el método de pago para Hugo')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Crear movimiento de Eliana si tiene monto
      if (totalEliana > 0) {
        if (!categoriaEliana) {
          setError('No se encontró la categoría "Venta en local"')
          setLoading(false)
          return
        }

        const resultEliana = await onGuardar({
          tipo: 'entrada',
          categoria_id: categoriaEliana.id,
          descripcion: null,
          pagos: [{
            metodo_pago_id: metodoEliana,
            monto: totalEliana
          }]
        })

        if (!resultEliana.success) {
          setError(resultEliana.error?.message || 'Error al registrar venta de Eliana')
          setLoading(false)
          return
        }
      }

      // Crear movimiento de Hugo si tiene monto
      if (totalHugo > 0) {
        if (!categoriaHugo) {
          setError('No se encontró la categoría "Venta Hugo"')
          setLoading(false)
          return
        }

        const resultHugo = await onGuardar({
          tipo: 'entrada',
          categoria_id: categoriaHugo.id,
          descripcion: null,
          pagos: [{
            metodo_pago_id: metodoHugo,
            monto: totalHugo
          }]
        })

        if (!resultHugo.success) {
          setError(resultHugo.error?.message || 'Error al registrar venta de Hugo')
          setLoading(false)
          return
        }
      }

      // Éxito - cerrar modal
      onClose()
    } catch (err) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Manejar input de monto (solo números y punto)
  const handleMontoChange = (value, setter) => {
    // Permitir solo números y un punto decimal
    const cleaned = value.replace(/[^0-9.]/g, '')
    // Solo permitir un punto
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    // Máximo 2 decimales
    if (parts[1] && parts[1].length > 2) return
    setter(cleaned)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-3 text-white flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h3 className="font-heading font-semibold text-lg">Venta Dividida</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Input Eliana */}
          <div className="bg-gray-50 rounded-xl p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eliana (Venta en local)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  ref={inputElianaRef}
                  type="text"
                  inputMode="decimal"
                  value={montoEliana}
                  onChange={(e) => handleMontoChange(e.target.value, setMontoEliana)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 text-lg font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div className="relative w-32">
                <select
                  value={metodoEliana || ''}
                  onChange={(e) => setMetodoEliana(e.target.value)}
                  className="w-full h-full px-3 py-2 border border-gray-300 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                >
                  {metodosPago?.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Input Hugo */}
          <div className="bg-gray-50 rounded-xl p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hugo (Venta Hugo)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={montoHugo}
                  onChange={(e) => handleMontoChange(e.target.value, setMontoHugo)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-3 text-lg font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div className="relative w-32">
                <select
                  value={metodoHugo || ''}
                  onChange={(e) => setMetodoHugo(e.target.value)}
                  className="w-full h-full px-3 py-2 border border-gray-300 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                >
                  {metodosPago?.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-violet-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-violet-700 font-medium">TOTAL A COBRAR</span>
              <span className="text-2xl font-bold text-violet-600">
                {formatearMonto(total)}
              </span>
            </div>
            {(totalEliana > 0 || totalHugo > 0) && (
              <div className="mt-2 pt-2 border-t border-violet-200 text-sm text-violet-600 space-y-1">
                {totalEliana > 0 && (
                  <div className="flex justify-between">
                    <span>Eliana ({metodosPago?.find(m => m.id === metodoEliana)?.nombre || 'Efectivo'}):</span>
                    <span>{formatearMonto(totalEliana)}</span>
                  </div>
                )}
                {totalHugo > 0 && (
                  <div className="flex justify-between">
                    <span>Hugo ({metodosPago?.find(m => m.id === metodoHugo)?.nombre || 'Efectivo'}):</span>
                    <span>{formatearMonto(totalHugo)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón Registrar */}
          <button
            onClick={handleGuardar}
            disabled={loading || total <= 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:active:scale-100"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Registrar Venta
              </>
            )}
          </button>

          {/* Ayuda */}
          <p className="text-center text-xs text-gray-400">
            Se crearán los movimientos con el método de pago seleccionado para cada uno
          </p>
        </div>
      </div>
    </div>
  )
}
