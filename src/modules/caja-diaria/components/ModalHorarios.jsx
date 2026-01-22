/**
 * Modal para configurar horarios de acceso de un empleado
 */

import { useState, useEffect } from 'react'
import { X, Clock, Plus, Trash2, AlertCircle } from 'lucide-react'

const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
]

export default function ModalHorarios({ isOpen, onClose, empleado, onGuardar }) {
  const [horarios, setHorarios] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [sinRestricciones, setSinRestricciones] = useState(true)

  useEffect(() => {
    if (isOpen && empleado) {
      const horariosEmpleado = empleado.horarios_acceso || {}
      setHorarios(horariosEmpleado)
      // Si no hay horarios configurados, está sin restricciones
      setSinRestricciones(Object.keys(horariosEmpleado).length === 0)
    }
  }, [isOpen, empleado])

  // Toggle día habilitado/deshabilitado
  const toggleDia = (dia) => {
    setHorarios(prev => {
      const nuevo = { ...prev }
      if (nuevo[dia]) {
        delete nuevo[dia]
      } else {
        nuevo[dia] = [{ desde: '08:00', hasta: '18:00' }]
      }
      return nuevo
    })
  }

  // Agregar rango a un día
  const agregarRango = (dia) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: [...(prev[dia] || []), { desde: '08:00', hasta: '18:00' }]
    }))
  }

  // Eliminar rango de un día
  const eliminarRango = (dia, index) => {
    setHorarios(prev => {
      const rangos = [...(prev[dia] || [])]
      rangos.splice(index, 1)
      if (rangos.length === 0) {
        const nuevo = { ...prev }
        delete nuevo[dia]
        return nuevo
      }
      return { ...prev, [dia]: rangos }
    })
  }

  // Actualizar hora de un rango
  const actualizarRango = (dia, index, campo, valor) => {
    setHorarios(prev => {
      const rangos = [...(prev[dia] || [])]
      rangos[index] = { ...rangos[index], [campo]: valor }
      return { ...prev, [dia]: rangos }
    })
  }

  // Toggle sin restricciones
  const toggleSinRestricciones = () => {
    if (!sinRestricciones) {
      // Activar sin restricciones = limpiar horarios
      setHorarios({})
      setSinRestricciones(true)
    } else {
      // Desactivar sin restricciones = mostrar configuración de días
      setSinRestricciones(false)
    }
  }

  // Validar que los rangos sean correctos (desde < hasta)
  const validarHorarios = () => {
    for (const dia of Object.keys(horarios)) {
      for (const rango of horarios[dia]) {
        if (rango.desde >= rango.hasta) {
          return false
        }
      }
    }
    return true
  }

  const handleGuardar = async () => {
    if (!sinRestricciones && !validarHorarios()) {
      alert('Hay horarios inválidos. La hora "desde" debe ser menor que "hasta".')
      return
    }

    setGuardando(true)
    try {
      // Si sin restricciones, guardar null; si no, guardar los horarios
      const horariosGuardar = sinRestricciones ? null : horarios
      await onGuardar(empleado.id, horariosGuardar)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen || !empleado) return null

  const tieneAlgunDia = Object.keys(horarios).length > 0

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-amber-500 px-5 py-4 text-white flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <h3 className="font-heading font-semibold text-lg">Horarios de Acceso</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Info empleado */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-500">Configurar horarios para:</p>
              <p className="font-medium text-gray-900">
                {empleado.nombre} {empleado.apellido}
              </p>
            </div>

            {/* Toggle sin restricciones */}
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg mb-4 cursor-pointer hover:border-amber-300 transition-colors">
              <input
                type="checkbox"
                checked={sinRestricciones}
                onChange={toggleSinRestricciones}
                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <p className="font-medium text-gray-900">Sin restricciones de horario</p>
                <p className="text-xs text-gray-500">El empleado puede acceder en cualquier momento</p>
              </div>
            </label>

            {/* Configuración de días y horarios */}
            {!sinRestricciones && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-2">
                  Seleccioná los días y horarios en los que el empleado puede acceder:
                </p>

                {DIAS_SEMANA.map(({ key, label }) => {
                  const diaActivo = !!horarios[key]
                  const rangos = horarios[key] || []

                  return (
                    <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Día header */}
                      <label className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        diaActivo ? 'bg-amber-50' : 'hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={diaActivo}
                          onChange={() => toggleDia(key)}
                          className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className={`font-medium ${diaActivo ? 'text-amber-700' : 'text-gray-700'}`}>
                          {label}
                        </span>
                      </label>

                      {/* Rangos de horario */}
                      {diaActivo && (
                        <div className="px-3 pb-3 pt-1 bg-amber-50/50 border-t border-amber-100">
                          {rangos.map((rango, index) => (
                            <div key={index} className="flex items-center gap-2 mt-2">
                              <input
                                type="time"
                                value={rango.desde}
                                onChange={(e) => actualizarRango(key, index, 'desde', e.target.value)}
                                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              />
                              <span className="text-gray-500 text-sm">a</span>
                              <input
                                type="time"
                                value={rango.hasta}
                                onChange={(e) => actualizarRango(key, index, 'hasta', e.target.value)}
                                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              />
                              <button
                                onClick={() => eliminarRango(key, index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar rango"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {/* Botón agregar rango */}
                          <button
                            onClick={() => agregarRango(key)}
                            className="mt-2 flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar otro horario
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Advertencia si no hay días seleccionados */}
                {!tieneAlgunDia && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-700 font-medium">Sin días seleccionados</p>
                      <p className="text-xs text-red-600">
                        El empleado no podrá acceder ningún día. Seleccioná al menos un día o activá "Sin restricciones".
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex gap-3 p-5 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={guardando}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando || (!sinRestricciones && !tieneAlgunDia)}
              className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:bg-amber-300"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
