import { useState } from 'react'
import { Building2, Plus, Trash2, Edit2, Check, X, MapPin } from 'lucide-react'
import { FichaSeccion } from './FichaSeccion'

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba',
  'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucuman'
]

/**
 * Seccion de locales comerciales con CRUD
 */
export function FichaSeccionLocales({
  locales = [],
  onAgregar,
  onActualizar,
  onEliminar,
  saving = false,
  editable = true
}) {
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    descripcion: '',
    direccion: '',
    localidad: '',
    provincia: '',
    alquiler_mensual: '',
    superficie_m2: '',
    es_propio: false
  })

  const resetForm = () => {
    setFormData({
      descripcion: '',
      direccion: '',
      localidad: '',
      provincia: '',
      alquiler_mensual: '',
      superficie_m2: '',
      es_propio: false
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (local) => {
    setFormData({
      descripcion: local.descripcion || '',
      direccion: local.direccion || '',
      localidad: local.localidad || '',
      provincia: local.provincia || '',
      alquiler_mensual: local.alquiler_mensual || '',
      superficie_m2: local.superficie_m2 || '',
      es_propio: local.es_propio || false
    })
    setEditingId(local.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (editingId) {
      await onActualizar?.(editingId, formData)
    } else {
      await onAgregar?.(formData)
    }
    resetForm()
  }

  const handleDelete = async (localId, descripcion) => {
    if (confirm('¿Eliminar este local?')) {
      await onEliminar?.(localId, descripcion)
    }
  }

  const formatMonto = (monto) => {
    if (!monto) return '-'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(monto)
  }

  // Calcular totales
  const totalAlquiler = locales.reduce((sum, l) => sum + (parseFloat(l.alquiler_mensual) || 0), 0)
  const totalSuperficie = locales.reduce((sum, l) => sum + (parseInt(l.superficie_m2) || 0), 0)

  return (
    <FichaSeccion
      titulo="Locales Comerciales"
      icono={Building2}
      iconColor="text-orange-600"
      defaultOpen={locales.length > 0}
    >
      <div className="pt-4 space-y-4">
        {/* Lista de locales */}
        {locales.length > 0 ? (
          <div className="space-y-3">
            {locales.map((local, index) => (
              <div
                key={local.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {local.descripcion || `Local ${index + 1}`}
                      </span>
                      {local.es_propio ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          Propio
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Alquilado
                        </span>
                      )}
                    </div>

                    {local.direccion && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>
                          {local.direccion}
                          {local.localidad && `, ${local.localidad}`}
                          {local.provincia && ` (${local.provincia})`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {local.alquiler_mensual > 0 && (
                        <span className="text-gray-600">
                          Alquiler: <strong>{formatMonto(local.alquiler_mensual)}</strong>
                        </span>
                      )}
                      {local.superficie_m2 > 0 && (
                        <span className="text-gray-600">
                          Superficie: <strong>{local.superficie_m2} m²</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {editable && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(local)}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(local.id, local.descripcion)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Totales */}
            {locales.length > 1 && (
              <div className="flex items-center justify-end gap-6 pt-2 border-t border-gray-200 text-sm">
                <span className="text-gray-600">
                  Total alquiler: <strong className="text-gray-900">{formatMonto(totalAlquiler)}</strong>
                </span>
                <span className="text-gray-600">
                  Total superficie: <strong className="text-gray-900">{totalSuperficie} m²</strong>
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
            No hay locales registrados
          </p>
        )}

        {/* Formulario para agregar/editar */}
        {showForm && (
          <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
            <h4 className="font-medium text-violet-900 mb-3">
              {editingId ? 'Editar local' : 'Agregar local'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Descripcion
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Ej: Local Centro, Deposito..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Direccion
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Calle y numero"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Localidad
                </label>
                <input
                  type="text"
                  value={formData.localidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, localidad: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Provincia
                </label>
                <select
                  value={formData.provincia}
                  onChange={(e) => setFormData(prev => ({ ...prev, provincia: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {PROVINCIAS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Alquiler mensual
                </label>
                <input
                  type="number"
                  value={formData.alquiler_mensual}
                  onChange={(e) => setFormData(prev => ({ ...prev, alquiler_mensual: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Superficie (m²)
                </label>
                <input
                  type="number"
                  value={formData.superficie_m2}
                  onChange={(e) => setFormData(prev => ({ ...prev, superficie_m2: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.es_propio}
                    onChange={(e) => setFormData(prev => ({ ...prev, es_propio: e.target.checked }))}
                    className="w-4 h-4 text-violet-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Es propio (no alquilado)</span>
                </label>
              </div>
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
                disabled={saving}
                className="px-3 py-1.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-sm flex items-center gap-2"
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
            className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-violet-400 hover:text-violet-600 rounded-lg flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar local
          </button>
        )}
      </div>
    </FichaSeccion>
  )
}
