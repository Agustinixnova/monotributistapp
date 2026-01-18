/**
 * Modal pequeño para mostrar tooltips explicativos
 */

import { X } from 'lucide-react'

export default function TooltipModal({ isOpen, onClose, titulo, texto }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-in fade-in zoom-in duration-200">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Título */}
        <h3 className="font-heading font-semibold text-lg text-gray-900 mb-3 pr-6">
          {titulo}
        </h3>

        {/* Texto */}
        <p className="text-gray-700 leading-relaxed">
          {texto}
        </p>
      </div>
    </div>
  )
}
