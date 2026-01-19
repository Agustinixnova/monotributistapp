/**
 * Modal de confirmación reutilizable
 */

import { AlertTriangle, X } from 'lucide-react'

export default function ModalConfirmacion({
  isOpen,
  onClose,
  onConfirm,
  titulo = '¿Estás seguro?',
  mensaje = 'Esta acción no se puede deshacer.',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'warning', // 'warning' | 'danger'
  loading = false
}) {
  if (!isOpen) return null

  const colores = {
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      boton: 'bg-amber-600 hover:bg-amber-700'
    },
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      boton: 'bg-red-600 hover:bg-red-700'
    }
  }

  const color = colores[variante] || colores.warning

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
          {/* Contenido */}
          <div className="p-5">
            {/* Icono y botón cerrar */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${color.bg} rounded-full flex items-center justify-center`}>
                <AlertTriangle className={`w-6 h-6 ${color.icon}`} />
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Título y mensaje */}
            <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
              {titulo}
            </h3>
            <p className="text-gray-600 text-sm">
              {mensaje}
            </p>
          </div>

          {/* Botones */}
          <div className="border-t border-gray-200 px-5 py-4 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {textoCancelar}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 ${color.boton} text-white font-medium rounded-lg transition-colors disabled:opacity-50`}
            >
              {loading ? 'Procesando...' : textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
