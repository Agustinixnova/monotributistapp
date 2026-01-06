import { useNavigate } from 'react-router-dom'
import { getConfigTipo, tiempoRelativo } from '../utils/notificacionesUtils'

export function NotificacionItem({ notificacion, onMarcarLeida, compacto = false }) {
  const navigate = useNavigate()
  const config = getConfigTipo(notificacion.tipo)
  const Icono = config.icono

  const handleClick = () => {
    if (!notificacion.leida) {
      onMarcarLeida(notificacion.id)
    }
    if (notificacion.link_to) {
      navigate(notificacion.link_to)
    }
  }

  const nombreCliente = notificacion.cliente?.user
    ? `${notificacion.cliente.user.nombre || ''} ${notificacion.cliente.user.apellido || ''}`.trim() || notificacion.cliente?.razon_social
    : notificacion.cliente?.razon_social || null

  if (compacto) {
    return (
      <button
        onClick={handleClick}
        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
          !notificacion.leida ? 'bg-violet-50' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icono className={`w-4 h-4 ${config.textColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${!notificacion.leida ? 'font-medium' : ''} text-gray-900 truncate`}>
              {notificacion.titulo}
            </p>
            <p className="text-xs text-gray-500">{tiempoRelativo(notificacion.created_at)}</p>
          </div>
          {!notificacion.leida && (
            <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2"></div>
          )}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full p-4 text-left rounded-xl border transition-all hover:shadow-md ${
        !notificacion.leida
          ? 'bg-violet-50 border-violet-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icono className={`w-5 h-5 ${config.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`${!notificacion.leida ? 'font-semibold' : 'font-medium'} text-gray-900`}>
              {notificacion.titulo}
            </p>
            {!notificacion.leida && (
              <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>
          {notificacion.mensaje && (
            <p className="text-sm text-gray-600 mt-1">{notificacion.mensaje}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{tiempoRelativo(notificacion.created_at)}</span>
            {nombreCliente && (
              <>
                <span>•</span>
                <span>{nombreCliente}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
