/**
 * Selector de espacio/salón para filtrar calendario
 * Similar a SelectorProfesional pero para modo "espacios"
 */

import { DoorOpen, ChevronDown, LayoutGrid } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function SelectorEspacio({
  espacios = [],
  espacioActivo,
  onChange,
  mostrarTodos = true
}) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // No mostrar si hay 0 o 1 espacio
  if (espacios.length <= 1) {
    return null
  }

  const seleccionado = espacios.find(e => e.id === espacioActivo)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
      >
        {espacioActivo === 'todos' ? (
          <>
            <LayoutGrid className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Todos</span>
          </>
        ) : seleccionado ? (
          <>
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: seleccionado.color || '#6366F1' }}
            >
              {seleccionado.nombre.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-700 truncate max-w-[120px]">
              {seleccionado.nombre}
            </span>
          </>
        ) : (
          <>
            <DoorOpen className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500">Seleccionar</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg z-20 py-1">
          {mostrarTodos && (
            <button
              onClick={() => {
                onChange('todos')
                setAbierto(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left ${
                espacioActivo === 'todos' ? 'bg-blue-50' : ''
              }`}
            >
              <LayoutGrid className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-700">Todos los espacios</span>
            </button>
          )}

          {espacios.map(espacio => (
            <button
              key={espacio.id}
              onClick={() => {
                onChange(espacio.id)
                setAbierto(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left ${
                espacioActivo === espacio.id ? 'bg-blue-50' : ''
              }`}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: espacio.color || '#6366F1' }}
              >
                {espacio.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {espacio.nombre}
                </p>
                {espacio.capacidad_personas > 1 && (
                  <p className="text-xs text-gray-500">
                    Capacidad: {espacio.capacidad_personas} personas
                  </p>
                )}
              </div>
              {!espacio.activo && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  Inactivo
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
