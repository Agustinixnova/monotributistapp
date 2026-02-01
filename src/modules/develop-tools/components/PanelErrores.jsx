/**
 * Panel de Errores - Vista de errores capturados
 * Tema: Dark Mode
 */

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  Bug,
  RefreshCw,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Filter,
  Clock,
  User,
  Globe,
  Monitor,
  Database,
  X,
  Rocket
} from 'lucide-react'
// Usar supabaseRaw para evitar que errores de este panel se logueen a sí mismos
import { supabaseRaw as supabase } from '../../../lib/supabase'

// Colores por severidad (dark mode)
const SEVERIDAD_CONFIG = {
  warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', icon: AlertTriangle },
  error: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', icon: AlertCircle },
  fatal: { bg: 'bg-red-600/30', border: 'border-red-500', text: 'text-red-300', icon: Bug }
}

// Colores por estado (dark mode)
const ESTADO_CONFIG = {
  nuevo: { bg: 'bg-blue-500/30', text: 'text-blue-300' },
  visto: { bg: 'bg-gray-600/50', text: 'text-gray-300' },
  resuelto: { bg: 'bg-green-500/30', text: 'text-green-300' },
  ignorado: { bg: 'bg-gray-700/50', text: 'text-gray-500' }
}

// Íconos por tipo
const TIPO_ICONS = {
  javascript: Globe,
  react: Monitor,
  supabase: Database,
  network: Globe,
  manual: Bug,
  deploy: Rocket
}

