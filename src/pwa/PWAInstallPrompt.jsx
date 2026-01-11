import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

/**
 * Componente para mostrar prompt de instalación PWA
 * Solo aparece cuando el navegador soporta instalación
 */
export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)

    // Capturar evento de instalación (Chrome, Edge, etc)
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)

      // Mostrar después de 30 segundos de uso
      setTimeout(() => {
        // Verificar si el usuario no lo rechazó antes
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (!dismissed) {
          setShowPrompt(true)
        }
      }, 30000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Para iOS, mostrar instrucciones después de 30 segundos
    if (isIOSDevice) {
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (!dismissed) {
          setShowPrompt(true)
        }
      }, 30000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    const result = await installPrompt.prompt()

    if (result.outcome === 'accepted') {
      setShowPrompt(false)
      setInstallPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Recordar por 7 días
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // No mostrar si ya está instalada o no hay prompt
  if (isInstalled || !showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-4 md:w-96">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-violet-100 rounded-xl">
            <Smartphone className="w-6 h-6 text-violet-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-gray-900">
              Instalar Mimonotributo
            </h3>

            {isIOS ? (
              <p className="text-sm text-gray-600 mt-1">
                Tocá <span className="inline-flex items-center"><svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg></span>
                y luego "Agregar a inicio"
              </p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                Instalá la app para acceso rápido sin abrir el navegador
              </p>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isIOS && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Instalar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
