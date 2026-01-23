/**
 * Configuración de disponibilidad horaria por profesional
 */

import { useState } from 'react'
import { Clock, Save, Loader2, Check, X, Calendar, Plus, Trash2 } from 'lucide-react'
import { useDisponibilidad, useExcepciones, DIAS_SEMANA } from '../../hooks/useDisponibilidad'
import { generarSlotsTiempo, formatFechaCorta } from '../../utils/dateUtils'

export default function ConfigDisponibilidad({ profesionalId = null, profesionalNombre = 'Mi disponibilidad' }) {
  const {
    disponibilidad,
    loading,
    guardar,
    actualizarDia
  } = useDisponibilidad(profesionalId)

  const {
    excepciones,
    loading: loadingExcepciones,
    agregar: agregarExcepcion,
    eliminar: eliminarExcepcion
  } = useExcepciones(profesionalId)

  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [nuevaExcepcion, setNuevaExcepcion] = useState({ fecha: '', motivo: '' })

  const horasDisponibles = generarSlotsTiempo('06:00', '23:00', 30)

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await guardar(disponibilidad)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    } catch (err) {
      console.error('Error guardando disponibilidad:', err)
    }
    setGuardando(false)
  }

  const handleAgregarExcepcion = async () => {
    if (!nuevaExcepcion.fecha) return

    try {
      await agregarExcepcion({
        fecha: nuevaExcepcion.fecha,
        motivo: nuevaExcepcion.motivo || 'Día libre',
        todo_el_dia: true,
        tipo: 'bloqueo'
      })
      setNuevaExcepcion({ fecha: '', motivo: '' })
    } catch (err) {
      console.error('Error agregando excepción:', err)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-gray-500 mt-2">Cargando disponibilidad...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Horario semanal */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-gray-900">Horario Semanal</h3>
          </div>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              guardado
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : guardado ? (
              <>
                <Check className="w-4 h-4" />
                Guardado
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar
              </>
            )}
          </button>
        </div>

        <div className="p-4 space-y-3">
          {DIAS_SEMANA.map(dia => {
            const config = disponibilidad.find(d => d.dia_semana === dia.id) || {
              activo: false,
              hora_inicio: '09:00',
              hora_fin: '18:00'
            }

            return (
              <div
                key={dia.id}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                  config.activo ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Toggle día */}
                <label className="flex items-center gap-3 cursor-pointer min-w-[120px]">
                  <input
                    type="checkbox"
                    checked={config.activo}
                    onChange={(e) => actualizarDia(dia.id, { activo: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`font-medium ${config.activo ? 'text-gray-900' : 'text-gray-400'}`}>
                    {dia.nombre}
                  </span>
                </label>

                {/* Horarios */}
                {config.activo && (
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={config.hora_inicio}
                      onChange={(e) => actualizarDia(dia.id, { hora_inicio: e.target.value })}
                      className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {horasDisponibles.map(hora => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))}
                    </select>
                    <span className="text-gray-400">a</span>
                    <select
                      value={config.hora_fin}
                      onChange={(e) => actualizarDia(dia.id, { hora_fin: e.target.value })}
                      className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {horasDisponibles.map(hora => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!config.activo && (
                  <span className="text-gray-400 text-sm">No trabaja</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Excepciones */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Días Bloqueados</h3>
          <span className="text-sm text-gray-500">(Feriados, vacaciones, etc.)</span>
        </div>

        <div className="p-4 space-y-3">
          {/* Agregar nueva excepción */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={nuevaExcepcion.fecha}
              onChange={(e) => setNuevaExcepcion(prev => ({ ...prev, fecha: e.target.value }))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={nuevaExcepcion.motivo}
              onChange={(e) => setNuevaExcepcion(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Motivo (opcional)"
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAgregarExcepcion}
              disabled={!nuevaExcepcion.fecha}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Bloquear
            </button>
          </div>

          {/* Lista de excepciones */}
          {loadingExcepciones ? (
            <div className="text-center py-4">
              <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
            </div>
          ) : excepciones.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              No hay días bloqueados
            </p>
          ) : (
            <div className="space-y-2">
              {excepciones.map(exc => (
                <div
                  key={exc.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-gray-900">{formatFechaCorta(exc.fecha)}</span>
                    {exc.motivo && (
                      <span className="text-gray-500 ml-2">- {exc.motivo}</span>
                    )}
                  </div>
                  <button
                    onClick={() => eliminarExcepcion(exc.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
