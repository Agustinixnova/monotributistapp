import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook para manejar el estado del sidebar
 * @returns {{
 *   isOpen: boolean,
 *   open: () => void,
 *   close: () => void,
 *   toggle: () => void
 * }}
 */
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  // Cerrar sidebar en mobile al cambiar de ruta
  useEffect(() => {
    close()
  }, [location.pathname, close])

  // Cerrar sidebar con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll del body cuando el sidebar está abierto en mobile
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  return {
    isOpen,
    open,
    close,
    toggle,
  }
}
