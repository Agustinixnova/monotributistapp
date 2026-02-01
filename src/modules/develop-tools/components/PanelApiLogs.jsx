/**
 * Panel de Logs de APIs Externas
 * Muestra requests/responses a ARCA, AFIP y otras APIs
 * Tema: Dark Mode
 */

import { useState, useEffect } from 'react'
import {
  Globe,
  RefreshCw,
  Filter,
  Clock,
  User,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  X,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { supabaseRaw as supabase } from '../../../lib/supabase'
import { APIS_CONOCIDAS } from '../services/apiLogService'

// Colores por estado
const STATUS_CONFIG = {
  success: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', icon: CheckCircle },
  error: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', icon: XCircle },
  warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', icon: AlertTriangle }
}

export default function PanelApiLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [logSeleccionado, setLogSeleccionado] = useState(null)

  // Filtros
  const [filtros, setFiltros] = useState({
    api: 'todos',
    exitoso: 'todos',
    dias: 7
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // APIs disponibles
  const [apisDisponibles, setApisDisponibles] = useState([])

  // Cargar logs
  const cargarLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .gte('created_at', new Date(Date.now() - filtros.dias * 24 * 60 * 60 * 1000).toISOString())

      if (filtros.api !== 'todos') {
        query = query.eq('api', filtros.api)
      }
      if (filtros.exitoso !== 'todos') {
        query = query.eq('exitoso', filtros.exitoso === 'true')
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      setLogs(data || [])

      // Extraer APIs únicas
      const apis = [...new Set((data || []).map(l => l.api).filter(Boolean))]
      setApisDisponibles(apis)
    } catch (err) {
      console.error('Error cargando API logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarLogs()
  }, [filtros])

  // Resumen
  const resumen = {
    exitosos: logs.filter(l => l.exitoso).length,
    fallidos: logs.filter(l => !l.exitoso).length,
    total: logs.length
  }

  // Copiar todos los errores recientes para Claude
  const copiarResumenErrores = () => {
    const errores = logs.filter(l => !l.exitoso).slice(0, 10)

    if (errores.length === 0) {
      navigator.clipboard.writeText('No hay errores de API en el período seleccionado.')
      return
    }

    const resumen = `
# Resumen de Errores de APIs Externas

**Período:** Últimos ${filtros.dias} días
**Total errores:** ${resumen.fallidos}
**Total exitosos:** ${resumen.exitosos}

## Últimos ${errores.length} Errores:

${errores.map((e, i) => `
### Error ${i + 1}: ${e.api.toUpperCase()} - ${e.endpoint}

- **Fecha:** ${new Date(e.created_at).toLocaleString('es-AR')}
- **Método:** ${e.metodo}
- **Status:** ${e.status_code || 'N/A'}
- **Error:** ${e.error_mensaje || 'Sin mensaje'}
- **Código:** ${e.error_codigo || 'N/A'}
- **Usuario:** ${e.usuario_email || 'Sistema'}
- **Módulo:** ${e.modulo || 'N/A'}
- **Acción:** ${e.accion || 'N/A'}

**Request Body:**
\`\`\`json
${JSON.stringify(e.request_body, null, 2) || 'null'}
\`\`\`

**Response Body:**
\`\`\`json
${JSON.stringify(e.response_body, null, 2) || 'null'}
\`\`\`

**Contexto:**
\`\`\`json
${JSON.stringify(e.contexto, null, 2) || 'null'}
\`\`\`
`).join('\n---\n')}
`.trim()

    navigator.clipboard.writeText(resumen)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-white text-lg">APIs Externas</h3>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-0.5 bg-green-500/30 text-green-300 rounded-full">
              {resumen.exitosos} ok
            </span>
            {resumen.fallidos > 0 && (
              <span className="px-2 py-0.5 bg-red-500/30 text-red-300 rounded-full">
                {resumen.fallidos} errores
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {resumen.fallidos > 0 && (
            <button
              onClick={copiarResumenErrores}
              className="px-2 py-1 text-xs bg-orange-500/30 hover:bg-orange-500/50 text-orange-300 rounded-lg flex items-center gap-1"
              title="Copiar resumen de errores para Claude"
            >
              <Copy size={14} />
              Copiar errores
            </button>
          )}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`p-2 rounded-lg transition-colors ${mostrarFiltros ? 'bg-orange-500/30 text-orange-300' : 'hover:bg-gray-700 text-gray-400'}`}
          >
            <Filter size={18} />
          </button>
          <button
            onClick={cargarLogs}
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
            <label className="block text-xs text-gray-400 mb-1">API</label>
            <select
              value={filtros.api}
              onChange={e => setFiltros(prev => ({ ...prev, api: e.target.value }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value="todos">Todas</option>
              {apisDisponibles.map(a => (
                <option key={a} value={a}>{APIS_CONOCIDAS[a]?.nombre || a.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Estado</label>
            <select
              value={filtros.exitoso}
              onChange={e => setFiltros(prev => ({ ...prev, exitoso: e.target.value }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value="todos">Todos</option>
              <option value="true">Exitosos</option>
              <option value="false">Fallidos</option>
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
            </select>
          </div>
        </div>
      )}

      {/* Lista de logs */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            Cargando logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Globe className="mx-auto mb-2 text-gray-500" size={32} />
            <p>No hay logs de API registrados</p>
          </div>
        ) : (
          logs.map(log => {
            const statusConfig = log.exitoso ? STATUS_CONFIG.success : STATUS_CONFIG.error
            const apiConfig = APIS_CONOCIDAS[log.api] || APIS_CONOCIDAS.other
            const StatusIcon = statusConfig.icon

            return (
              <div
                key={log.id}
                onClick={() => setLogSeleccionado(log)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${statusConfig.bg} ${statusConfig.border} hover:brightness-110 ${logSeleccionado?.id === log.id ? 'ring-2 ring-orange-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <StatusIcon className={`mt-0.5 flex-shrink-0 ${statusConfig.text}`} size={18} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${apiConfig.bg} ${apiConfig.color}`}>
                          {apiConfig.nombre}
                        </span>
                        <span className="text-white font-medium text-sm truncate">
                          {log.metodo} {log.endpoint}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(log.created_at).toLocaleString('es-AR')}
                        </span>
                        {log.duracion_ms && (
                          <span className="flex items-center gap-1">
                            <Zap size={12} />
                            {log.duracion_ms}ms
                          </span>
                        )}
                        {log.usuario_email && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {log.usuario_email}
                          </span>
                        )}
                      </div>

                      {!log.exitoso && log.error_mensaje && (
                        <p className="text-red-400 text-xs mt-1 truncate">
                          {log.error_mensaje}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {log.status_code && (
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${log.status_code >= 400 ? 'bg-red-500/30 text-red-300' : 'bg-green-500/30 text-green-300'}`}>
                        {log.status_code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de detalle */}
      {logSeleccionado && (
        <DetalleApiLog
          log={logSeleccionado}
          onClose={() => setLogSeleccionado(null)}
        />
      )}
    </div>
  )
}

/**
 * Modal de detalle del log
 */
function DetalleApiLog({ log, onClose }) {
  const [expandido, setExpandido] = useState({ request: true, response: true, contexto: false })
  const [copiado, setCopiado] = useState(false)
  const statusConfig = log.exitoso ? STATUS_CONFIG.success : STATUS_CONFIG.error
  const apiConfig = APIS_CONOCIDAS[log.api] || APIS_CONOCIDAS.other

  const copiarParaClaude = () => {
    const info = `
## Log de API Externa

**API:** ${apiConfig.nombre} (${log.api})
**Endpoint:** ${log.metodo} ${log.endpoint}
**Fecha:** ${new Date(log.created_at).toLocaleString('es-AR')}
**Estado:** ${log.exitoso ? 'Exitoso' : 'Error'}
**Status Code:** ${log.status_code || 'N/A'}
**Duración:** ${log.duracion_ms || 'N/A'}ms

**Usuario:** ${log.usuario_email || 'Sistema'}
**Módulo:** ${log.modulo || 'N/A'}
**Acción:** ${log.accion || 'N/A'}

${!log.exitoso ? `
### Error
- **Mensaje:** ${log.error_mensaje || 'Sin mensaje'}
- **Código:** ${log.error_codigo || 'N/A'}
` : ''}

### Request Headers
\`\`\`json
${JSON.stringify(log.request_headers, null, 2) || 'null'}
\`\`\`

### Request Body
\`\`\`json
${JSON.stringify(log.request_body, null, 2) || 'null'}
\`\`\`

### Response Body
\`\`\`json
${JSON.stringify(log.response_body, null, 2) || 'null'}
\`\`\`

### Contexto Adicional
\`\`\`json
${JSON.stringify(log.contexto, null, 2) || 'null'}
\`\`\`
`.trim()

    navigator.clipboard.writeText(info)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className={`p-4 ${statusConfig.bg} border-b border-gray-700 flex items-start justify-between`}>
          <div className="flex items-start gap-3">
            <statusConfig.icon className={statusConfig.text} size={24} />
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${apiConfig.bg} ${apiConfig.color}`}>
                  {apiConfig.nombre}
                </span>
                <h3 className={`font-semibold ${statusConfig.text}`}>
                  {log.metodo} {log.endpoint}
                </h3>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(log.created_at).toLocaleString('es-AR')}
                {log.duracion_ms && ` • ${log.duracion_ms}ms`}
                {log.usuario_email && ` • ${log.usuario_email}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Info básica */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Status:</span>
              <span className={`ml-2 font-mono ${log.status_code >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                {log.status_code || 'N/A'}
              </span>
            </div>
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Módulo:</span>
              <span className="ml-2 text-white">{log.modulo || 'N/A'}</span>
            </div>
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Acción:</span>
              <span className="ml-2 text-white">{log.accion || 'N/A'}</span>
            </div>
          </div>

          {/* Error info */}
          {!log.exitoso && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 font-medium mb-1">
                <XCircle size={16} />
                Error
              </div>
              <p className="text-red-300">{log.error_mensaje || 'Sin mensaje de error'}</p>
              {log.error_codigo && (
                <p className="text-red-400/60 text-sm mt-1">Código: {log.error_codigo}</p>
              )}
            </div>
          )}

          {/* Request */}
          <div>
            <button
              onClick={() => setExpandido(prev => ({ ...prev, request: !prev.request }))}
              className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white w-full"
            >
              {expandido.request ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Request Body
            </button>
            {expandido.request && (
              <pre className="mt-2 p-3 bg-gray-900 text-blue-300 text-xs rounded-lg overflow-x-auto max-h-48 border border-gray-700">
                {JSON.stringify(log.request_body, null, 2) || 'null'}
              </pre>
            )}
          </div>

          {/* Response */}
          <div>
            <button
              onClick={() => setExpandido(prev => ({ ...prev, response: !prev.response }))}
              className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white w-full"
            >
              {expandido.response ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Response Body
            </button>
            {expandido.response && (
              <pre className={`mt-2 p-3 bg-gray-900 text-xs rounded-lg overflow-x-auto max-h-48 border border-gray-700 ${log.exitoso ? 'text-green-300' : 'text-red-300'}`}>
                {JSON.stringify(log.response_body, null, 2) || 'null'}
              </pre>
            )}
          </div>

          {/* Contexto */}
          {log.contexto && (
            <div>
              <button
                onClick={() => setExpandido(prev => ({ ...prev, contexto: !prev.contexto }))}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white w-full"
              >
                {expandido.contexto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Contexto Adicional
              </button>
              {expandido.contexto && (
                <pre className="mt-2 p-3 bg-gray-900 text-gray-300 text-xs rounded-lg overflow-x-auto max-h-32 border border-gray-700">
                  {JSON.stringify(log.contexto, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-end">
          <button
            onClick={copiarParaClaude}
            className="px-4 py-2 text-sm bg-orange-500/30 hover:bg-orange-500/50 text-orange-300 rounded-lg flex items-center gap-2"
          >
            {copiado ? (
              <>
                <CheckCircle size={16} />
                Copiado
              </>
            ) : (
              <>
                <Copy size={16} />
                Copiar para Claude
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
