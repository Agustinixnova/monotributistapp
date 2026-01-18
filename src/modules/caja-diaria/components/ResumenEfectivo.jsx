/**
 * Card que muestra el resumen de efectivo en caja
 */

import { useState } from 'react'
import { Wallet, Edit2 } from 'lucide-react'
import { formatearMonto } from '../utils/formatters'
import InputMonto from './InputMonto'

export default function ResumenEfectivo({ resumen, saldoInicial, onEditarSaldoInicial, estaCerrado }) {
  const [editando, setEditando] = useState(false)
  const [nuevoSaldo, setNuevoSaldo] = useState(saldoInicial || 0)

  if (!resumen) return null

  const efectivoEnCaja = parseFloat(saldoInicial || 0) + parseFloat(resumen.efectivo_saldo || 0)

  const handleGuardar = async () => {
    if (onEditarSaldoInicial) {
      await onEditarSaldoInicial(nuevoSaldo)
    }
    setEditando(false)
  }

  const handleCancelar = () => {
    setNuevoSaldo(saldoInicial || 0)
    setEditando(false)
  }

  return (
    <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="w-5 h-5" />
        <h3 className="font-heading font-semibold">Efectivo en Caja</h3>
      </div>

      <div className="text-4xl font-bold mb-4">
        {formatearMonto(efectivoEnCaja)}
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
              />
              <button
                onClick={handleGuardar}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs"
              >
                ✓
              </button>
              <button
                onClick={handleCancelar}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-medium">{formatearMonto(saldoInicial)}</span>
              {!estaCerrado && onEditarSaldoInicial && (
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
        <div className="flex justify-between">
          <span>+ Entradas:</span>
          <span className="font-medium">{formatearMonto(resumen.efectivo_entradas)}</span>
        </div>
        <div className="flex justify-between">
          <span>- Salidas:</span>
          <span className="font-medium">{formatearMonto(resumen.efectivo_salidas)}</span>
        </div>
      </div>
    </div>
  )
}
