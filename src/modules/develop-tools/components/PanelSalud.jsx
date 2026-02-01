/**
 * Panel principal de Salud del Sistema
 */

import { useState } from 'react'
import {
  RefreshCw,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react'
import TarjetaServicio from './TarjetaServicio'
import { useSaludSistema } from '../hooks/useSaludSistema'
import { COLORES } from '../utils/umbrales'

export default function PanelSalud() {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const { datos, loading, error, ultimaActualizacion, refrescar } = useSaludSistema(autoRefresh, 60000)

  const getIconoEstado = (estado) => {
    switch (estado) {
      case 'verde':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'amarillo':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      case 'rojo':
        return <XCircle className="w-6 h-6 text-red-500" />
      default:
        return <Activity className="w-6 h-6 text-gray-500" />
    }
  }

  const formatearHora = (date) => {
    if (!date) return '--:--:--'
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Contar servicios por estado
  const contarPorEstado = (estado) => {
    if (!datos?.servicios) return 0
    return datos.servicios.filter(s => s.estado === estado).length
  }

  return (
    <div className="space-y-6">
      {/* Header con estado general */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {datos && getIconoEstado(datos.estadoGeneral)}
          <div>
            <h3 className="text-xl font-semibold text-white">Salud del Sistema</h3>
            <p className="text-sm text-gray-400">
              Última verificación: {formatearHora(ultimaActualizacion)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle auto-refresh */}
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
            />
            Auto-refresh (60s)
          </label>

          {/* Botón refrescar */}
          <button
            onClick={refrescar}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
        </div>
      </div>

      {/* Resumen rápido */}
      {datos && (
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${COLORES.verde.bg} border ${COLORES.verde.border}`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-green-400">{contarPorEstado('verde')}</span>
            </div>
            <p className="text-sm text-green-400/80 mt-1">Operativos</p>
          </div>

          <div className={`p-4 rounded-lg ${COLORES.amarillo.bg} border ${COLORES.amarillo.border}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-400">{contarPorEstado('amarillo')}</span>
            </div>
            <p className="text-sm text-yellow-400/80 mt-1">Con alertas</p>
          </div>

          <div className={`p-4 rounded-lg ${COLORES.rojo.bg} border ${COLORES.rojo.border}`}>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-red-400">{contarPorEstado('rojo')}</span>
            </div>
            <p className="text-sm text-red-400/80 mt-1">Con errores</p>
          </div>
        </div>
      )}

      {/* Error general */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
          Error al verificar: {error}
        </div>
      )}

      {/* Lista de servicios */}
      {loading && !datos ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : datos?.servicios ? (
        <div className="space-y-3">
          {datos.servicios.map((servicio, index) => (
            <TarjetaServicio key={index} servicio={servicio} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
