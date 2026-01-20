/**
 * Item individual de movimiento en la lista
 * - Mobile: diseño vertical compacto
 * - Desktop: diseño horizontal tipo fila de tabla
 * - Click en el movimiento abre modal de detalle
 */

import { ArrowUpCircle, ArrowDownCircle, Trash2, MessageSquare } from 'lucide-react'
import { formatearMonto, formatearHora } from '../utils/formatters'
import DetalleMetodosPago from './DetalleMetodosPago'
import IconoDinamico from './IconoDinamico'

export default function MovimientoItem({ movimiento, onAnular, onEditarComentario, onVerDetalle }) {
  const esEntrada = movimiento.tipo === 'entrada'
  const Icon = esEntrada ? ArrowUpCircle : ArrowDownCircle
  const colorIcon = esEntrada ? 'text-emerald-600' : 'text-red-600'
  const colorMonto = esEntrada ? 'text-emerald-700' : 'text-red-700'
  const bgColor = esEntrada ? 'bg-emerald-50/50' : 'bg-red-50/50'

  return (
    <div className={`border border-gray-200 rounded-lg hover:shadow-sm transition-shadow ${bgColor}`}>
      {/* Layout Mobile (default) */}
      <div className="md:hidden p-3">
        <div className="flex items-start gap-3">
          {/* Área clickeable para ver detalle */}
          <button
            onClick={onVerDetalle}
            className="flex items-start gap-3 flex-1 min-w-0 text-left"
          >
            <div className={`mt-0.5 ${colorIcon}`}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconoDinamico nombre={movimiento.categoria?.icono} className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900 text-sm">
                    {movimiento.categoria?.nombre}
                  </span>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatearHora(movimiento.hora)}
                </span>
              </div>

              {movimiento.descripcion && (
                <p className="text-xs text-gray-600 mt-0.5 truncate">{movimiento.descripcion}</p>
              )}

              <div className="flex items-center justify-between mt-1">
                <div className={`text-base font-bold ${colorMonto}`}>
                  {esEntrada ? '+' : '-'} {formatearMonto(movimiento.monto_total)}
                </div>
                <DetalleMetodosPago pagos={movimiento.pagos} compact />
              </div>
            </div>
          </button>

          {/* Botones de acción */}
          <div className="flex flex-col gap-1">
            {onEditarComentario && (
              <button
                onClick={() => onEditarComentario(movimiento)}
                className={`p-1.5 hover:bg-violet-100 rounded transition-colors ${
                  movimiento.descripcion ? 'text-violet-500' : 'text-gray-400'
                } hover:text-violet-600`}
                title={movimiento.descripcion ? 'Editar comentario' : 'Agregar comentario'}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}
            {onAnular && (
              <button
                onClick={() => onAnular(movimiento.id)}
                className="p-1.5 hover:bg-red-100 rounded transition-colors text-gray-400 hover:text-red-600"
                title="Anular movimiento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Layout Desktop (md+) - Fila compacta */}
      <div className="hidden md:flex items-center gap-4 px-4 py-2">
        {/* Área clickeable para ver detalle */}
        <button
          onClick={onVerDetalle}
          className="flex items-center gap-4 flex-1 min-w-0 text-left"
        >
          {/* Hora */}
          <div className="w-12 text-xs text-gray-500 font-medium">
            {formatearHora(movimiento.hora)}
          </div>

          {/* Icono tipo */}
          <div className={colorIcon}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Categoría */}
          <div className="w-36 flex items-center gap-2">
            <IconoDinamico nombre={movimiento.categoria?.icono} className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900 truncate">
              {movimiento.categoria?.nombre}
            </span>
          </div>

          {/* Descripción */}
          <div className="flex-1 min-w-0">
            {movimiento.descripcion && (
              <span className="text-sm text-gray-600 truncate block">
                {movimiento.descripcion}
              </span>
            )}
          </div>

          {/* Métodos de pago */}
          <div className="w-40">
            <DetalleMetodosPago pagos={movimiento.pagos} compact />
          </div>

          {/* Monto */}
          <div className={`w-28 text-right font-bold ${colorMonto}`}>
            {esEntrada ? '+' : '-'} {formatearMonto(movimiento.monto_total)}
          </div>
        </button>

        {/* Acciones */}
        <div className="flex items-center gap-1 w-16 justify-end">
          {onEditarComentario && (
            <button
              onClick={() => onEditarComentario(movimiento)}
              className={`p-1.5 hover:bg-violet-100 rounded transition-colors ${
                movimiento.descripcion ? 'text-violet-500' : 'text-gray-400'
              } hover:text-violet-600`}
              title={movimiento.descripcion ? 'Editar comentario' : 'Agregar comentario'}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          {onAnular && (
            <button
              onClick={() => onAnular(movimiento.id)}
              className="p-1.5 hover:bg-red-100 rounded transition-colors text-gray-400 hover:text-red-600"
              title="Anular movimiento"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
