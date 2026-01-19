/**
 * Modal para realizar arqueo de caja
 */

import { useState, useEffect } from 'react'
import { X, Calculator, CheckCircle, AlertCircle } from 'lucide-react'
import InputMonto from './InputMonto'
import { formatearMonto } from '../utils/formatters'
import { getColorDiferencia } from '../utils/coloresConfig'

export default function ModalArqueo({
  isOpen,
  onClose,
  efectivoEsperado,
  onGuardar
}) {
  const [efectivoReal, setEfectivoReal] = useState(0)
  const [notas, setNotas] = useState('')
  const [motivoDiferencia, setMotivoDiferencia] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Calcular diferencia
  const diferencia = efectivoReal - efectivoEsperado

  // Pre-llenar efectivo real con el esperado
  useEffect(() => {
    if (isOpen) {
      setEfectivoReal(efectivoEsperado)
      setNotas('')
      setMotivoDiferencia('')
    }
  }, [isOpen, efectivoEsperado])

  const handleGuardar = async () => {
    setGuardando(true)

    try {
      await onGuardar({
        efectivo_esperado: efectivoEsperado,
        efectivo_real: efectivoReal,
        diferencia,
        motivo_diferencia: diferencia !== 0 ? motivoDiferencia.trim() : null,
        notas: notas.trim() || null
      })

      onClose()
    } catch (err) {
      console.error('Error guardando arqueo:', err)
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  // Colores según diferencia
  const colorDif = getColorDiferencia(diferencia)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">
                  Arqueo de Caja
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5 space-y-5">
            {/* Efectivo esperado */}
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-amber-900 font-medium">Efectivo esperado:</span>
                <span className="text-xl font-bold text-amber-700">
                  {formatearMonto(efectivoEsperado)}
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Saldo inicial + entradas - salidas en efectivo
              </p>
            </div>

            {/* Input efectivo real */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cuánto hay en caja?
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <InputMonto
                  value={efectivoReal}
                  onChange={setEfectivoReal}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-medium"
                />
              </div>
            </div>

            {/* Diferencia */}
            <div className={`${colorDif.bg} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                {diferencia === 0 ? (
                  <CheckCircle className={`w-5 h-5 ${colorDif.icon}`} />
                ) : (
                  <AlertCircle className={`w-5 h-5 ${colorDif.icon}`} />
                )}
                <span className={`font-medium ${colorDif.text}`}>Diferencia</span>
              </div>
              <div className={`text-2xl font-bold ${colorDif.text}`}>
                {diferencia >= 0 ? '+' : ''}{formatearMonto(diferencia)}
              </div>
            </div>

            {/* Motivo diferencia (si hay) */}
            {diferencia !== 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la diferencia
                </label>
                <textarea
                  value={motivoDiferencia}
                  onChange={(e) => setMotivoDiferencia(e.target.value)}
                  placeholder="Explicar brevemente la diferencia..."
                  maxLength={200}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                />
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Agregar observaciones..."
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              <Calculator className="w-5 h-5" />
              {guardando ? 'Guardando...' : 'Guardar Arqueo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
