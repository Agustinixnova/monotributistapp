/**
 * Modal para gestionar la Caja Secundaria
 * Muestra saldo, historial y permite transferir/reintegrar/registrar gastos
 */

import { useState, useEffect } from 'react'
import {
  X, Archive, ArrowDownLeft, ArrowUpRight, Receipt,
  Loader2, Calendar, Clock, User, TrendingUp, TrendingDown,
  RefreshCw, ChevronDown, MessageSquare, Trash2
} from 'lucide-react'
import { formatearMonto } from '../utils/formatters'
import { anularMovimientoSecundaria, actualizarComentarioSecundaria, getMovimientoSecundariaDetalle } from '../services/cajaSecundariaService'
import ModalTransferirSecundaria from './ModalTransferirSecundaria'
import ModalGastoSecundaria from './ModalGastoSecundaria'
import ModalReintegrarSecundaria from './ModalReintegrarSecundaria'
import ModalDetalleMovimientoSecundaria from './ModalDetalleMovimientoSecundaria'
import ModalComentario from './ModalComentario'
import ModalConfirmacion from './ModalConfirmacion'

const MOVIMIENTOS_INICIAL = 10

export default function ModalCajaSecundaria({
  isOpen,
  onClose,
  saldo,
  movimientos,
  loading,
  onTransferir,
  onReintegrar,
  onRegistrarGasto,
  onRecargar,
  categorias = []
}) {
  const [modalTransferir, setModalTransferir] = useState(false)
  const [modalGasto, setModalGasto] = useState(false)
  const [modalReintegrar, setModalReintegrar] = useState(false)
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null)
  const [cantidadMostrar, setCantidadMostrar] = useState(MOVIMIENTOS_INICIAL)
  const [modalComentario, setModalComentario] = useState({ isOpen: false, movimiento: null })
  const [confirmEliminar, setConfirmEliminar] = useState({ isOpen: false, movimiento: null })
  const [procesando, setProcesando] = useState(false)

  // Recargar cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      onRecargar()
      setCantidadMostrar(MOVIMIENTOS_INICIAL)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleEditarComentario = (movimiento, e) => {
    e.stopPropagation()
    setModalComentario({ isOpen: true, movimiento })
  }

  const handleEliminar = (movimiento, e) => {
    e.stopPropagation()
    setConfirmEliminar({ isOpen: true, movimiento })
  }

  const handleGuardarComentario = async (comentario) => {
    if (!modalComentario.movimiento) return
    const { error } = await actualizarComentarioSecundaria(modalComentario.movimiento.id, comentario)
    if (!error) {
      await onRecargar()
      setModalComentario({ isOpen: false, movimiento: null })
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!confirmEliminar.movimiento) return
    setProcesando(true)
    const result = await anularMovimientoSecundaria(confirmEliminar.movimiento.id, 'Eliminado por el usuario')
    setProcesando(false)
    setConfirmEliminar({ isOpen: false, movimiento: null })
    if (result.success) {
      await onRecargar()
    }
  }

  if (!isOpen) return null

  const movimientosVisibles = movimientos.slice(0, cantidadMostrar)
  const hayMas = movimientos.length > cantidadMostrar

  // Formatear fecha
  const formatFecha = (fecha) => {
    const d = new Date(fecha + 'T12:00:00')
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)

    if (d.toDateString() === hoy.toDateString()) return 'Hoy'
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'

    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  // Formatear hora
  const formatHora = (hora) => {
    return hora?.substring(0, 5) || ''
  }

  // Icono según origen
  const getIconoOrigen = (mov) => {
    if (mov.tipo === 'entrada') {
      return <ArrowDownLeft className="w-4 h-4 text-green-600" />
    }
    if (mov.origen === 'reintegro') {
      return <ArrowUpRight className="w-4 h-4 text-blue-600" />
    }
    return <Receipt className="w-4 h-4 text-red-600" />
  }

  // Texto según origen
  const getTextoOrigen = (mov) => {
    if (mov.tipo === 'entrada') {
      if (mov.origen === 'arqueo') return 'Ingreso desde arqueo'
      return 'Ingreso'
    }
    if (mov.origen === 'reintegro') return 'Egreso'
    if (mov.origen === 'gasto') return mov.categoria?.nombre || 'Gasto'
    return mov.origen
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md md:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">Caja Secundaria</h3>
                  <p className="text-white/80 text-sm">Solo efectivo</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Saldo */}
            <div className="px-5 py-4 bg-gradient-to-b from-indigo-50 to-white border-b">
              <p className="text-sm text-gray-500 mb-1">Saldo disponible</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatearMonto(saldo)}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="px-5 py-3 border-b bg-gray-50 flex gap-2">
              <button
                onClick={() => setModalTransferir(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Ingreso
              </button>
              <button
                onClick={() => setModalGasto(true)}
                disabled={saldo <= 0}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <Receipt className="w-4 h-4" />
                Gasto
              </button>
              <button
                onClick={() => setModalReintegrar(true)}
                disabled={saldo <= 0}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
                Egreso
              </button>
            </div>

            {/* Historial */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-3 flex items-center justify-between sticky top-0 bg-white border-b">
                <h4 className="font-medium text-gray-700">Historial</h4>
                <button
                  onClick={onRecargar}
                  disabled={loading}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Archive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay movimientos</p>
                  <p className="text-sm mt-1">Transferí dinero desde caja principal</p>
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {movimientosVisibles.map((mov) => (
                      <div
                        key={mov.id}
                        className="px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icono */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            mov.tipo === 'entrada' ? 'bg-green-100' :
                            mov.origen === 'reintegro' ? 'bg-blue-100' : 'bg-red-100'
                          }`}>
                            {getIconoOrigen(mov)}
                          </div>

                          {/* Contenido clickeable */}
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => setMovimientoSeleccionado(mov)}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">
                                {getTextoOrigen(mov)}
                              </p>
                              <p className={`font-semibold ${
                                mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {mov.tipo === 'entrada' ? '+' : '-'}{formatearMonto(mov.monto)}
                              </p>
                            </div>
                            {mov.descripcion && (
                              <p className="text-sm text-gray-500 truncate">{mov.descripcion}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatFecha(mov.fecha)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatHora(mov.hora)}
                              </span>
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => handleEditarComentario(mov, e)}
                              className={`p-1.5 hover:bg-violet-100 rounded transition-colors ${
                                mov.descripcion ? 'text-violet-500' : 'text-gray-400'
                              } hover:text-violet-600`}
                              title={mov.descripcion ? 'Editar comentario' : 'Agregar comentario'}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleEliminar(mov, e)}
                              className="p-1.5 hover:bg-red-100 rounded transition-colors text-gray-400 hover:text-red-600"
                              title="Eliminar movimiento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botón Ver más */}
                  {hayMas && (
                    <div className="px-5 py-3 border-t bg-gray-50">
                      <button
                        onClick={() => setCantidadMostrar(prev => prev + 10)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Ver más ({movimientos.length - cantidadMostrar} restantes)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales secundarios */}
      <ModalTransferirSecundaria
        isOpen={modalTransferir}
        onClose={() => setModalTransferir(false)}
        onConfirmar={async (monto, descripcion) => {
          await onTransferir(monto, descripcion)
          setModalTransferir(false)
        }}
      />

      <ModalGastoSecundaria
        isOpen={modalGasto}
        onClose={() => setModalGasto(false)}
        onConfirmar={async (monto, categoriaId, descripcion) => {
          await onRegistrarGasto(monto, categoriaId, descripcion)
          setModalGasto(false)
        }}
        saldoDisponible={saldo}
        categorias={categorias}
      />

      <ModalReintegrarSecundaria
        isOpen={modalReintegrar}
        onClose={() => setModalReintegrar(false)}
        onConfirmar={async (monto, descripcion) => {
          await onReintegrar(monto, descripcion)
          setModalReintegrar(false)
        }}
        saldoDisponible={saldo}
      />

      <ModalDetalleMovimientoSecundaria
        isOpen={!!movimientoSeleccionado}
        onClose={() => setMovimientoSeleccionado(null)}
        movimiento={movimientoSeleccionado}
        onRefresh={onRecargar}
      />

      {/* Modal de comentario */}
      <ModalComentario
        isOpen={modalComentario.isOpen}
        onClose={() => setModalComentario({ isOpen: false, movimiento: null })}
        comentarioActual={modalComentario.movimiento?.descripcion || ''}
        onGuardar={handleGuardarComentario}
      />

      {/* Modal de confirmación de eliminación */}
      <ModalConfirmacion
        isOpen={confirmEliminar.isOpen}
        onClose={() => setConfirmEliminar({ isOpen: false, movimiento: null })}
        onConfirm={handleConfirmarEliminar}
        titulo="Eliminar movimiento"
        mensaje={
          confirmEliminar.movimiento?.origen === 'gasto'
            ? 'Al eliminar este gasto, el dinero volverá a estar disponible en caja secundaria.'
            : confirmEliminar.movimiento?.tipo === 'entrada'
            ? 'Al eliminar este ingreso, el dinero volverá a caja principal.'
            : 'Al eliminar este egreso, el dinero volverá a caja secundaria.'
        }
        textoConfirmar="Eliminar"
        procesando={procesando}
      />
    </>
  )
}
