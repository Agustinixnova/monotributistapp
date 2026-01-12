import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

/**
 * Componente para mostrar el estado fiscal de un cliente con un semáforo
 * TODO: Implementar lógica completa de cálculo de estado fiscal
 */

const ESTADO_CONFIG = {
  ok: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    label: 'Al día'
  },
  alerta: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    label: 'Atención'
  },
  critico: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    label: 'Crítico'
  },
  desconocido: {
    icon: AlertCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    label: 'Sin datos'
  }
}

/**
 * Tooltip con información del estado fiscal
 */
export function SemaforoTooltip({ clientId, className = '' }) {
  // TODO: Obtener estado fiscal real del cliente
  const estado = 'desconocido'
  const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG.desconocido
  const Icon = config.icon

  return (
    <div className={`relative group ${className}`}>
      <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      {/* Tooltip */}
      <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
        <p className="font-medium mb-1">{config.label}</p>
        <p className="text-gray-300">Estado fiscal no calculado</p>
        <div className="absolute top-0 right-4 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
      </div>
    </div>
  )
}

/**
 * Componente completo de semáforo con detalles
 */
export function SemaforoEstadoFiscal({ clientId, showLabel = false, className = '' }) {
  // TODO: Obtener estado fiscal real del cliente
  const estado = 'desconocido'
  const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG.desconocido
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      {showLabel && (
        <span className="text-sm text-gray-700">{config.label}</span>
      )}
    </div>
  )
}
