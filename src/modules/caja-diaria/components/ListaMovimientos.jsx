/**
 * Lista de movimientos del día
 */

import { useState } from 'react'
import { Clock, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react'
import MovimientoItem from './MovimientoItem'
import ModalDetalleMovimiento from './ModalDetalleMovimiento'
import ModalDetalleMovimientosDia from './ModalDetalleMovimientosDia'

const ITEMS_POR_PAGINA = 25

export default function ListaMovimientos({ movimientos, loading, onAnular, onEditarComentario, fecha, puedeVerEstadisticas = true }) {
  const [paginaActual, setPaginaActual] = useState(1)
  const [movimientoDetalle, setMovimientoDetalle] = useState(null)
  const [modalDetalleDia, setModalDetalleDia] = useState(false)
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">
          Últimos movimientos
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!movimientos || movimientos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">
          Últimos movimientos
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Clock className="w-12 h-12 mb-3" />
          <p className="text-sm">No hay movimientos registrados hoy</p>
        </div>
      </div>
    )
  }

  // Calcular paginación
  const totalPaginas = Math.ceil(movimientos.length / ITEMS_POR_PAGINA)
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA
  const indiceFin = indiceInicio + ITEMS_POR_PAGINA
  const movimientosPagina = movimientos.slice(indiceInicio, indiceFin)
  const hayPaginacion = movimientos.length > ITEMS_POR_PAGINA

  const irPaginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1)
  }

  const irPaginaSiguiente = () => {
    if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header con título, botón de detalle y paginación */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-heading font-semibold text-gray-900">
          Movimientos del día
        </h3>

        {/* Botón Ver detalle */}
        {puedeVerEstadisticas && (
          <button
            onClick={() => setModalDetalleDia(true)}
            className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            title="Ver resumen por categorías"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Ver detalle</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          {/* Paginación */}
          {hayPaginacion && (
            <div className="flex items-center gap-1">
              <button
                onClick={irPaginaAnterior}
                disabled={paginaActual === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                onClick={irPaginaSiguiente}
                disabled={paginaActual === totalPaginas}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}

          {/* Total de movimientos */}
          <span className="text-sm text-gray-500">
            {movimientos.length} {movimientos.length === 1 ? 'mov.' : 'movs.'}
          </span>
        </div>
      </div>

      {/* Lista de movimientos */}
      <div className="space-y-2 md:space-y-1">
        {movimientosPagina.map(movimiento => (
          <MovimientoItem
            key={movimiento.id}
            movimiento={movimiento}
            onAnular={onAnular}
            onEditarComentario={onEditarComentario}
            onVerDetalle={() => setMovimientoDetalle(movimiento)}
          />
        ))}
      </div>

      {/* Paginación inferior (solo si hay muchas páginas) */}
      {hayPaginacion && totalPaginas > 2 && (
        <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={irPaginaAnterior}
            disabled={paginaActual === 1}
            className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-gray-600 mx-3">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={irPaginaSiguiente}
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal de detalle de movimiento individual */}
      <ModalDetalleMovimiento
        isOpen={!!movimientoDetalle}
        onClose={() => setMovimientoDetalle(null)}
        movimiento={movimientoDetalle}
      />

      {/* Modal de detalle del día por categorías */}
      <ModalDetalleMovimientosDia
        isOpen={modalDetalleDia}
        onClose={() => setModalDetalleDia(false)}
        movimientos={movimientos}
        fecha={fecha}
      />
    </div>
  )
}
