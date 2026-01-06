import { NotificacionItem } from './NotificacionItem'
import { agruparPorFecha } from '../utils/notificacionesUtils'

export function ListaNotificaciones({ notificaciones, onMarcarLeida }) {
  const grupos = agruparPorFecha(notificaciones)

  const renderGrupo = (titulo, items) => {
    if (items.length === 0) return null
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1">
          {titulo}
        </h3>
        <div className="space-y-2">
          {items.map(notif => (
            <NotificacionItem
              key={notif.id}
              notificacion={notif}
              onMarcarLeida={onMarcarLeida}
            />
          ))}
        </div>
      </div>
    )
  }

  if (notificaciones.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No tenés notificaciones
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderGrupo('Hoy', grupos.hoy)}
      {renderGrupo('Ayer', grupos.ayer)}
      {renderGrupo('Esta semana', grupos.semana)}
      {renderGrupo('Anteriores', grupos.anteriores)}
    </div>
  )
}
