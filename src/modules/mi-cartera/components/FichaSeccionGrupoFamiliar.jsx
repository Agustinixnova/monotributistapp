import { useState } from 'react'
import { Users, Plus, Trash2, Edit2, Check, X, Calendar } from 'lucide-react'
import { FichaSeccion } from './FichaSeccion'

const PARENTESCOS = [
  { value: 'conyuge', label: 'Conyuge' },
  { value: 'concubino', label: 'Concubino/a' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'otro', label: 'Otro' }
]

/**
 * Seccion de grupo familiar para obra social con CRUD
 */
export function FichaSeccionGrupoFamiliar({
  integrantes = [],
  onAgregar,
  onActualizar,
  onEliminar,
  saving = false,
  editable = true
}) {
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    fecha_nacimiento: '',
    parentesco: '',
    parentesco_otro: '',
    cuil: ''
  })

  const resetForm = () => {
    setFormData({
      nombre: '',
      dni: '',
      fecha_nacimiento: '',
      parentesco: '',
      parentesco_otro: '',
      cuil: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (integrante) => {
    setFormData({
      nombre: integrante.nombre || '',
      dni: integrante.dni || '',
      fecha_nacimiento: integrante.fecha_nacimiento || '',
      parentesco: integrante.parentesco || '',
      parentesco_otro: integrante.parentesco_otro || '',
      cuil: integrante.cuil || ''
    })
    setEditingId(integrante.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      return
    }

    if (editingId) {
      await onActualizar?.(editingId, formData)
    } else {
      await onAgregar?.(formData)
    }
    resetForm()
  }

  const handleDelete = async (integranteId, nombre) => {
    if (confirm('¿Eliminar a ' + nombre + ' del grupo familiar?')) {
      await onEliminar?.(integranteId, nombre)
    }
  }

  const getParentescoLabel = (parentesco, parentescoOtro) => {
    if (parentesco === 'otro' && parentescoOtro) {
      return parentescoOtro
    }
    const found = PARENTESCOS.find(p => p.value === parentesco)
    return found?.label || parentesco || '-'
  }

  const formatFechaNacimiento = (fecha) => {
    if (!fecha) return '-'
    try {
      return new Date(fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return fecha
    }
  }

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null
    try {
      const nacimiento = new Date(fechaNacimiento)
      const hoy = new Date()
      let edad = hoy.getFullYear() - nacimiento.getFullYear()
      const m = hoy.getMonth() - nacimiento.getMonth()
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--
      }
      return edad
    } catch {
      return null
    }
  }

  return (
    <FichaSeccion
      titulo="Grupo Familiar (Obra Social)"
      icono={Users}
      iconColor="text-pink-600"
      defaultOpen={integrantes.length > 0}
    >
      <div className="pt-4 space-y-4">
        {/* Lista de integrantes */}
        {integrantes.length > 0 ? (
          <div className="space-y-3">
            {integrantes.map((integrante) => {
              const edad = calcularEdad(integrante.fecha_nacimiento)

              return (
                <div
                  key={integrante.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {integrante.nombre}
                        </span>
                        <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded">
                          {getParentescoLabel(integrante.parentesco, integrante.parentesco_otro)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                        {integrante.dni && (
                          <span>
                            DNI: <strong>{integrante.dni}</strong>
                          </span>
                        )}
                        {integrante.cuil && (
                          <span>
                            CUIL: <strong>{integrante.cuil}</strong>
                          </span>
                        )}
                        {integrante.fecha_nacimiento && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatFechaNacimiento(integrante.fecha_nacimiento)}
                            {edad !== null && (
                              <span className="text-gray-500">({edad} años)</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {editable && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(integrante)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(integrante.id, integrante.nombre)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Resumen */}
            {integrantes.length > 0 && (
              <div className="flex items-center justify-end pt-2 border-t border-gray-200 text-sm text-gray-600">
                <span>
                  Total integrantes: <strong className="text-gray-900">{integrantes.length}</strong>
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
            No hay integrantes registrados
          </p>
        )}

        {/* Formulario para agregar/editar */}
        {showForm && (
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
            <h4 className="font-medium text-pink-900 mb-3">
              {editingId ? 'Editar integrante' : 'Agregar integrante'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre y apellido"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  DNI
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                  placeholder="12345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  CUIL
                </label>
                <input
                  type="text"
                  value={formData.cuil}
                  onChange={(e) => setFormData(prev => ({ ...prev, cuil: e.target.value }))}
                  placeholder="20-12345678-9"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Parentesco
                </label>
                <select
                  value={formData.parentesco}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentesco: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {PARENTESCOS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {formData.parentesco === 'otro' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Especificar parentesco
                  </label>
                  <input
                    type="text"
                    value={formData.parentesco_otro}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentesco_otro: e.target.value }))}
                    placeholder="Ej: Padre, Madre, Hermano..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={resetForm}
                disabled={saving}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.nombre.trim()}
                className="px-3 py-1.5 bg-pink-600 text-white hover:bg-pink-700 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingId ? 'Guardar' : 'Agregar'}
              </button>
            </div>
          </div>
        )}

        {/* Boton agregar */}
        {editable && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-pink-400 hover:text-pink-600 rounded-lg flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar integrante
          </button>
        )}
      </div>
    </FichaSeccion>
  )
}
