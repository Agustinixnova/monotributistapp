/**
 * Panel de Auditoría - Vista de cambios en el sistema
 * Tema: Dark Mode
 */

import { useState, useEffect } from 'react'
import {
  History,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Database,
  Edit3,
  Trash2,
  Plus,
  X,
  Copy,
  CheckCircle,
  Download
} from 'lucide-react'
import { supabaseRaw as supabase } from '../../../lib/supabase'

// Colores por acción
const ACCION_CONFIG = {
  INSERT: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', icon: Plus, label: 'Creado' },
  UPDATE: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', icon: Edit3, label: 'Modificado' },
  DELETE: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', icon: Trash2, label: 'Eliminado' }
}

// Mapeo de tablas a nombres legibles
const TABLA_NOMBRES = {
  // Sistema
  profiles: 'Usuarios',
  client_fiscal_data: 'Datos Fiscales',
  role_permissions: 'Permisos de Roles',
  user_module_access: 'Acceso a Módulos',
  monotributo_categoria_historial: 'Historial Categorías',
  // Agenda & Turnos
  agenda_turnos: 'Turnos',
  agenda_turno_pagos: 'Pagos de Turnos',
  agenda_facturas: 'Facturas AFIP',
  agenda_config_afip: 'Config. AFIP',
  agenda_clientes: 'Clientes Agenda',
  agenda_servicios: 'Servicios',
  // Caja Diaria
  caja_movimientos: 'Movimientos Caja',
  caja_cierres: 'Cierres de Caja',
  caja_arqueos: 'Arqueos de Caja',
  caja_fiados: 'Fiados',
  caja_pagos_fiado: 'Pagos de Fiados'
}

