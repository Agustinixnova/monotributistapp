/**
 * Modal para confirmar cómo aplicar cambios en turnos recurrentes
 * Opciones: solo este turno o este y todos los futuros
 */

import { useState } from 'react'
import { X, Repeat, Calendar, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { formatFechaLarga } from '../../utils/dateUtils'

export default function ModalEditarRecurrente({
  isOpen,
  onClose,
  onConfirmar,
  turno,
  cantidadFuturos = 0,
  loading = false,
  cambiosFecha = false // Si hubo cambios en la fecha/día
}) {
  const [opcion, setOpcion] = useState('solo_este')

  if (!isOpen) return null

  const handleConfirmar = () => {
    onConfirmar({
      propagarAFuturos: opcion === 'todos_futuros',
      cambioFecha: cambiosFecha
    })
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-purple-50 px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Repeat className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-lg text-gray-900">
                Editar turno recurrente
              </h3>
              <p className="text-sm text-purple-700">
                Este turno es parte de una serie
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-5 space-y-4">
            <p className="text-gray-600">
              ¿Cómo querés aplicar los cambios?
            </p>

            {/* Opción 1: Solo este turno */}
            <button
              type="button"
              onClick={() => setOpcion('solo_este')}
              disabled={loading}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                opcion === 'solo_este'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  opcion === 'solo_este'
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300'
                }`}>
                  {opcion === 'solo_este' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${opcion === 'solo_este' ? 'text-purple-900' : 'text-gray-800'}`}>
                    Solo este turno
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Los demás turnos de la serie no se modifican
                  </p>
                  {turno && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatFechaLarga(turno.fecha)}
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Opción 2: Este y todos los futuros */}
            <button
              type="button"
              onClick={() => setOpcion('todos_futuros')}
              disabled={loading || cantidadFuturos === 0}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                opcion === 'todos_futuros'
                  ? 'border-purple-500 bg-purple-50'
                  : cantidadFuturos === 0
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  opcion === 'todos_futuros'
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300'
                }`}>
                  {opcion === 'todos_futuros' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${opcion === 'todos_futuros' ? 'text-purple-900' : 'text-gray-800'}`}>
                    Este y todos los siguientes
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Se actualizarán los turnos futuros de la serie
                  </p>
                  {cantidadFuturos > 0 ? (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                      <ChevronRight className="w-3.5 h-3.5" />
                      {cantidadFuturos} {cantidadFuturos === 1 ? 'turno' : 'turnos'} serán actualizados
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-400">
                      No hay turnos futuros en esta serie
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Aviso si hay cambio de fecha */}
            {cambiosFecha && opcion === 'todos_futuros' && cantidadFuturos > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">
                    Cambio de día detectado
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Las fechas de los turnos futuros se recalcularán manteniendo el nuevo patrón semanal.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Aplicar cambios'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
