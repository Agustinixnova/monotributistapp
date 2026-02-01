/**
 * Modal para registrar un gasto desde caja secundaria
 * Estilo igual al ModalMovimiento de Nueva Salida
 */

import { useState, useEffect } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'
import IconoDinamico from './IconoDinamico'
import InputMonto from './InputMonto'

export default function ModalGastoSecundaria({
  isOpen,
  onClose,
  onConfirmar,
  saldoDisponible = 0,
  categorias = []
}) {
  const [monto, setMonto] = useState(0)
  const [categoriaId, setCategoriaId] = useState(null)
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Resetear form cuando se abre
  useEffect(() => {
    if (isOpen) {
      setMonto(0)
      setCategoriaId(null)
      setDescripcion('')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Filtrar solo categorías de salida, excluyendo las de sistema
  const categoriasOcultas = ['Sobrante de caja', 'Faltante de caja', 'Ajuste de caja', 'A caja secundaria']
  const categoriasSalida = categorias.filter(c =>
    c.tipo === 'salida' && !categoriasOcultas.includes(c.nombre)
  )

  const handleSelectCategoria = (id) => {
    setCategoriaId(id)
    setError(null)
  }

  const handleConfirmar = async () => {
    if (monto <= 0) {
      setError('Ingresá un monto mayor a 0')
      return
    }
    if (monto > saldoDisponible) {
      setError(`Saldo insuficiente. Disponible: ${formatearMonto(saldoDisponible)}`)
      return
    }
    if (!categoriaId) {
      setError('Seleccioná una categoría')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onConfirmar(monto, categoriaId, descripcion.trim())
      setMonto(0)
      setCategoriaId(null)
      setDescripcion('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMonto(0)
    setCategoriaId(null)
    setDescripcion('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

          {/* Header */}
          <div className="bg-red-500 px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-heading font-semibold text-lg">Gasto desde Secundaria</h3>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Saldo disponible */}
          <div className="bg-red-50 px-5 py-2 border-b border-red-100">
            <p className="text-sm text-red-700">
              Saldo disponible: <span className="font-semibold">{formatearMonto(saldoDisponible)}</span>
            </p>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">$</span>
                  <InputMonto
                    value={monto}
                    onChange={setMonto}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-4 text-3xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-600 text-right"
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
                  placeholder="Ej: Pago a proveedor"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Categorías */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categoriasSalida.map(cat => {
                    const seleccionado = categoriaId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategoria(cat.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all ${
                          seleccionado
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <IconoDinamico
                          nombre={cat.icono}
                          className={`w-5 h-5 ${seleccionado ? 'text-red-600' : 'text-gray-500'}`}
                        />
                        <span className={`text-xs text-center leading-tight ${
                          seleccionado ? 'text-red-700 font-medium' : 'text-gray-600'
                        }`}>
                          {cat.nombre}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4">
            <button
              onClick={handleConfirmar}
              disabled={loading || monto <= 0 || !categoriaId}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {loading ? 'Guardando...' : 'Registrar Gasto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
