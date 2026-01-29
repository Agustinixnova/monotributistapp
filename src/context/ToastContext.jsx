/**
 * Context para manejar toasts/notificaciones globales
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { ToastContainer } from '../components/common/Toast'
import { useAuth } from '../auth/hooks/useAuth'
import { suscribirseNotificaciones } from '../modules/notificaciones/services/notificacionesService'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const { user } = useAuth()

  // Agregar un toast
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  // Remover un toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = suscribirseNotificaciones(user.id, (nuevaNotificacion) => {
      // Mostrar toast para la nueva notificación
      addToast({
        tipo: nuevaNotificacion.tipo || 'sistema',
        titulo: nuevaNotificacion.titulo,
        mensaje: nuevaNotificacion.mensaje,
        link_to: nuevaNotificacion.link_to
      })
    })

    return unsubscribe
  }, [user?.id, addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return context
}
