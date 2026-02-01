/**
 * Panel de Feedback - Vista admin para gestionar feedback de usuarios
 * Tema: Dark Mode
 */

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  RefreshCw,
  Filter,
  Bug,
  Lightbulb,
  HelpCircle,
  MessageCircle,
  Clock,
  User,
  Globe,
  Eye,
  CheckCircle,
  Send,
  X,
  Loader2
} from 'lucide-react'
import { supabaseRaw as supabase } from '../../../lib/supabase'

// Config por tipo
const TIPO_CONFIG = {
  bug: { icon: Bug, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Bug' },
  sugerencia: { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Sugerencia' },
  pregunta: { icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Pregunta' },
  comentario: { icon: MessageCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Comentario' }
}

// Config por estado
const ESTADO_CONFIG = {
  nuevo: { bg: 'bg-blue-500/30', text: 'text-blue-300', label: 'Nuevo' },
  visto: { bg: 'bg-gray-600/50', text: 'text-gray-300', label: 'Visto' },
  en_progreso: { bg: 'bg-yellow-500/30', text: 'text-yellow-300', label: 'En progreso' },
  resuelto: { bg: 'bg-green-500/30', text: 'text-green-300', label: 'Resuelto' }
}

export default function PanelFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedbackSeleccionado, setFeedbackSeleccionado] = useState(null)

  // Filtros
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    tipo: 'todos',
    dias: 30
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Cargar feedbacks
  const cargarFeedbacks = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .gte('created_at', new Date(Date.now() - filtros.dias * 24 * 60 * 60 * 1000).toISOString())

      if (filtros.estado !== 'todos') {
        query = query.eq('estado', filtros.estado)
      }
      if (filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      setFeedbacks(data || [])
    } catch (err) {
      console.error('Error cargando feedback:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarFeedbacks()
  }, [filtros])

  // Cambiar estado
  const cambiarEstado = async (feedbackId, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', feedbackId)

      if (error) throw error

      setFeedbacks(prev =>
        prev.map(f => f.id === feedbackId ? { ...f, estado: nuevoEstado } : f)
      )
      if (feedbackSeleccionado?.id === feedbackId) {
        setFeedbackSeleccionado(prev => ({ ...prev, estado: nuevoEstado }))
      }
    } catch (err) {
      console.error('Error actualizando estado:', err)
    }
  }

  // Resumen
  const resumen = {
    nuevos: feedbacks.filter(f => f.estado === 'nuevo').length,
    total: feedbacks.length
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-white text-lg">Feedback de Usuarios</h3>
          <div className="flex gap-2 text-xs">
            {resumen.nuevos > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full">
                {resumen.nuevos} nuevos
              </span>
            )}
            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">
              {resumen.total} total
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`p-2 rounded-lg transition-colors ${mostrarFiltros ? 'bg-orange-500/30 text-orange-300' : 'hover:bg-gray-700 text-gray-400'}`}
          >
            <Filter size={18} />
          </button>
          <button
            onClick={cargarFeedbacks}
            disabled={loading}
            className="p-2 hover:bg-gray-700 text-gray-400 rounded-lg"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={e => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value="todos">Todos</option>
              <option value="nuevo">Nuevos</option>
              <option value="visto">Vistos</option>
              <option value="en_progreso">En progreso</option>
              <option value="resuelto">Resueltos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={e => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value="todos">Todos</option>
              <option value="bug">Bugs</option>
              <option value="sugerencia">Sugerencias</option>
              <option value="pregunta">Preguntas</option>
              <option value="comentario">Comentarios</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Período</label>
            <select
              value={filtros.dias}
              onChange={e => setFiltros(prev => ({ ...prev, dias: Number(e.target.value) }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value={7}>Última semana</option>
              <option value={30}>Último mes</option>
              <option value={90}>Últimos 3 meses</option>
            </select>
          </div>
        </div>
      )}

      {/* Lista de feedbacks */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            Cargando feedback...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="mx-auto mb-2 text-gray-500" size={32} />
            <p>No hay feedback registrado</p>
          </div>
        ) : (
          feedbacks.map(feedback => {
            const tipoConfig = TIPO_CONFIG[feedback.tipo] || TIPO_CONFIG.comentario
            const estadoConfig = ESTADO_CONFIG[feedback.estado] || ESTADO_CONFIG.nuevo
            const TipoIcon = tipoConfig.icon

            return (
              <div
                key={feedback.id}
                onClick={() => setFeedbackSeleccionado(feedback)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${tipoConfig.bg} border-gray-700 hover:brightness-110 ${feedbackSeleccionado?.id === feedback.id ? 'ring-2 ring-orange-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <TipoIcon className={`mt-0.5 flex-shrink-0 ${tipoConfig.color}`} size={18} />

                    <div className="flex-1 min-w-0">
                      <p className="text-white line-clamp-2">
                        {feedback.descripcion}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(feedback.created_at).toLocaleString('es-AR')}
                        </span>
                        {feedback.usuario_email && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {feedback.usuario_email}
                          </span>
                        )}
                        {feedback.modulo && (
                          <span className="flex items-center gap-1">
                            <Globe size={12} />
                            /{feedback.modulo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-xs ${tipoConfig.bg} ${tipoConfig.color}`}>
                      {tipoConfig.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${estadoConfig.bg} ${estadoConfig.text}`}>
                      {estadoConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de detalle */}
      {feedbackSeleccionado && (
        <DetalleFeedback
          feedback={feedbackSeleccionado}
          onClose={() => setFeedbackSeleccionado(null)}
          onCambiarEstado={cambiarEstado}
          onActualizar={cargarFeedbacks}
        />
      )}
    </div>
  )
}

/**
 * Modal de detalle del feedback
 */
function DetalleFeedback({ feedback, onClose, onCambiarEstado, onActualizar }) {
  const [respuesta, setRespuesta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const tipoConfig = TIPO_CONFIG[feedback.tipo] || TIPO_CONFIG.comentario
  const TipoIcon = tipoConfig.icon

  const enviarRespuesta = async () => {
    if (!respuesta.trim()) return

    setEnviando(true)
    try {
      const { error } = await supabase.rpc('responder_feedback', {
        p_feedback_id: feedback.id,
        p_respuesta: respuesta.trim()
      })

      if (error) throw error

      setRespuesta('')
      onActualizar()
      onClose()
    } catch (err) {
      console.error('Error respondiendo:', err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className={`p-4 ${tipoConfig.bg} border-b border-gray-700 flex items-start justify-between`}>
          <div className="flex items-start gap-3">
            <TipoIcon className={tipoConfig.color} size={24} />
            <div>
              <h3 className={`font-semibold ${tipoConfig.color}`}>
                {tipoConfig.label} de {feedback.usuario_email || 'Usuario anónimo'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(feedback.created_at).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Descripción */}
          <div className="p-4 bg-gray-900 rounded-lg">
            <p className="text-white whitespace-pre-wrap">{feedback.descripcion}</p>
          </div>

          {/* Contexto */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Página:</span>
              <span className="ml-2 text-white text-xs break-all">{feedback.url_origen || 'N/A'}</span>
            </div>
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Módulo:</span>
              <span className="ml-2 text-white">/{feedback.modulo || 'N/A'}</span>
            </div>
            <div className="p-2 bg-gray-700/50 rounded col-span-2">
              <span className="text-gray-400">Navegador:</span>
              <span className="ml-2 text-white text-xs">{feedback.navegador || 'N/A'}</span>
            </div>
          </div>

          {/* Respuesta existente */}
          {feedback.respuesta && (
            <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
                <CheckCircle size={16} />
                Respuesta enviada
              </div>
              <p className="text-green-300">{feedback.respuesta}</p>
              <p className="text-green-400/60 text-xs mt-2">
                {feedback.respondido_at && new Date(feedback.respondido_at).toLocaleString('es-AR')}
              </p>
            </div>
          )}

          {/* Formulario de respuesta */}
          {!feedback.respuesta && feedback.estado !== 'resuelto' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Responder al usuario
              </label>
              <textarea
                value={respuesta}
                onChange={e => setRespuesta(e.target.value)}
                placeholder="Escribí tu respuesta... (se enviará como notificación al usuario)"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => onCambiarEstado(feedback.id, 'visto')}
              disabled={feedback.estado === 'visto' || feedback.estado === 'resuelto'}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
              <Eye size={14} />
              Visto
            </button>
            <button
              onClick={() => onCambiarEstado(feedback.id, 'en_progreso')}
              disabled={feedback.estado === 'en_progreso' || feedback.estado === 'resuelto'}
              className="px-3 py-1.5 text-sm bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
              <Loader2 size={14} />
              En progreso
            </button>
          </div>

          {!feedback.respuesta && (
            <button
              onClick={enviarRespuesta}
              disabled={!respuesta.trim() || enviando}
              className="px-4 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2"
            >
              {enviando ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Enviar respuesta
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
