import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Clock, Check, X, MessageSquare,
  ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react'

/**
 * Tarjeta de sugerencia para la contadora
 */
export function TarjetaSugerencia({
  sugerencia,
  onAceptar,
  onRechazar,
  procesando = false
}) {
  const [expanded, setExpanded] = useState(false)
  const [showRechazarForm, setShowRechazarForm] = useState(false)
  const [showModificarForm, setShowModificarForm] = useState(false)
  const [valorModificado, setValorModificado] = useState(sugerencia.valor_sugerido)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleAceptar = () => {
    onAceptar?.(sugerencia.id, null)
  }

  const handleAceptarModificado = () => {
    if (valorModificado !== sugerencia.valor_sugerido) {
      onAceptar?.(sugerencia.id, valorModificado)
    } else {
      onAceptar?.(sugerencia.id, null)
    }
    setShowModificarForm(false)
  }

  const handleRechazar = () => {
    onRechazar?.(sugerencia.id, motivoRechazo || null)
    setShowRechazarForm(false)
  }

  // Datos del cliente
  const clienteNombre = sugerencia.cliente?.user?.full_name ||
    sugerencia.cliente?.user?.nombre ||
    sugerencia.cliente?.razon_social ||
    'Cliente'

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Cliente y campo */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/mi-cartera/${sugerencia.client_id}`}
                className="font-medium text-gray-900 hover:text-violet-600 flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                {clienteNombre}
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="text-gray-400">quiere cambiar</span>
              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-sm font-medium">
                {sugerencia.campo_label || sugerencia.campo}
              </span>
            </div>

            {/* Valores */}
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block text-xs mb-1">Valor actual</span>
                <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded block">
                  {sugerencia.valor_actual || <em className="text-gray-400">Sin datos</em>}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs mb-1">Valor sugerido</span>
                <span className="text-green-700 bg-green-50 px-2 py-1 rounded block font-medium">
                  {sugerencia.valor_sugerido}
                </span>
              </div>
            </div>

            {/* Comentario */}
            {sugerencia.comentario && (
              <div className="mt-3 flex items-start gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600 italic">"{sugerencia.comentario}"</p>
              </div>
            )}
          </div>

          {/* Toggle detalles */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Fecha */}
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatFecha(sugerencia.created_at)}</span>
        </div>
      </div>

      {/* Detalles expandidos */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Tabla: {sugerencia.tabla}</p>
            <p>Campo: {sugerencia.campo}</p>
            {sugerencia.cliente?.cuit && (
              <p>CUIT: {sugerencia.cliente.cuit}</p>
            )}
          </div>
        </div>
      )}

      {/* Formulario de rechazo */}
      {showRechazarForm && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-red-50">
          <div className="pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del rechazo (opcional)
            </label>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Explica por que se rechaza..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowRechazarForm(false)}
                className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                disabled={procesando}
                className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de modificacion */}
      {showModificarForm && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-blue-50">
          <div className="pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor a aplicar
            </label>
            <input
              type="text"
              value={valorModificado}
              onChange={(e) => setValorModificado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowModificarForm(false)}
                className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAceptarModificado}
                disabled={procesando}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Acciones */}
      {!showRechazarForm && !showModificarForm && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
          <button
            onClick={handleAceptar}
            disabled={procesando}
            className="flex-1 min-w-[100px] px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {procesando ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Aceptar
          </button>

          <button
            onClick={() => setShowModificarForm(true)}
            disabled={procesando}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors text-sm disabled:opacity-50"
          >
            Modificar
          </button>

          <button
            onClick={() => setShowRechazarForm(true)}
            disabled={procesando}
            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Rechazar
          </button>
        </div>
      )}
    </div>
  )
}
