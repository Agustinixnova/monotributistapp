import { useState, useEffect } from 'react'
import { CalendarDays, ChevronRight, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { getEventosFiscalesUsuario, EVENTO_CONFIG, EVENTO_TIPO } from '../services/eventosFiscalesService'
import { ModalCalendarioFiscal } from './ModalCalendarioFiscal'

/**
 * Card que muestra el proximo evento fiscal y permite abrir calendario anual
 */
export function CardProximoEvento() {
  const { user } = useAuth()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCalendario, setShowCalendario] = useState(false)
  const [clientId, setClientId] = useState(null)

  useEffect(() => {
    async function fetchEventos() {
      if (!user?.id) return

      try {
        setLoading(true)

        // Obtener client_id
        const { data: clientData } = await supabase
          .from('client_fiscal_data')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (clientData) {
          setClientId(clientData.id)
        }

        // Obtener eventos
        const eventosData = await getEventosFiscalesUsuario(user.id)
        setEventos(eventosData || [])
      } catch (error) {
        console.error('Error fetching eventos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEventos()
  }, [user?.id])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      </div>
    )
  }

  // Si no hay eventos
  if (eventos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 rounded-lg">
            <CalendarDays className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Proximos eventos</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-green-600 font-medium">Todo al dia</p>
          <p className="text-sm text-gray-500 mt-1">No hay eventos fiscales pendientes</p>
        </div>
        <button
          onClick={() => setShowCalendario(true)}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          Ver calendario anual
          <ChevronRight className="w-4 h-4" />
        </button>

        {showCalendario && clientId && (
          <ModalCalendarioFiscal
            clientId={clientId}
            onClose={() => setShowCalendario(false)}
          />
        )}
      </div>
    )
  }

  // Evento principal (el primero es el mas urgente)
  const eventoPrincipal = eventos[0]
  const configPrincipal = EVENTO_CONFIG[eventoPrincipal.tipo]

  // Eventos secundarios (los siguientes 2-3)
  const eventosSecundarios = eventos.slice(1, 4)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-50 rounded-lg">
            <CalendarDays className="w-5 h-5 text-violet-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Proximos eventos fiscales</h3>
        </div>
        <button
          onClick={() => setShowCalendario(true)}
          className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
        >
          Ver calendario
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Evento principal destacado */}
      <div
        className={`p-4 cursor-pointer hover:opacity-90 transition-opacity ${
          eventoPrincipal.prioridad === 'critico' ? 'bg-red-50' :
          eventoPrincipal.prioridad === 'urgente' ? 'bg-amber-50' :
          configPrincipal.bgColor
        }`}
        onClick={() => setShowCalendario(true)}
      >
        <div className="flex items-start gap-4">
          {/* Indicador de urgencia */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
            eventoPrincipal.prioridad === 'critico' ? 'bg-red-100' :
            eventoPrincipal.prioridad === 'urgente' ? 'bg-amber-100' :
            'bg-white'
          }`}>
            {eventoPrincipal.diasRestantes !== null && eventoPrincipal.diasRestantes >= 0 ? (
              <div className="text-center">
                <span className={`text-xl font-bold ${
                  eventoPrincipal.prioridad === 'critico' ? 'text-red-600' :
                  eventoPrincipal.prioridad === 'urgente' ? 'text-amber-600' :
                  configPrincipal.textColor
                }`}>
                  {eventoPrincipal.diasRestantes}
                </span>
                <p className="text-[10px] text-gray-500 -mt-1">dias</p>
              </div>
            ) : (
              <AlertCircle className={`w-6 h-6 ${
                eventoPrincipal.prioridad === 'critico' ? 'text-red-600' : 'text-amber-600'
              }`} />
            )}
          </div>

          {/* Info del evento */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                eventoPrincipal.prioridad === 'critico' ? 'bg-red-100 text-red-700' :
                eventoPrincipal.prioridad === 'urgente' ? 'bg-amber-100 text-amber-700' :
                `${configPrincipal.bgColor} ${configPrincipal.textColor}`
              }`}>
                {configPrincipal.label}
              </span>
            </div>
            <h4 className={`font-semibold ${
              eventoPrincipal.prioridad === 'critico' ? 'text-red-900' :
              eventoPrincipal.prioridad === 'urgente' ? 'text-amber-900' :
              'text-gray-900'
            }`}>
              {eventoPrincipal.descripcion}
            </h4>
            <p className={`text-sm mt-0.5 ${
              eventoPrincipal.prioridad === 'critico' ? 'text-red-700' :
              eventoPrincipal.prioridad === 'urgente' ? 'text-amber-700' :
              'text-gray-600'
            }`}>
              {eventoPrincipal.fechaStr} - {eventoPrincipal.detalle}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de eventos secundarios */}
      {eventosSecundarios.length > 0 && (
        <div className="divide-y divide-gray-100">
          {eventosSecundarios.map((evento, idx) => {
            const config = EVENTO_CONFIG[evento.tipo]
            return (
              <div
                key={idx}
                className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => setShowCalendario(true)}
              >
                <div className={`w-2 h-2 rounded-full ${
                  evento.prioridad === 'urgente' ? 'bg-amber-500' :
                  evento.prioridad === 'critico' ? 'bg-red-500' :
                  `bg-${config.color}-500`
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {evento.descripcion}
                  </p>
                  <p className="text-xs text-gray-500">{evento.fechaStr}</p>
                </div>
                {evento.diasRestantes !== null && evento.diasRestantes >= 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {evento.diasRestantes}d
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer con mas eventos */}
      {eventos.length > 4 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => setShowCalendario(true)}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            +{eventos.length - 4} eventos mas
          </button>
        </div>
      )}

      {/* Modal calendario */}
      {showCalendario && clientId && (
        <ModalCalendarioFiscal
          clientId={clientId}
          onClose={() => setShowCalendario(false)}
        />
      )}
    </div>
  )
}

export default CardProximoEvento
