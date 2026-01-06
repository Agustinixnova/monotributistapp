import { useState } from 'react'
import {
  Eye, ExternalLink, Trash2, Check, AlertTriangle,
  CheckCheck, Lock, MoreVertical, MessageSquare
} from 'lucide-react'
import { formatearMoneda, formatearCUIT } from '../utils/formatters'
import { ModalVisualizadorPDF } from './ModalVisualizadorPDF'
import { ModalObservacion } from './ModalObservacion'
import { getSignedUrl } from '../services/storageFacturasService'

export function ListaCargasMes({
  cargas,
  resumen,
  onMarcarOk,
  onMarcarObservado,
  onMarcarTodosOk,
  onCerrarMes,
  onEliminar,
  esContadora = false,
  loading = false
}) {
  const [pdfSeleccionado, setPdfSeleccionado] = useState(null)
  const [cargaObservar, setCargaObservar] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(null)
  const [cargaAEliminar, setCargaAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const pendientes = cargas.filter(c => c.estado_revision === 'pendiente').length
  const observados = cargas.filter(c => c.estado_revision === 'observado').length
  const revisados = cargas.filter(c => c.estado_revision === 'ok').length
  const puedeCerrar = pendientes === 0 && observados === 0 && cargas.length > 0
  const mesCerrado = resumen?.estado === 'cerrado'

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'ok':
        return <Check className="w-4 h-4 text-green-500" />
      case 'observado':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getReceptorLabel = (carga) => {
    if (carga.receptor_tipo === 'consumidor_final') return 'Consumidor Final'
    return carga.receptor_razon_social || '-'
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  const handleObservar = (carga) => {
    setCargaObservar(carga)
    setMenuAbierto(null)
  }

  const confirmarObservacion = async (nota) => {
    await onMarcarObservado(cargaObservar.id, nota)
    setCargaObservar(null)
  }

  const handleAbrirArchivo = async (archivo) => {
    try {
      const path = typeof archivo === 'string' ? archivo : archivo.path
      if (!path) return
      const url = await getSignedUrl(path, 3600)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error abriendo archivo:', err)
      alert('Error al abrir el archivo')
    }
  }

  const confirmarEliminar = async () => {
    if (!cargaAEliminar || eliminando) return
    try {
      setEliminando(true)
      await onEliminar(cargaAEliminar.id)
      setCargaAEliminar(null)
    } catch (err) {
      console.error('Error eliminando:', err)
      alert('Error al eliminar: ' + err.message)
    } finally {
      setEliminando(false)
    }
  }

  if (cargas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay comprobantes cargados
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header con resumen de estados */}
      {esContadora && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
              <span className="text-gray-600">{pendientes} pendientes</span>
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-gray-600">{revisados} OK</span>
            </span>
            {observados > 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-600">{observados} observados</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pendientes > 0 && !mesCerrado && (
              <button
                onClick={onMarcarTodosOk}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Marcar todas OK</span>
              </button>
            )}

            {puedeCerrar && !mesCerrado && (
              <button
                onClick={onCerrarMes}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar mes</span>
              </button>
            )}

            {mesCerrado && (
              <span className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg">
                <Lock className="w-4 h-4" />
                Mes cerrado
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lista de comprobantes */}
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {cargas.map((carga) => (
          <div
            key={carga.id}
            className={`p-3 sm:p-4 flex items-start gap-3 ${
              carga.estado_revision === 'observado' ? 'bg-yellow-50' : 'bg-white'
            }`}
          >
            {/* Estado de revisión (solo contadora) */}
            {esContadora && (
              <button
                onClick={() => {
                  if (!mesCerrado && carga.estado_revision !== 'ok') {
                    onMarcarOk(carga.id)
                  }
                }}
                disabled={mesCerrado || loading}
                className={`mt-1 flex-shrink-0 ${
                  !mesCerrado && carga.estado_revision !== 'ok'
                    ? 'cursor-pointer hover:scale-110 transition-transform'
                    : ''
                }`}
                title={carga.estado_revision === 'ok' ? 'Revisado' : 'Click para marcar OK'}
              >
                {getEstadoIcon(carga.estado_revision)}
              </button>
            )}

            {/* Info del comprobante */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                  carga.tipo_comprobante === 'FC' ? 'bg-green-100 text-green-700' :
                  carga.tipo_comprobante === 'NC' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {carga.tipo_comprobante}-{carga.letra_comprobante}
                </span>
                <span className={`font-medium ${
                  carga.tipo_comprobante === 'NC' ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {carga.tipo_comprobante === 'NC' ? '-' : ''}{formatearMoneda(carga.monto)}
                </span>
                <span className="text-sm text-gray-400">
                  {formatearFecha(carga.fecha_emision)}
                </span>
                {carga.receptor_cuit && (
                  <span className="text-xs text-violet-600 font-mono">
                    CUIT: {formatearCUIT(carga.receptor_cuit)}
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-500 truncate mt-0.5">
                {getReceptorLabel(carga)}
              </div>

              {/* Nota de observación */}
              {carga.estado_revision === 'observado' && carga.nota_observacion && (
                <div className="mt-2 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  {carga.nota_observacion}
                </div>
              )}

              {/* Nota de contadora (interna) */}
              {esContadora && carga.nota_contadora && carga.estado_revision !== 'observado' && (
                <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-700 border-l-2 border-amber-400">
                  <span className="font-medium">Obs interna:</span> {carga.nota_contadora}
                </div>
              )}

              {/* Nota general */}
              {carga.nota && !carga.nota_contadora && carga.estado_revision !== 'observado' && (
                <div className="text-xs text-gray-400 mt-1 truncate">
                  {carga.nota}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Ver PDF */}
              {carga.archivos_adjuntos?.length > 0 && (
                <>
                  <button
                    onClick={() => setPdfSeleccionado(carga.archivos_adjuntos[0])}
                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="Ver comprobante"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAbrirArchivo(carga.archivos_adjuntos[0])}
                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="Abrir en nueva pestana"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Menú de acciones (solo contadora y mes no cerrado) */}
              {esContadora && !mesCerrado && (
                <div className="relative">
                  <button
                    onClick={() => setMenuAbierto(menuAbierto === carga.id ? null : carga.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuAbierto === carga.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuAbierto(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                        {carga.estado_revision !== 'ok' && (
                          <button
                            onClick={() => {
                              onMarcarOk(carga.id)
                              setMenuAbierto(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                            Marcar OK
                          </button>
                        )}
                        <button
                          onClick={() => handleObservar(carga)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          Agregar observacion
                        </button>
                        <button
                          onClick={() => {
                            setCargaAEliminar(carga)
                            setMenuAbierto(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal visualizador PDF */}
      {pdfSeleccionado && (
        <ModalVisualizadorPDF
          archivo={pdfSeleccionado}
          onClose={() => setPdfSeleccionado(null)}
        />
      )}

      {/* Modal para agregar observación */}
      {cargaObservar && (
        <ModalObservacion
          carga={cargaObservar}
          onClose={() => setCargaObservar(null)}
          onConfirmar={confirmarObservacion}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      {cargaAEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Eliminar comprobante
            </h3>
            <p className="text-gray-600 mb-4">
              Estas seguro de eliminar este comprobante de{' '}
              <span className="font-medium">{formatearMoneda(cargaAEliminar.monto)}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCargaAEliminar(null)}
                disabled={eliminando}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
