/**
 * Modal de detalle de un movimiento de caja secundaria
 */

import { useState, useEffect } from 'react'
import { X, Clock, Calendar, User, FileText, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { formatearMonto, formatearFechaCorta, formatearHora } from '../utils/formatters'
import { getMovimientoSecundariaDetalle } from '../services/cajaSecundariaService'
import IconoDinamico from './IconoDinamico'

export default function ModalDetalleMovimientoSecundaria({ isOpen, onClose, movimiento, onRefresh }) {
  const [detalle, setDetalle] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && movimiento?.id) {
      const cargarDetalle = async () => {
        setLoading(true)
        const { data } = await getMovimientoSecundariaDetalle(movimiento.id)
        setDetalle(data)
        setLoading(false)
      }
      cargarDetalle()
    } else {
      setDetalle(null)
    }
  }, [isOpen, movimiento?.id])

  if (!isOpen || !movimiento) return null

  const esEntrada = movimiento.tipo === 'entrada'
  const colorClase = esEntrada ? 'emerald' : 'red'

  // Texto según el origen
  const getTextoOrigen = () => {
    if (esEntrada) {
      if (movimiento.origen === 'arqueo') return 'Ingreso desde arqueo de caja'
      return 'Ingreso desde caja principal'
    }
    if (movimiento.origen === 'reintegro') return 'Egreso a caja principal'
    if (movimiento.origen === 'gasto') return movimiento.categoria?.nombre || 'Gasto'
    return movimiento.origen
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm md:max-w-md">
          {/* Header */}
          <div className={`bg-${colorClase}-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl`}
               style={{ backgroundColor: esEntrada ? '#059669' : '#dc2626' }}>
            <div className="flex items-center gap-2">
              {esEntrada ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <h3 className="font-heading font-semibold text-lg">
                {esEntrada ? 'Entrada' : 'Salida'}
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-5 space-y-4">
            {/* Monto */}
            <div className="text-center py-2">
              <p className={`text-3xl font-bold ${esEntrada ? 'text-emerald-600' : 'text-red-600'}`}>
                {esEntrada ? '+' : '-'} {formatearMonto(movimiento.monto)}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {getTextoOrigen()}
              </p>
            </div>

            {/* Detalles */}
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              {/* Fecha y hora */}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {formatearFechaCorta(movimiento.fecha)}
                </span>
                <Clock className="w-4 h-4 text-gray-400 ml-2" />
                <span className="text-gray-600">
                  {formatearHora(movimiento.hora)}
                </span>
              </div>

              {/* Origen */}
              <div className="flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Origen: <span className="font-medium">{movimiento.origen}</span>
                </span>
              </div>

              {/* Descripción */}
              {movimiento.descripcion && (
                <div className="flex items-start gap-3 text-sm">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-gray-600 flex-1">{movimiento.descripcion}</p>
                </div>
              )}

              {/* Creador - solo se muestra cuando se carga el detalle */}
              <div className="flex items-center gap-3 text-sm border-t border-gray-200 pt-3 mt-3">
                <User className="w-4 h-4 text-gray-400" />
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Cargando...</span>
                  </div>
                ) : detalle?.creador ? (
                  <span className="text-gray-600">
                    Registrado por: <span className="font-medium">
                      {detalle.creador.nombre_completo && detalle.creador.nombre_completo !== 'Usuario'
                        ? detalle.creador.nombre_completo
                        : detalle.creador.nombre || detalle.creador.apellido
                          ? `${detalle.creador.nombre || ''} ${detalle.creador.apellido || ''}`.trim()
                          : detalle.creador.email
                            ? detalle.creador.email.split('@')[0]
                            : 'Usuario'}
                    </span>
                  </span>
                ) : movimiento?.created_by_id ? (
                  <span className="text-gray-500">Registrado por: Usuario</span>
                ) : (
                  <span className="text-gray-500">Sin información del creador</span>
                )}
              </div>

              {/* Solo efectivo */}
              <div className="text-xs text-gray-500 border-t border-gray-200 pt-3 mt-3 text-center">
                Solo efectivo
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
