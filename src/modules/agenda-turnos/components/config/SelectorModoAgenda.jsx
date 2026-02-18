/**
 * Selector de modo de operación de la agenda
 * - personal: Solo yo (sin selectores)
 * - equipo: Múltiples profesionales
 * - espacios: Múltiples espacios/salones
 */

import { useState } from 'react'
import { User, Users, DoorOpen, Check, AlertCircle, AlertTriangle, X } from 'lucide-react'

// Definición de los modos disponibles
export const MODOS_AGENDA = [
  {
    id: 'personal',
    label: 'Personal (Solo yo)',
    descripcion: 'Trabajo solo/a, sin equipo ni múltiples espacios',
    icon: User,
    color: 'blue'
  },
  {
    id: 'equipo',
    label: 'Equipo de trabajo',
    descripcion: 'Tengo empleados o socios que también atienden',
    icon: Users,
    color: 'emerald'
  },
  {
    id: 'espacios',
    label: 'Espacios / Salones',
    descripcion: 'Alquilo o gestiono múltiples espacios (box, salones, consultorios)',
    icon: DoorOpen,
    color: 'violet'
  }
]

export default function SelectorModoAgenda({
  modoActual = 'personal',
  onChange,
  disabled = false,
  turnosConEspacio = 0,
  nombresSalones = []
}) {
  const [modalConfirmacion, setModalConfirmacion] = useState({ visible: false, nuevoModo: null })
  const getColorClasses = (modo, activo) => {
    const colors = {
      blue: activo
        ? 'border-blue-500 bg-blue-50 text-blue-700'
        : 'border-gray-200 hover:border-blue-300',
      emerald: activo
        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
        : 'border-gray-200 hover:border-emerald-300',
      violet: activo
        ? 'border-violet-500 bg-violet-50 text-violet-700'
        : 'border-gray-200 hover:border-violet-300'
    }
    return colors[modo.color] || colors.blue
  }

  const getIconBgClass = (modo, activo) => {
    const colors = {
      blue: activo ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500',
      emerald: activo ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500',
      violet: activo ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'
    }
    return colors[modo.color] || colors.blue
  }

  // Handler para cambio de modo con posible confirmación
  const handleModoClick = (nuevoModo) => {
    if (disabled || nuevoModo === modoActual) return

    // Si está saliendo del modo espacios y tiene turnos asignados, mostrar aviso
    if (modoActual === 'espacios' && nuevoModo !== 'espacios' && turnosConEspacio > 0) {
      setModalConfirmacion({ visible: true, nuevoModo })
      return
    }

    onChange(nuevoModo)
  }

  const confirmarCambio = () => {
    if (modalConfirmacion.nuevoModo) {
      onChange(modalConfirmacion.nuevoModo)
    }
    setModalConfirmacion({ visible: false, nuevoModo: null })
  }

  return (
    <div className="space-y-3">
      {MODOS_AGENDA.map(modo => {
        const Icon = modo.icon
        const activo = modoActual === modo.id

        return (
          <button
            key={modo.id}
            onClick={() => handleModoClick(modo.id)}
            disabled={disabled}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              getColorClasses(modo, activo)
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconBgClass(modo, activo)}`}>
              <Icon className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <p className={`font-semibold ${activo ? '' : 'text-gray-800'}`}>
                {modo.label}
              </p>
              <p className={`text-sm ${activo ? 'opacity-80' : 'text-gray-500'}`}>
                {modo.descripcion}
              </p>
            </div>

            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              activo
                ? `border-${modo.color}-500 bg-${modo.color}-500`
                : 'border-gray-300'
            }`}>
              {activo && <Check className="w-4 h-4 text-white" />}
            </div>
          </button>
        )
      })}

      {/* Nota informativa */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-amber-800">
          <p className="font-medium">Importante</p>
          <p className="text-amber-700 mt-0.5">
            Elegí el modo que mejor se adapte a tu negocio. Podés cambiarlo después,
            pero los turnos ya creados mantendrán su asignación original.
          </p>
        </div>
      </div>

      {/* Modal de confirmación al cambiar de modo espacios */}
      {modalConfirmacion.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b bg-amber-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cambiar modo de agenda</h3>
                <p className="text-sm text-gray-600">Tenés turnos asignados a salones</p>
              </div>
              <button
                onClick={() => setModalConfirmacion({ visible: false, nuevoModo: null })}
                className="ml-auto p-1 hover:bg-amber-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  Tenés <span className="font-bold text-amber-600">{turnosConEspacio} turno{turnosConEspacio !== 1 ? 's' : ''}</span> asignado{turnosConEspacio !== 1 ? 's' : ''} a salones
                  {nombresSalones.length > 0 && (
                    <span> ({nombresSalones.join(', ')})</span>
                  )}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">¿Qué pasa si cambio?</span>
                </p>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Los turnos NO se borran
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    Se verán todos juntos sin distinción de salón
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">↺</span>
                    Si volvés a modo espacios (sin borrar los salones), recuperan su asignación
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setModalConfirmacion({ visible: false, nuevoModo: null })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCambio}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                Sí, cambiar modo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Obtener información de un modo por ID
 */
export function getModoInfo(modoId) {
  return MODOS_AGENDA.find(m => m.id === modoId) || MODOS_AGENDA[0]
}