export default function PanelErrores() {
  const [errores, setErrores] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorSeleccionado, setErrorSeleccionado] = useState(null)
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  // Filtros
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    severidad: 'todos',
    modulo: 'todos',
    dias: 7
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Módulos únicos para el filtro
  const [modulosDisponibles, setModulosDisponibles] = useState([])

  // Cargar errores
  const cargarErrores = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('ultima_vez', { ascending: false })
        .gte('created_at', new Date(Date.now() - filtros.dias * 24 * 60 * 60 * 1000).toISOString())

      if (filtros.estado !== 'todos') {
        query = query.eq('estado', filtros.estado)
      }
      if (filtros.severidad !== 'todos') {
        query = query.eq('severidad', filtros.severidad)
      }
      if (filtros.modulo !== 'todos') {
        query = query.eq('modulo', filtros.modulo)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error

      setErrores(data || [])

      // Extraer módulos únicos
      const modulos = [...new Set((data || []).map(e => e.modulo).filter(Boolean))]
      setModulosDisponibles(modulos)
    } catch (err) {
      console.error('Error cargando errores:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarErrores()
  }, [filtros])

  // Cambiar estado de un error
  const cambiarEstado = async (errorId, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({ estado: nuevoEstado })
        .eq('id', errorId)

      if (error) throw error

      // Actualizar localmente
      setErrores(prev =>
        prev.map(e => e.id === errorId ? { ...e, estado: nuevoEstado } : e)
      )

      if (errorSeleccionado?.id === errorId) {
        setErrorSeleccionado(prev => ({ ...prev, estado: nuevoEstado }))
      }
    } catch (err) {
      console.error('Error actualizando estado:', err)
    }
  }

  // Eliminar todos los errores
  const eliminarTodosLosErrores = async () => {
    setEliminando(true)
    try {
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Trick para borrar todos

      if (error) throw error

      setErrores([])
      setMostrarModalEliminar(false)
    } catch (err) {
      console.error('Error eliminando:', err)
    } finally {
      setEliminando(false)
    }
  }

  // Generar error de prueba (solo para testing)
  const generarErrorPrueba = () => {
    setTimeout(() => {
      throw new Error('Error de prueba generado desde Dev Tools')
    }, 0)
  }

  // Resumen de estados
  const resumen = {
    nuevos: errores.filter(e => e.estado === 'nuevo').length,
    vistos: errores.filter(e => e.estado === 'visto').length,
    total: errores.length
  }

  return (
    <div className="space-y-4">
      {/* Header con resumen */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-white text-lg">Panel de Errores</h3>
          <div className="flex gap-2 text-sm">
            {resumen.nuevos > 0 && (
              <span className="px-2 py-0.5 bg-red-500/30 text-red-300 rounded-full">
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
            onClick={generarErrorPrueba}
            className="px-2 py-1 text-xs bg-orange-500/30 hover:bg-orange-500/50 text-orange-300 rounded-lg"
            title="Generar error de prueba"
          >
            Test
          </button>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`p-2 rounded-lg transition-colors ${mostrarFiltros ? 'bg-orange-500/30 text-orange-300' : 'hover:bg-gray-700 text-gray-400'}`}
          >
            <Filter size={18} />
          </button>
          <button
            onClick={cargarErrores}
            disabled={loading}
            className="p-2 hover:bg-gray-700 text-gray-400 rounded-lg"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setMostrarModalEliminar(true)}
            className="p-2 hover:bg-red-500/30 text-red-400 rounded-lg"
            title="Eliminar todos los errores"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="grid grid-cols-4 gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
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
              <option value="resuelto">Resueltos</option>
              <option value="ignorado">Ignorados</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Severidad</label>
            <select
              value={filtros.severidad}
              onChange={e => setFiltros(prev => ({ ...prev, severidad: e.target.value }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value="todos">Todas</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="fatal">Fatal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Módulo</label>
            <select
              value={filtros.modulo}
              onChange={e => setFiltros(prev => ({ ...prev, modulo: e.target.value }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value="todos">Todos</option>
              {modulosDisponibles.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Período</label>
            <select
              value={filtros.dias}
              onChange={e => setFiltros(prev => ({ ...prev, dias: Number(e.target.value) }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value={1}>Último día</option>
              <option value={7}>Última semana</option>
              <option value={30}>Último mes</option>
              <option value={90}>Últimos 3 meses</option>
            </select>
          </div>
        </div>
      )}

      {/* Lista de errores */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            Cargando errores...
          </div>
        ) : errores.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
            <p>No hay errores registrados</p>
          </div>
        ) : (
          errores.map(error => {
            const config = SEVERIDAD_CONFIG[error.severidad] || SEVERIDAD_CONFIG.error
            const estadoConfig = ESTADO_CONFIG[error.estado] || ESTADO_CONFIG.nuevo
            const TipoIcon = TIPO_ICONS[error.tipo] || Bug

            return (
              <div
                key={error.id}
                onClick={() => setErrorSeleccionado(error)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${config.bg} ${config.border} hover:brightness-110 ${errorSeleccionado?.id === error.id ? 'ring-2 ring-orange-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <config.icon className={`mt-0.5 flex-shrink-0 ${config.text}`} size={18} />

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${config.text}`}>
                        {error.mensaje}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <TipoIcon size={12} />
                          {error.tipo}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(error.ultima_vez).toLocaleString('es-AR')}
                        </span>
                        {error.usuario_email && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {error.usuario_email}
                          </span>
                        )}
                        {error.modulo && (
                          <span className="px-1.5 py-0.5 bg-gray-700/50 rounded">
                            /{error.modulo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {error.ocurrencias > 1 && (
                      <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full font-medium">
                        x{error.ocurrencias}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${estadoConfig.bg} ${estadoConfig.text}`}>
                      {error.estado}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      {mostrarModalEliminar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="p-4 bg-red-500/20 border-b border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/30 flex items-center justify-center">
                <Trash2 className="text-red-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Eliminar historial de errores</h3>
                <p className="text-sm text-gray-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-4">
              <p className="text-gray-300">
                ¿Estás seguro de que querés borrar <span className="font-bold text-white">todo el historial de errores</span>?
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Se eliminarán {errores.length} registro{errores.length !== 1 ? 's' : ''} de error.
              </p>
            </div>

            {/* Acciones */}
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setMostrarModalEliminar(false)}
                disabled={eliminando}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarTodosLosErrores}
                disabled={eliminando}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {eliminando ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Sí, eliminar todo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {errorSeleccionado && (
        <DetalleError
          error={errorSeleccionado}
          onClose={() => setErrorSeleccionado(null)}
          onCambiarEstado={cambiarEstado}
        />
      )}
    </div>
  )
}

/**
 * Modal con detalle del error (Dark Mode)
 */
function DetalleError({ error, onClose, onCambiarEstado }) {
  const [expandido, setExpandido] = useState({ stack: false, context: false })
  const config = SEVERIDAD_CONFIG[error.severidad] || SEVERIDAD_CONFIG.error

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className={`p-4 ${config.bg} border-b border-gray-700 flex items-start justify-between`}>
          <div className="flex items-start gap-3">
            <config.icon className={config.text} size={24} />
            <div>
              <h3 className={`font-semibold ${config.text}`}>
                {error.mensaje}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {error.tipo} • {new Date(error.ultima_vez).toLocaleString('es-AR')}
                {error.ocurrencias > 1 && ` • ${error.ocurrencias} ocurrencias`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Info del usuario */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Usuario:</span>
              <span className="ml-2 font-medium text-white">{error.usuario_email || 'Anónimo'}</span>
            </div>
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Módulo:</span>
              <span className="ml-2 font-medium text-white">/{error.modulo || 'desconocido'}</span>
            </div>
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Navegador:</span>
              <span className="ml-2 font-medium text-white">{error.navegador || 'Desconocido'}</span>
            </div>
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Viewport:</span>
              <span className="ml-2 font-medium text-white">{error.viewport || 'Desconocido'}</span>
            </div>
          </div>

          {/* URL */}
          <div className="p-2 bg-gray-700/50 rounded text-sm">
            <span className="text-gray-400">URL:</span>
            <span className="ml-2 font-mono text-xs text-gray-300 break-all">{error.url}</span>
          </div>

          {/* Acción previa */}
          {error.accion_previa && (
            <div className="p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-sm">
              <span className="text-yellow-400 font-medium">Acción previa:</span>
              <span className="ml-2 text-yellow-300">{error.accion_previa}</span>
            </div>
          )}

          {/* Stack Trace */}
          {error.stack_trace && (
            <div>
              <button
                onClick={() => setExpandido(prev => ({ ...prev, stack: !prev.stack }))}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                {expandido.stack ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Stack Trace
              </button>
              {expandido.stack && (
                <pre className="mt-2 p-3 bg-gray-900 text-gray-300 text-xs rounded-lg overflow-x-auto max-h-60 border border-gray-700">
                  {error.stack_trace}
                </pre>
              )}
            </div>
          )}

          {/* Component Stack */}
          {error.component_stack && (
            <div>
              <button
                onClick={() => setExpandido(prev => ({ ...prev, component: !prev.component }))}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                {expandido.component ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Component Stack (React)
              </button>
              {expandido.component && (
                <pre className="mt-2 p-3 bg-blue-900/50 text-blue-200 text-xs rounded-lg overflow-x-auto max-h-40 border border-blue-700/50">
                  {error.component_stack}
                </pre>
              )}
            </div>
          )}

          {/* Contexto */}
          {error.contexto && Object.keys(error.contexto).length > 0 && (
            <div>
              <button
                onClick={() => setExpandido(prev => ({ ...prev, context: !prev.context }))}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                {expandido.context ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Contexto adicional
              </button>
              {expandido.context && (
                <pre className="mt-2 p-3 bg-gray-900 text-gray-300 text-xs rounded-lg overflow-x-auto border border-gray-700">
                  {JSON.stringify(error.contexto, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Código Supabase */}
          {error.supabase_code && (
            <div className="p-2 bg-purple-500/20 border border-purple-500/50 rounded text-sm">
              <span className="text-purple-400 font-medium">Código Supabase:</span>
              <code className="ml-2 font-mono text-purple-300">{error.supabase_code}</code>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => onCambiarEstado(error.id, 'visto')}
              disabled={error.estado === 'visto'}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
              <Eye size={14} />
              Marcar visto
            </button>
            <button
              onClick={() => onCambiarEstado(error.id, 'resuelto')}
              disabled={error.estado === 'resuelto'}
              className="px-3 py-1.5 text-sm bg-green-600/30 hover:bg-green-600/50 text-green-300 rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
              <CheckCircle size={14} />
              Resuelto
            </button>
            <button
              onClick={() => onCambiarEstado(error.id, 'ignorado')}
              disabled={error.estado === 'ignorado'}
              className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
              <EyeOff size={14} />
              Ignorar
            </button>
          </div>

          <button
            onClick={() => {
              const info = `
**Error:** ${error.mensaje}
**Tipo:** ${error.tipo}
**Severidad:** ${error.severidad}
**Módulo:** ${error.modulo}
**URL:** ${error.url}
**Usuario:** ${error.usuario_email || 'Anónimo'}
**Navegador:** ${error.navegador}
**Viewport:** ${error.viewport}
**Ocurrencias:** ${error.ocurrencias}
**Primera vez:** ${new Date(error.primera_vez).toLocaleString('es-AR')}
**Última vez:** ${new Date(error.ultima_vez).toLocaleString('es-AR')}
${error.accion_previa ? `**Acción previa:** ${error.accion_previa}` : ''}
${error.supabase_code ? `**Código Supabase:** ${error.supabase_code}` : ''}

**Stack Trace:**
\`\`\`
${error.stack_trace || 'N/A'}
\`\`\`

${error.component_stack ? `**Component Stack:**\n\`\`\`\n${error.component_stack}\n\`\`\`` : ''}

${error.contexto && Object.keys(error.contexto).length > 0 ? `**Contexto:**\n\`\`\`json\n${JSON.stringify(error.contexto, null, 2)}\n\`\`\`` : ''}
`.trim()

              navigator.clipboard.writeText(info)
              alert('Copiado al portapapeles. Podés pegarlo en el chat con Claude.')
            }}
            className="px-3 py-1.5 text-sm bg-orange-500/30 hover:bg-orange-500/50 text-orange-300 rounded-lg"
          >
            Copiar para Claude
          </button>
        </div>
      </div>
    </div>
  )
}
