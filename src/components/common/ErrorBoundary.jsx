/**
 * ErrorBoundary - Captura errores de React y los registra
 *
 * Uso:
 * <ErrorBoundary>
 *   <MiComponente />
 * </ErrorBoundary>
 *
 * O con fallback personalizado:
 * <ErrorBoundary fallback={<MiErrorUI />}>
 *   <MiComponente />
 * </ErrorBoundary>
 */

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { captureError } from '../../modules/develop-tools/services/errorService'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Guardar info del error
    this.setState({ errorInfo })

    // Capturar el error en nuestro sistema
    captureError(error, {
      tipo: 'react',
      severidad: 'fatal',
      componentStack: errorInfo?.componentStack,
      accion: 'Render de componente',
      contexto: {
        componentStack: errorInfo?.componentStack
      }
    })

    // También loguear en consola para desarrollo
    console.error('[ErrorBoundary] Error capturado:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Si hay fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback
      }

      // UI por defecto
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>

            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Algo salió mal
            </h3>

            <p className="text-red-600 text-sm mb-4">
              {this.state.error?.message || 'Ocurrió un error inesperado'}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                Intentar de nuevo
              </button>

              <button
                onClick={this.handleReload}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Recargar página
              </button>
            </div>

            {/* Stack trace en desarrollo */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-red-500 cursor-pointer hover:text-red-700">
                  Ver detalles técnicos
                </summary>
                <pre className="mt-2 p-3 bg-red-900 text-red-100 text-xs rounded overflow-auto max-h-40">
                  {this.state.error?.stack}
                  {'\n\nComponent Stack:'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
