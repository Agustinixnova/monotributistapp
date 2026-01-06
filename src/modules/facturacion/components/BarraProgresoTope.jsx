import { formatearMoneda } from '../utils/formatters'

export function BarraProgresoTope({
  facturado,
  tope,
  porcentaje,
  estadoAlerta = 'ok',
  compacto = false
}) {
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
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Riesgo de exclusion. Muy cerca del tope maximo de la categoria.
        </div>
      )}
      {estadoAlerta === 'recategorizacion' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          Considera recategorizar. Te estas acercando al limite.
        </div>
      )}
    </div>
  )
}
