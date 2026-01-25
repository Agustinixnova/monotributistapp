/**
 * Banner de consentimiento de cookies
 * Se muestra solo una vez hasta que el usuario acepta
 */

import { useState, useEffect } from 'react'
import { Cookie, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const COOKIE_CONSENT_KEY = 'mimonotributo_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Verificar si ya aceptó las cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Mostrar después de un pequeño delay para mejor UX
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  const handleClose = () => {
    // Cerrar sin aceptar (se volverá a mostrar en la próxima visita)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Icono y texto */}
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Usamos cookies para mejorar tu experiencia y analizar el uso del sitio.
                Al continuar navegando, aceptás nuestra{' '}
                <Link to="/privacidad" className="text-violet-600 hover:underline font-medium">
                  Política de Privacidad
                </Link>.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-2 md:flex-shrink-0">
            <button
              onClick={handleAccept}
              className="flex-1 md:flex-none px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Aceptar
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieBanner
