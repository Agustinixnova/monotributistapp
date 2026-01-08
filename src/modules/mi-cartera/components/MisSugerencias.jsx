import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useMisSugerencias } from '../hooks/useSugerencias'

/**
 * Lista de sugerencias del cliente (para ver en Mi Cuenta)
 */
export function MisSugerencias() {
  const { sugerencias, pendientes, procesadas, loading, error, refetch } = useMisSugerencias()

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstadoConfig = (estado) => {
    switch (estado) {
      case 'pendiente':
        return {
          label: 'Pendiente',
          icon: Clock,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          iconColor: 'text-yellow-600'
        }
      case 'aceptada':
        return {
          label: 'Aceptada',
          icon: CheckCircle,
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          iconColor: 'text-green-600'
        }
      case 'aceptada_modificada':
        return {
          label: 'Aceptada (modificada)',
          icon: CheckCircle,
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          iconColor: 'text-green-600'
        }
      case 'rechazada':
        return {
          label: 'Rechazada',
          icon: XCircle,
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          iconColor: 'text-red-600'
        }
      default:
        return {
          label: estado,
          icon: AlertCircle,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          iconColor: 'text-gray-600'
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-red-800 font-medium">Error cargando sugerencias</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-red-700 hover:text-red-800 text-sm flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (sugerencias.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-gray-900 font-medium mb-1">Sin sugerencias</h3>
        <p className="text-gray-500 text-sm">
          Cuando sugieras una correccion en tus datos, aparecera aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sugerencias pendientes */}
      {pendientes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            Pendientes ({pendientes.length})
          </h3>
          <div className="space-y-3">
            {pendientes.map(sugerencia => (
              <SugerenciaCard
                key={sugerencia.id}
                sugerencia={sugerencia}
                formatFecha={formatFecha}
                getEstadoConfig={getEstadoConfig}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sugerencias procesadas */}
      {procesadas.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gray-400" />
            Historial ({procesadas.length})
          </h3>
          <div className="space-y-3">
            {procesadas.map(sugerencia => (
              <SugerenciaCard
                key={sugerencia.id}
                sugerencia={sugerencia}
                formatFecha={formatFecha}
                getEstadoConfig={getEstadoConfig}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SugerenciaCard({ sugerencia, formatFecha, getEstadoConfig }) {
  const config = getEstadoConfig(sugerencia.estado)
  const Icon = config.icon

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">
              {sugerencia.campo_label || sugerencia.campo}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${config.bgColor} ${config.textColor}`}>
              <Icon className={`w-3 h-3 ${config.iconColor}`} />
              {config.label}
            </span>
          </div>

          {/* Valores */}
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 w-20 flex-shrink-0">Actual:</span>
              <span className="text-gray-600">
                {sugerencia.valor_actual || <em className="text-gray-400">Sin datos</em>}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 w-20 flex-shrink-0">Sugerido:</span>
              <span className="text-gray-900 font-medium">{sugerencia.valor_sugerido}</span>
            </div>
            {sugerencia.estado === 'aceptada_modificada' && sugerencia.valor_aplicado && (
              <div className="flex items-baseline gap-2">
                <span className="text-gray-500 w-20 flex-shrink-0">Aplicado:</span>
                <span className="text-green-700 font-medium">{sugerencia.valor_aplicado}</span>
              </div>
            )}
          </div>

          {/* Comentario del cliente */}
          {sugerencia.comentario && (
            <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2 italic">
              "{sugerencia.comentario}"
            </p>
          )}

          {/* Nota de revision */}
          {sugerencia.nota_revision && (
            <div className="mt-2 text-sm bg-blue-50 border border-blue-100 rounded p-2">
              <span className="text-blue-700 font-medium">Nota:</span>
              <span className="text-blue-600 ml-1">{sugerencia.nota_revision}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer con fechas */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Enviada: {formatFecha(sugerencia.created_at)}</span>
        {sugerencia.revisado_at && (
          <span>Procesada: {formatFecha(sugerencia.revisado_at)}</span>
        )}
        {sugerencia.revisado_by_profile && (
          <span>
            Por: {sugerencia.revisado_by_profile.nombre || sugerencia.revisado_by_profile.full_name}
          </span>
        )}
      </div>
    </div>
  )
}
