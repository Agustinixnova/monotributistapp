/**
 * Componente para configurar espacios/salones
 * Solo visible en modo "espacios"
 */

import { useState } from 'react'
import {
  DoorOpen, Plus, Edit3, Trash2, Loader2, Check, X,
  GripVertical, Users, Package, AlertTriangle, Calendar
} from 'lucide-react'
import { useEspacios } from '../../hooks/useEspacios'
import { COLORES_ESPACIOS } from '../../services/espaciosService'
import { supabase } from '../../../../lib/supabase'

export default function ConfigEspacios() {
  const {
    espacios,
    loading,
    crear,
    actualizar,
    eliminar
  } = useEspacios()

  const [modoEdicion, setModoEdicion] = useState(null) // null | 'nuevo' | espacio.id
  const [guardando, setGuardando] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null)
  const [modalEliminar, setModalEliminar] = useState({ visible: false, espacio: null, turnosCount: 0 })

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    color: COLORES_ESPACIOS[0].id,
    capacidad_personas: 1,
    activo: true
  })

  const handleNuevo = () => {
    setForm({
      nombre: '',
      descripcion: '',
      color: COLORES_ESPACIOS[espacios.length % COLORES_ESPACIOS.length].id,
      capacidad_personas: 1,
      activo: true
    })
    setModoEdicion('nuevo')
  }

  const handleEditar = (espacio) => {
    setForm({
      nombre: espacio.nombre || '',
      descripcion: espacio.descripcion || '',
      color: espacio.color || COLORES_ESPACIOS[0].id,
      capacidad_personas: espacio.capacidad_personas || 1,
      activo: espacio.activo ?? true
    })
    setModoEdicion(espacio.id)
  }

  const handleCancelar = () => {
    setModoEdicion(null)
    setForm({
      nombre: '',
      descripcion: '',
      color: COLORES_ESPACIOS[0].id,
      capacidad_personas: 1,
      activo: true
    })
  }

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return

    setGuardando(true)

    if (modoEdicion === 'nuevo') {
      await crear(form)
    } else {
      await actualizar(modoEdicion, form)
    }

    setGuardando(false)
    handleCancelar()
  }

  // Verificar si un espacio tiene turnos antes de eliminar
  const verificarYEliminar = async (espacio) => {
    // Contar turnos asociados a este espacio
    const { count } = await supabase
      .from('agenda_turnos')
      .select('id', { count: 'exact', head: true })
      .eq('espacio_id', espacio.id)

    if (count > 0) {
      // Tiene turnos, mostrar modal de confirmación
      setModalEliminar({ visible: true, espacio, turnosCount: count })
    } else {
      // No tiene turnos, eliminar directamente
      setGuardando(true)
      await eliminar(espacio.id)
      setGuardando(false)
    }
    setConfirmandoEliminar(null)
  }

  const handleEliminarConfirmado = async () => {
    if (!modalEliminar.espacio) return
    setGuardando(true)
    await eliminar(modalEliminar.espacio.id)
    setGuardando(false)
    setModalEliminar({ visible: false, espacio: null, turnosCount: 0 })
  }

  const handleToggleActivo = async (espacio) => {
    await actualizar(espacio.id, { activo: !espacio.activo })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
        <p className="mt-2 text-gray-500">Cargando espacios...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-violet-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
              <DoorOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900">Espacios / Salones</h3>
              <p className="text-sm text-gray-500">
                {espacios.length === 0
                  ? 'Agregá tus espacios para alquilar'
                  : `${espacios.filter(e => e.activo).length} activos de ${espacios.length} total`
                }
              </p>
            </div>
          </div>

          {modoEdicion === null && (
            <button
              onClick={handleNuevo}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo espacio
            </button>
          )}
        </div>
      </div>

      {/* Formulario de edición/creación */}
      {modoEdicion !== null && (
        <div className="p-5 border-b bg-gray-50">
          <h4 className="font-medium text-gray-700 mb-4">
            {modoEdicion === 'nuevo' ? 'Nuevo espacio' : 'Editar espacio'}
          </h4>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nombre del espacio *
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Salón 1, Box A, Consultorio 2"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Características del espacio..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Color y capacidad */}
            <div className="grid grid-cols-2 gap-4">
              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORES_ESPACIOS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setForm(f => ({ ...f, color: color.id }))}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        form.color === color.id
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.id }}
                      title={color.nombre}
                    />
                  ))}
                </div>
              </div>

              {/* Capacidad */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Capacidad (personas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.capacidad_personas}
                  onChange={(e) => setForm(f => ({ ...f, capacidad_personas: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Estado activo (solo en edición) */}
            {modoEdicion !== 'nuevo' && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm(f => ({ ...f, activo: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Espacio activo (disponible para reservas)</span>
              </label>
            )}

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleCancelar}
                disabled={guardando}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de espacios */}
      <div className="divide-y">
        {espacios.length === 0 ? (
          <div className="p-8 text-center">
            <DoorOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tenés espacios configurados</p>
            <p className="text-sm text-gray-400 mt-1">
              Agregá tu primer espacio para empezar
            </p>
          </div>
        ) : (
          espacios.map((espacio) => (
            <div
              key={espacio.id}
              className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                !espacio.activo ? 'opacity-60' : ''
              }`}
            >
              {/* Color indicator */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                style={{ backgroundColor: espacio.color || '#6366F1' }}
              >
                {espacio.nombre.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">
                    {espacio.nombre}
                  </p>
                  {!espacio.activo && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                  {espacio.capacidad_personas > 1 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {espacio.capacidad_personas} personas
                    </span>
                  )}
                  {espacio.descripcion && (
                    <span className="truncate">{espacio.descripcion}</span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              {modoEdicion === null && (
                <div className="flex items-center gap-1">
                  {confirmandoEliminar === espacio.id ? (
                    <>
                      <span className="text-sm text-red-600 mr-2">¿Eliminar?</span>
                      <button
                        onClick={() => verificarYEliminar(espacio)}
                        disabled={guardando}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Confirmar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmandoEliminar(null)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggleActivo(espacio)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          espacio.activo
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {espacio.activo ? 'Activo' : 'Inactivo'}
                      </button>
                      <button
                        onClick={() => handleEditar(espacio)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmandoEliminar(espacio.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmación para eliminar espacio con turnos */}
      {modalEliminar.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b bg-red-50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Eliminar "{modalEliminar.espacio?.nombre}"</h3>
                <p className="text-sm text-gray-600">Este espacio tiene turnos asignados</p>
              </div>
              <button
                onClick={() => setModalEliminar({ visible: false, espacio: null, turnosCount: 0 })}
                className="ml-auto p-1 hover:bg-red-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {modalEliminar.turnosCount} turno{modalEliminar.turnosCount !== 1 ? 's' : ''} asignado{modalEliminar.turnosCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Si eliminás este espacio, los turnos quedarán como "Sin asignar" y podrás reasignarlos a otro espacio después.
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                ¿Estás seguro de que querés eliminar este espacio?
              </p>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setModalEliminar({ visible: false, espacio: null, turnosCount: 0 })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarConfirmado}
                disabled={guardando}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {guardando ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </span>
                ) : (
                  'Sí, eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
