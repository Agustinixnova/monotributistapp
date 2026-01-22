/**
 * Card que muestra el resumen de efectivo en caja
 */

import { useState } from 'react'
import { Wallet, Edit2, Eye, EyeOff } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'
import InputMonto from './InputMonto'

export default function ResumenEfectivo({ resumen, saldoInicial, onEditarSaldoInicial, estaCerrado, ocultarValores, onToggleOcultar }) {
  const [editando, setEditando] = useState(false)
  const [nuevoSaldo, setNuevoSaldo] = useState(saldoInicial || 0)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  if (!resumen) return null

  // Calcular efectivo en caja: saldo inicial + movimientos de efectivo
  // (La diferencia de arqueo ya está incluida como movimiento de Faltante/Sobrante)
  const efectivoEnCaja = parseFloat(saldoInicial || 0) + parseFloat(resumen.efectivo_saldo || 0)

  // Función para mostrar monto o asteriscos
  const mostrarMonto = (valor) => ocultarValores ? '*****' : formatearMonto(valor)

  const handleGuardar = async () => {
    if (!onEditarSaldoInicial) return

    setGuardando(true)
    setError('')

    try {
      const result = await onEditarSaldoInicial(nuevoSaldo)
      if (result && !result.success) {
        setError(result.error?.message || 'Error al guardar')
      } else {
        setEditando(false)
      }
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    setNuevoSaldo(saldoInicial || 0)
    setEditando(false)
    setError('')
  }

  return (
    <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-5 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          <h3 className="font-heading font-semibold">Efectivo en Caja</h3>
        </div>
        <button
          onClick={onToggleOcultar}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          title={ocultarValores ? 'Mostrar valores' : 'Ocultar valores'}
        >
          {ocultarValores ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <div className="text-4xl font-bold mb-4">
        {mostrarMonto(efectivoEnCaja)}
      </div>

      <div className="space-y-1 text-sm text-white/90">
        <div className="flex justify-between items-center">
          <span>Inicial:</span>
          {editando ? (
            <div className="flex items-center gap-1">
              <InputMonto
                value={nuevoSaldo}
                onChange={setNuevoSaldo}
                className="w-24 px-2 py-1 text-right text-sm bg-white/20 border border-white/30 rounded text-white placeholder-white/50"
                disabled={guardando}
              />
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded text-xs"
              >
                {guardando ? '...' : '✓'}
              </button>
              <button
                onClick={handleCancelar}
                disabled={guardando}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-medium">{mostrarMonto(saldoInicial)}</span>
              {!estaCerrado && onEditarSaldoInicial && !ocultarValores && (
                <button
                  onClick={() => {
                    setNuevoSaldo(saldoInicial || 0)
                    setEditando(true)
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Editar saldo inicial"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs bg-red-500/20 border border-red-300/30 rounded px-2 py-1 mt-2">
            {error}
          </div>
        )}

        <div className="flex justify-between">
          <span>+ Entradas:</span>
          <span className="font-medium">{mostrarMonto(resumen.efectivo_entradas)}</span>
        </div>
        <div className="flex justify-between">
          <span>- Salidas:</span>
          <span className="font-medium">{mostrarMonto(resumen.efectivo_salidas)}</span>
        </div>
      </div>
    </div>
  )
}