export default function PanelAuditoria() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [logSeleccionado, setLogSeleccionado] = useState(null)

  // Filtros
  const [filtros, setFiltros] = useState({
    tabla: 'todos',
    accion: 'todos',
    usuario: '',
    dias: 7
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Tablas disponibles
  const [tablasDisponibles, setTablasDisponibles] = useState([])

  // Cargar logs
  const cargarLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .gte('created_at', new Date(Date.now() - filtros.dias * 24 * 60 * 60 * 1000).toISOString())

      if (filtros.tabla !== 'todos') {
        query = query.eq('tabla', filtros.tabla)
      }
      if (filtros.accion !== 'todos') {
        query = query.eq('accion', filtros.accion)
      }
      if (filtros.usuario) {
        query = query.ilike('usuario_email', `%${filtros.usuario}%`)
      }

      const { data, error } = await query.limit(200)

      if (error) throw error

      setLogs(data || [])

      // Extraer tablas únicas
      const tablas = [...new Set((data || []).map(l => l.tabla).filter(Boolean))]
      setTablasDisponibles(tablas)
    } catch (err) {
      console.error('Error cargando auditoría:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarLogs()
  }, [filtros])

  // Limpiar logs viejos
  const limpiarViejos = async () => {
    try {
      const { data, error } = await supabase.rpc('limpiar_audit_logs', { dias: 90 })
      if (error) throw error
      cargarLogs()
    } catch (err) {
      console.error('Error limpiando:', err)
    }
  }

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Acción', 'Tabla', 'Registro ID', 'Descripción']
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString('es-AR'),
      log.usuario_email || 'Sistema',
      log.accion,
      log.tabla,
      log.registro_id,
      log.descripcion || ''
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Resumen
  const resumen = {
    inserts: logs.filter(l => l.accion === 'INSERT').length,
    updates: logs.filter(l => l.accion === 'UPDATE').length,
    deletes: logs.filter(l => l.accion === 'DELETE').length,
    total: logs.length
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-white text-lg">Auditoría del Sistema</h3>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-0.5 bg-green-500/30 text-green-300 rounded-full">
              +{resumen.inserts}
            </span>
            <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full">
              ~{resumen.updates}
            </span>
            <span className="px-2 py-0.5 bg-red-500/30 text-red-300 rounded-full">
              -{resumen.deletes}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportarCSV}
            disabled={logs.length === 0}
            className="p-2 hover:bg-gray-700 text-gray-400 rounded-lg disabled:opacity-50"
            title="Exportar a CSV"
          >
            <Download size={18} />
          </button>
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
        <div className="grid grid-cols-4 gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tabla</label>
            <select
              value={filtros.tabla}
              onChange={e => setFiltros(prev => ({ ...prev, tabla: e.target.value }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value="todos">Todas</option>
              {tablasDisponibles.map(t => (
                <option key={t} value={t}>{TABLA_NOMBRES[t] || t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Acción</label>
            <select
              value={filtros.accion}
              onChange={e => setFiltros(prev => ({ ...prev, accion: e.target.value }))}
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            >
              <option value="todos">Todas</option>
              <option value="INSERT">Creaciones</option>
              <option value="UPDATE">Modificaciones</option>
              <option value="DELETE">Eliminaciones</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Usuario</label>
            <input
              type="text"
              value={filtros.usuario}
              onChange={e => setFiltros(prev => ({ ...prev, usuario: e.target.value }))}
              placeholder="Buscar email..."
              className="w-full text-sm bg-gray-700 border-gray-600 text-white rounded-lg px-2 py-1"
            />
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

      {/* Lista de logs */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            Cargando auditoría...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <History className="mx-auto mb-2 text-gray-500" size={32} />
            <p>No hay registros de auditoría</p>
          </div>
        ) : (
          logs.map(log => {
            const config = ACCION_CONFIG[log.accion] || ACCION_CONFIG.UPDATE
            const ActionIcon = config.icon

            return (
              <div
                key={log.id}
                onClick={() => setLogSeleccionado(log)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${config.bg} ${config.border} hover:brightness-110 ${logSeleccionado?.id === log.id ? 'ring-2 ring-orange-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <ActionIcon className={`mt-0.5 flex-shrink-0 ${config.text}`} size={18} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${config.text}`}>
                          {config.label}
                        </span>
                        <span className="text-gray-400">en</span>
                        <span className="text-white font-medium">
                          {TABLA_NOMBRES[log.tabla] || log.tabla}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(log.created_at).toLocaleString('es-AR')}
                        </span>
                        {log.usuario_email && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {log.usuario_email}
                          </span>
                        )}
                        {log.campos_modificados && log.campos_modificados.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-gray-700/50 rounded">
                            {log.campos_modificados.length} campo{log.campos_modificados.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 font-mono">
                    {log.registro_id?.substring(0, 8)}...
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal de detalle */}
      {logSeleccionado && (
        <DetalleAuditoria
          log={logSeleccionado}
          onClose={() => setLogSeleccionado(null)}
        />
      )}
    </div>
  )
}

/**
 * Modal con detalle del log de auditoría
 */
function DetalleAuditoria({ log, onClose }) {
  const [expandido, setExpandido] = useState({ antes: false, despues: false })
  const [copiado, setCopiado] = useState(false)
  const config = ACCION_CONFIG[log.accion] || ACCION_CONFIG.UPDATE

  // Generar diff visual entre antes y después
  const generarDiff = () => {
    if (!log.datos_antes || !log.datos_despues) return null

    const cambios = []
    const allKeys = new Set([
      ...Object.keys(log.datos_antes || {}),
      ...Object.keys(log.datos_despues || {})
    ])

    allKeys.forEach(key => {
      const antes = log.datos_antes?.[key]
      const despues = log.datos_despues?.[key]

      if (JSON.stringify(antes) !== JSON.stringify(despues)) {
        cambios.push({ campo: key, antes, despues })
      }
    })

    return cambios
  }

  const diff = generarDiff()

  // Copiar para Claude
  const copiarParaClaude = () => {
    const info = `
## Registro de Auditoría

**Acción:** ${log.accion}
**Tabla:** ${log.tabla}
**Registro ID:** ${log.registro_id}
**Fecha:** ${new Date(log.created_at).toLocaleString('es-AR')}
**Usuario:** ${log.usuario_email || 'Sistema'}
**Descripción:** ${log.descripcion || 'N/A'}

${log.campos_modificados?.length > 0 ? `**Campos modificados:** ${log.campos_modificados.join(', ')}` : ''}

### Cambios Detectados:
${diff ? diff.map(d => `
**${d.campo}:**
- Antes: \`${JSON.stringify(d.antes)}\`
- Después: \`${JSON.stringify(d.despues)}\`
`).join('\n') : 'N/A'}

### Datos Antes:
\`\`\`json
${JSON.stringify(log.datos_antes, null, 2) || 'null'}
\`\`\`

### Datos Después:
\`\`\`json
${JSON.stringify(log.datos_despues, null, 2) || 'null'}
\`\`\`
`.trim()

    navigator.clipboard.writeText(info)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className={`p-4 ${config.bg} border-b border-gray-700 flex items-start justify-between`}>
          <div className="flex items-start gap-3">
            <config.icon className={config.text} size={24} />
            <div>
              <h3 className={`font-semibold ${config.text}`}>
                {config.label} en {TABLA_NOMBRES[log.tabla] || log.tabla}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(log.created_at).toLocaleString('es-AR')}
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
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Registro ID:</span>
              <span className="ml-2 font-mono text-white text-xs">{log.registro_id}</span>
            </div>
            <div className="p-2 bg-gray-700/50 rounded">
              <span className="text-gray-400">Módulo:</span>
              <span className="ml-2 text-white">{log.modulo || 'N/A'}</span>
            </div>
          </div>

          {/* Descripción */}
          {log.descripcion && (
            <div className="p-3 bg-gray-700/50 rounded text-sm">
              <span className="text-gray-400">Descripción:</span>
              <p className="text-white mt-1">{log.descripcion}</p>
            </div>
          )}

          {/* Diff visual */}
          {diff && diff.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Cambios:</h4>
              <div className="space-y-2">
                {diff.map((d, i) => (
                  <div key={i} className="p-2 bg-gray-900 rounded border border-gray-700">
                    <div className="text-xs font-medium text-gray-400 mb-1">{d.campo}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded">
                        <span className="text-red-400">Antes: </span>
                        <code className="text-red-300">{JSON.stringify(d.antes) || 'null'}</code>
                      </div>
                      <div className="p-1.5 bg-green-500/10 border border-green-500/30 rounded">
                        <span className="text-green-400">Después: </span>
                        <code className="text-green-300">{JSON.stringify(d.despues) || 'null'}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos completos */}
          {log.datos_antes && (
            <div>
              <button
                onClick={() => setExpandido(prev => ({ ...prev, antes: !prev.antes }))}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                {expandido.antes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Datos antes (completo)
              </button>
              {expandido.antes && (
                <pre className="mt-2 p-3 bg-gray-900 text-red-300 text-xs rounded-lg overflow-x-auto max-h-40 border border-gray-700">
                  {JSON.stringify(log.datos_antes, null, 2)}
                </pre>
              )}
            </div>
          )}

          {log.datos_despues && (
            <div>
              <button
                onClick={() => setExpandido(prev => ({ ...prev, despues: !prev.despues }))}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                {expandido.despues ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Datos después (completo)
              </button>
              {expandido.despues && (
                <pre className="mt-2 p-3 bg-gray-900 text-green-300 text-xs rounded-lg overflow-x-auto max-h-40 border border-gray-700">
                  {JSON.stringify(log.datos_despues, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 flex justify-end">
          <button
            onClick={copiarParaClaude}
            className="px-3 py-1.5 text-sm bg-orange-500/30 hover:bg-orange-500/50 text-orange-300 rounded-lg flex items-center gap-2"
          >
            {copiado ? (
              <>
                <CheckCircle size={14} />
                Copiado
              </>
            ) : (
              <>
                <Copy size={14} />
                Copiar para Claude
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
