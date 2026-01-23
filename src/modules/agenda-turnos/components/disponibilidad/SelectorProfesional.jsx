/**
 * Selector de profesional para filtrar calendario
 */

import { User, ChevronDown, Users } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function SelectorProfesional({
  profesionales = [],
  profesionalActivo,
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

  if (profesionales.length <= 1) {
    return null
  }

  const seleccionado = profesionales.find(p => p.id === profesionalActivo)

  const getIniciales = (p) => {
    const nombre = p.nombre || ''
    const apellido = p.apellido || ''
    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase() || '?'
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
      >
        {profesionalActivo === 'todos' ? (
          <>
            <Users className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Todos</span>
          </>
        ) : seleccionado ? (
          <>
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">
              {getIniciales(seleccionado)}
            </div>
            <span className="font-medium text-gray-700">
              {seleccionado.nombre} {seleccionado.apellido?.charAt(0)}.
            </span>
          </>
        ) : (
          <>
            <User className="w-4 h-4 text-gray-500" />
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
                profesionalActivo === 'todos' ? 'bg-blue-50' : ''
              }`}
            >
              <Users className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-700">Todos los profesionales</span>
            </button>
          )}

          {profesionales.map(p => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p.id)
                setAbierto(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left ${
                profesionalActivo === p.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                p.esDuenio ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {getIniciales(p)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {p.nombre} {p.apellido || ''}
                </p>
                <p className="text-xs text-gray-500">
                  {p.esDuenio ? 'Propietario' : 'Empleado'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
