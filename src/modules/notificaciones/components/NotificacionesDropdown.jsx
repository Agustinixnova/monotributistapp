import { useNavigate } from 'react-router-dom'
import { useNotificaciones } from '../hooks/useNotificaciones'
import { NotificacionItem } from './NotificacionItem'

export function NotificacionesDropdown({ onClose }) {
  const navigate = useNavigate()
  const { notificaciones, marcarComoLeida } = useNotificaciones(5, false)

  const handleVerTodas = () => {
    onClose()
    navigate('/notificaciones')
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Notificaciones</h3>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {notificaciones.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Sin notificaciones
          </div>
        ) : (
          notificaciones.map(notif => (
            <NotificacionItem
              key={notif.id}
              notificacion={notif}
              onMarcarLeida={(id) => {
                marcarComoLeida(id)
                if (notif.link_to) onClose()
              }}
              compacto
            />
          ))
        )}
      </div>

      <div className="p-2 border-t border-gray-100">
        <button
          onClick={handleVerTodas}
          className="w-full py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          Ver todas
        </button>
      </div>
    </div>
  )
}
