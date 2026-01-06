import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { Layout } from '../../../components/layout/Layout'
import { useNotificaciones } from '../hooks/useNotificaciones'
import { ListaNotificaciones } from './ListaNotificaciones'

export function NotificacionesPage() {
  const [filtro, setFiltro] = useState('todas')
  const { notificaciones, loading, marcarComoLeida, marcarTodasComoLeidas } = useNotificaciones(100, filtro === 'no_leidas')

  const cantidadNoLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <Layout title="Notificaciones">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">
              {cantidadNoLeidas > 0 ? `${cantidadNoLeidas} sin leer` : 'Todo leído'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtros */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFiltro('todas')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filtro === 'todas' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltro('no_leidas')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filtro === 'no_leidas' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                }`}
              >
                Sin leer
              </button>
            </div>

            {/* Marcar todas */}
            {cantidadNoLeidas > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : (
          <ListaNotificaciones
            notificaciones={notificaciones}
            onMarcarLeida={marcarComoLeida}
          />
        )}
      </div>
    </Layout>
  )
}
