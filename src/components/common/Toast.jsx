/**
 * Componente Toast para notificaciones en tiempo real
 */

import { useState, useEffect } from 'react'
import { X, Bell, Calendar, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ICONOS = {
  sistema: Bell,
  turno_reserva: Calendar,
  success: CheckCircle,
  error: AlertCircle,
  info: Info
}

const COLORES = {
  sistema: 'bg-violet-500',
  turno_reserva: 'bg-blue-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-gray-500'
}

export function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setVisible(true), 10)

    // Auto-cerrar después de 6 segundos
    const timer = setTimeout(() => {
      handleClose()
    }, 6000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setSaliendo(true)
    setTimeout(() => {
      onClose(toast.id)
    }, 300)
  }

  const Icon = ICONOS[toast.tipo] || Bell
  const colorClass = COLORES[toast.tipo] || COLORES.info

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        visible && !saliendo
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-w-sm">
        <div className={`${colorClass} px-4 py-2 flex items-center gap-2`}>
          <Icon className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm flex-1">
            {toast.titulo}
          </span>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-gray-700">{toast.mensaje}</p>
          {toast.link_to && (
            <a
              href={toast.link_to}
              onClick={handleClose}
              className="inline-block mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Ver detalle
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}
