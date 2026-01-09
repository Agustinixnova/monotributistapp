import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { formatearMoneda } from '../utils/formatters'
import { ModalEnviarMensaje } from '../../buzon/components/ModalEnviarMensaje'

export function BarraProgresoTope({
  facturado,
  tope,
  porcentaje,
  estadoAlerta = 'ok',
  compacto = false,
  clientId = null
}) {
  const [showContactar, setShowContactar] = useState(false)
  const colores = {
    exclusion: 'bg-red-500',
    recategorizacion: 'bg-yellow-500',
    ok: 'bg-green-500'
  }

  const colorBarra = colores[estadoAlerta] || colores.ok

  if (compacto) {
    return (
      <div className="space-y-1">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorBarra} transition-all duration-500`}
            style={{ width: `${Math.min(porcentaje, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatearMoneda(facturado)}</span>
          <span>de {formatearMoneda(tope)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorBarra} transition-all duration-500`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          {formatearMoneda(facturado)} de {formatearMoneda(tope)}
        </span>
        <span className={`font-medium ${
          estadoAlerta === 'exclusion' ? 'text-red-600' :
          estadoAlerta === 'recategorizacion' ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {porcentaje.toFixed(0)}%
        </span>
      </div>

      {estadoAlerta === 'exclusion' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-2">
          <span className="text-red-700 text-sm">
            Riesgo de exclusion. Muy cerca del tope maximo de la categoria.
          </span>
          <button
            onClick={() => setShowContactar(true)}
            className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-xs font-medium transition-colors flex-shrink-0"
          >
            <MessageSquare className="w-3 h-3" />
            Contactarme
          </button>
        </div>
      )}
      {estadoAlerta === 'recategorizacion' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between gap-2">
          <span className="text-yellow-700 text-sm">
            Considera recategorizar. Te estas acercando al limite.
          </span>
          <button
            onClick={() => setShowContactar(true)}
            className="flex items-center gap-1 px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md text-xs font-medium transition-colors flex-shrink-0"
          >
            <MessageSquare className="w-3 h-3" />
            Contactarme
          </button>
        </div>
      )}

      {/* Modal de contacto */}
      {showContactar && (
        <ModalEnviarMensaje
          asunto={estadoAlerta === 'exclusion' ? 'Riesgo de Exclusion' : 'Consulta sobre Recategorizacion'}
          asuntoEditable={false}
          origen={estadoAlerta}
          origenReferencia={clientId ? { clientId, porcentaje: porcentaje.toFixed(1) } : null}
          onClose={() => setShowContactar(false)}
        />
      )}
    </div>
  )
}
