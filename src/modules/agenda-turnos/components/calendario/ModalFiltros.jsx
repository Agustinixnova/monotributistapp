/**
 * Modal de filtros de agenda para mobile
 * Contiene:
 * - Filtro por modalidad (Local, Domicilio, Video)
 * - Selector de profesional (modo equipo)
 * - Selector de espacio (modo espacios)
 */

import { X, Filter, Store, Car, Video, Check, Users, DoorOpen } from 'lucide-react'

export default function ModalFiltros({
  isOpen,
  onClose,
  // Filtro modalidad
  filtroModalidad,
  onFiltroModalidadChange,
  tieneLocal,
  tieneDomicilio,
  tieneVideollamada,
  mostrarFiltroModalidad,
  // Selector profesional
  mostrarSelectorProfesional,
  profesionales = [],
  profesionalActivo,
  onProfesionalChange,
  // Selector espacio
  mostrarSelectorEspacio,
  espacios = [],
  espacioActivo,
  onEspacioChange
}) {
  if (!isOpen) return null

  // Contar filtros activos
  const contarFiltrosActivos = () => {
    let count = 0
    if (filtroModalidad !== 'todos') count++
    if (profesionalActivo && profesionalActivo !== 'todos') count++
    if (espacioActivo && espacioActivo !== 'todos') count++
    return count
  }

  const filtrosActivos = contarFiltrosActivos()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            {filtrosActivos > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {filtrosActivos} activo{filtrosActivos !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* Filtro por modalidad */}
          {mostrarFiltroModalidad && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Modalidad de atención</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onFiltroModalidadChange('todos')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${
                    filtroModalidad === 'todos'
                      ? 'border-gray-800 bg-gray-800 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Todos</span>
                </button>

                {tieneLocal && (
                  <button
                    onClick={() => onFiltroModalidadChange('local')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${
                      filtroModalidad === 'local'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span className="font-medium">Local</span>
                  </button>
                )}

                {tieneDomicilio && (
                  <button
                    onClick={() => onFiltroModalidadChange('domicilio')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${
                      filtroModalidad === 'domicilio'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-orange-200'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span className="font-medium">Domicilio</span>
                  </button>
                )}

                {tieneVideollamada && (
                  <button
                    onClick={() => onFiltroModalidadChange('videollamada')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${
                      filtroModalidad === 'videollamada'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-purple-200'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span className="font-medium">Video</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Selector de profesional */}
          {mostrarSelectorProfesional && profesionales.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Profesional</label>
              <div className="space-y-2">
                <button
                  onClick={() => onProfesionalChange('todos')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                    profesionalActivo === 'todos'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    profesionalActivo === 'todos' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <span className={`font-medium ${profesionalActivo === 'todos' ? 'text-blue-700' : 'text-gray-700'}`}>
                    Todos
                  </span>
                  {profesionalActivo === 'todos' && (
                    <Check className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </button>

                {profesionales.map(prof => (
                  <button
                    key={prof.id}
                    onClick={() => onProfesionalChange(prof.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                      profesionalActivo === prof.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                      style={{ backgroundColor: prof.color || '#6366f1' }}
                    >
                      {prof.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className={`font-medium ${profesionalActivo === prof.id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {prof.nombre}
                    </span>
                    {profesionalActivo === prof.id && (
                      <Check className="w-5 h-5 text-blue-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de espacio */}
          {mostrarSelectorEspacio && espacios.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Espacio / Salón</label>
              <div className="space-y-2">
                <button
                  onClick={() => onEspacioChange('todos')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                    espacioActivo === 'todos'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    espacioActivo === 'todos' ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <span className={`font-medium ${espacioActivo === 'todos' ? 'text-violet-700' : 'text-gray-700'}`}>
                    Todos los espacios
                  </span>
                  {espacioActivo === 'todos' && (
                    <Check className="w-5 h-5 text-violet-500 ml-auto" />
                  )}
                </button>

                {espacios.map(espacio => (
                  <button
                    key={espacio.id}
                    onClick={() => onEspacioChange(espacio.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all ${
                      espacioActivo === espacio.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                      style={{ backgroundColor: espacio.color || '#8b5cf6' }}
                    >
                      {espacio.nombre?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className={`font-medium ${espacioActivo === espacio.id ? 'text-violet-700' : 'text-gray-700'}`}>
                      {espacio.nombre}
                    </span>
                    {espacioActivo === espacio.id && (
                      <Check className="w-5 h-5 text-violet-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje si no hay filtros disponibles */}
          {!mostrarFiltroModalidad && !mostrarSelectorProfesional && !mostrarSelectorEspacio && (
            <div className="text-center py-8 text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No hay filtros disponibles</p>
            </div>
          )}
        </div>

        {/* Footer con botón aplicar */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Botón para abrir el modal de filtros
 * Muestra badge con cantidad de filtros activos
 */
export function BotonFiltros({ onClick, filtrosActivos = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        filtrosActivos > 0
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Filter className="w-4 h-4" />
      <span className="hidden sm:inline">Filtros</span>
      {filtrosActivos > 0 && (
        <span className="ml-1 w-5 h-5 flex items-center justify-center bg-blue-600 text-white text-xs rounded-full">
          {filtrosActivos}
        </span>
      )}
    </button>
  )
}
