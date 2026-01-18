/**
 * Botones de acción principales (Entrada / Salida)
 */

import { Plus, Minus } from 'lucide-react'

export default function BotonesAccion({ onEntrada, onSalida, disabled = false }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Botón Entrada */}
      <button
        onClick={onEntrada}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl p-6 transition-colors min-h-touch"
      >
        <Plus className="w-8 h-8" />
        <span className="font-heading font-semibold text-lg">Entrada</span>
      </button>

      {/* Botón Salida */}
      <button
        onClick={onSalida}
        disabled={disabled}
        className="flex flex-col items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl p-6 transition-colors min-h-touch"
      >
        <Minus className="w-8 h-8" />
        <span className="font-heading font-semibold text-lg">Salida</span>
      </button>
    </div>
  )
}
