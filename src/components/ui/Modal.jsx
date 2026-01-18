import { X } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Modal reutilizable
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar el modal
 * @param {string} props.title - Título del modal
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {string} props.variant - Variante de color: 'info', 'success', 'warning', 'error'
 * @param {string} props.size - Tamaño: 'sm', 'md', 'lg', 'xl'
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  variant = 'info',
  size = 'md',
  showCloseButton = true
}) {
  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  }

  const variantClasses = {
    info: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-amber-200 bg-amber-50',
    error: 'border-red-200 bg-red-50'
  }

  const headerVariantClasses = {
    info: 'bg-blue-100 text-blue-900',
    success: 'bg-green-100 text-green-900',
    warning: 'bg-amber-100 text-amber-900',
    error: 'bg-red-100 text-red-900'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClasses[size]} bg-white rounded-lg shadow-xl border-2 ${variantClasses[variant]} animate-in fade-in zoom-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b-2 ${variantClasses[variant]} ${headerVariantClasses[variant]} rounded-t-lg flex items-center justify-between`}>
          <h3 className="text-lg font-semibold font-heading">{title}</h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Modal de confirmación con botones de acción
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isLoading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant={variant} size="md">
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 ${
            variant === 'error'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : variant === 'warning'
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Procesando...' : confirmText}
        </button>
      </div>
    </Modal>
  )
}

/**
 * Modal de alerta simple con un solo botón
 */
export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'Entendido',
  variant = 'info'
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant={variant} size="md">
      <p className="text-gray-700 mb-6 whitespace-pre-wrap">{message}</p>
      <button
        onClick={onClose}
        className={`w-full px-4 py-2 rounded-lg transition-colors font-medium ${
          variant === 'error'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : variant === 'warning'
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : variant === 'success'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {buttonText}
      </button>
    </Modal>
  )
}
