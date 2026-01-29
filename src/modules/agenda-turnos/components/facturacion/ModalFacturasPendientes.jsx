/**
 * Modal para gestionar facturas pendientes de emisión
 * Muestra la lista de facturas que fallaron y permite reintentar o descartar
 */

import { useState } from 'react'
import {
  X, AlertTriangle, RefreshCw, Trash2, Loader2,
  CheckCircle, XCircle, Clock, FileText
} from 'lucide-react'
import { useFacturasPendientes } from '../../hooks/useFacturasPendientes'
import { formatearMonto } from '../../utils/formatters'

export default function ModalFacturasPendientes({ isOpen, onClose }) {
  const {
    pendientes,
    loading,
    reintentando,
    reintentar,
    reintentarTodas,
    descartar
  } = useFacturasPendientes()

  const [reintentandoTodas, setReintentandoTodas] = useState(false)
  const [resultado, setResultado] = useState(null)

  if (!isOpen) return null

  const handleReintentar = async (pendiente) => {
    try {
      await reintentar(pendiente)
      // Mostrar mensaje de éxito breve
    } catch (err) {
      // El error ya se maneja en el hook
    }
  }

  const handleReintentarTodas = async () => {
    setReintentandoTodas(true)
    setResultado(null)
    try {
      const res = await reintentarTodas()
      setResultado(res)
    } finally {
      setReintentandoTodas(false)
    }
  }

  const handleDescartar = async (id) => {
    if (confirm('¿Descartar esta factura pendiente? No se emitirá.')) {
      await descartar(id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-heading font-semibold">
                Facturas Pendientes
              </h3>
              {pendientes.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {pendientes.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
                <p className="text-gray-500">Cargando...</p>
              </div>
            ) : pendientes.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">No hay facturas pendientes</p>
                <p className="text-gray-500 text-sm mt-1">
                  Todas las facturas fueron emitidas correctamente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Resultado del reintento masivo */}
                {resultado && (
                  <div className={`p-3 rounded-lg text-sm ${
                    resultado.fallidos === 0
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <p className="font-medium">
                      {resultado.exitosos > 0 && `${resultado.exitosos} emitida(s) correctamente`}
                      {resultado.exitosos > 0 && resultado.fallidos > 0 && ' | '}
                      {resultado.fallidos > 0 && `${resultado.fallidos} fallida(s)`}
                    </p>
                  </div>
                )}

                {/* Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <p>
                    Estas facturas no se pudieron emitir por problemas de conexión con ARCA.
                    Podés reintentar cuando el servicio esté disponible.
                  </p>
                </div>

                {/* Lista de pendientes */}
                {pendientes.map((pendiente) => (
                  <div
                    key={pendiente.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Tipo y cliente */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            pendiente.tipo_comprobante === 11
                              ? 'bg-blue-100 text-blue-700'
                              : pendiente.tipo_comprobante === 13
                              ? 'bg-red-100 text-red-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {pendiente.tipoNombre}
                          </span>
                        </div>

                        {/* Cliente y monto */}
                        <p className="font-medium text-gray-900 truncate">
                          {pendiente.clienteNombre}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatearMonto(pendiente.monto)}
                        </p>

                        {/* Fecha e intentos */}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(pendiente.created_at).toLocaleDateString('es-AR')}
                          </span>
                          <span>
                            {pendiente.intentos} intento{pendiente.intentos !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Error */}
                        {pendiente.ultimo_error && (
                          <p className="text-xs text-red-600 mt-1 line-clamp-1">
                            {pendiente.ultimo_error}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleReintentar(pendiente)}
                          disabled={reintentando === pendiente.id || reintentandoTodas}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          title="Reintentar"
                        >
                          {reintentando === pendiente.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDescartar(pendiente.id)}
                          disabled={reintentando === pendiente.id || reintentandoTodas}
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Descartar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {pendientes.length > 0 && (
            <div className="border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleReintentarTodas}
                disabled={reintentandoTodas || reintentando}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {reintentandoTodas ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reintentando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Reintentar todas
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
