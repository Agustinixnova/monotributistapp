import { useState, useEffect } from 'react'
import { X, Plus, Trash2, CheckCircle, AlertTriangle, Home } from 'lucide-react'
import { Modal, AlertModal, ConfirmModal } from '../../../components/ui/Modal'
import { PROVINCIAS_ARGENTINA, REGIMENES_IIBB, getRegimenIibbLabel } from '../../../constants/fiscales'
import { getClienteDetalle, guardarJurisdiccionesIibb, actualizarCamposCliente } from '../services/carteraService'
import { useAuth } from '../../../auth/hooks/useAuth'

/**
 * Modal para editar jurisdicciones IIBB directamente desde la lista
 */
export function ModalEditarIIBB({ isOpen, onClose, clientId, onSave }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cliente, setCliente] = useState(null)
  const [regimenSeleccionado, setRegimenSeleccionado] = useState(null)
  const [editData, setEditData] = useState({
    jurisdicciones: [],
    anioVigencia: new Date().getFullYear()
  })
  const [modalError, setModalError] = useState({ isOpen: false, message: '' })
  const [modalConfirmCambio, setModalConfirmCambio] = useState({ isOpen: false, nuevoRegimen: null })

  const currentYear = new Date().getFullYear()

  // Cargar datos del cliente
  useEffect(() => {
    if (isOpen && clientId) {
      loadCliente()
    }
  }, [isOpen, clientId])

  const loadCliente = async () => {
    try {
      setLoading(true)
      const data = await getClienteDetalle(clientId)
      setCliente(data)
      setRegimenSeleccionado(data.regimen_iibb)

      // Inicializar datos de edición
      const jurisdicciones = data.jurisdiccionesIibb || []
      const anioVigencia = jurisdicciones.length > 0 ? jurisdicciones[0].anio_vigencia : currentYear

      setEditData({
        jurisdicciones: jurisdicciones.map(j => ({
          id: j.id,
          provincia: j.provincia,
          numeroInscripcion: j.numero_inscripcion,
          coeficiente: j.coeficiente,
          alicuota: j.alicuota,
          esSede: j.es_sede,
          notas: j.notas,
          anioVigencia: j.anio_vigencia
        })),
        anioVigencia
      })
    } catch (error) {
      console.error('Error cargando cliente:', error)
      setModalError({
        isOpen: true,
        message: 'Error al cargar los datos del cliente'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Si cambió el régimen, actualizar primero
      if (regimenSeleccionado !== cliente.regimen_iibb) {
        await actualizarCamposCliente(
          clientId,
          { regimen_iibb: regimenSeleccionado },
          { regimen_iibb: cliente.regimen_iibb },
          user?.id,
          'Cambio de régimen IIBB desde Mi Cartera'
        )
      }

      // Guardar jurisdicciones (solo si es Local o CM)
      if (regimenSeleccionado === 'local' || regimenSeleccionado === 'convenio_multilateral') {
        await guardarJurisdiccionesIibb(clientId, editData.jurisdicciones, user?.id)
      } else if (editData.jurisdicciones.length > 0) {
        // Si cambió a un régimen que no usa jurisdicciones, eliminarlas
        await guardarJurisdiccionesIibb(clientId, [], user?.id)
      }

      if (onSave) await onSave()
      onClose()
    } catch (error) {
      console.error('Error guardando:', error)
      setModalError({
        isOpen: true,
        message: error.message || 'Error al guardar los cambios'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCambioRegimen = (nuevoRegimen) => {
    const tieneJurisdicciones = editData.jurisdicciones.length > 0
    const regimenActualRequiereJurisdicciones = regimenSeleccionado === 'local' || regimenSeleccionado === 'convenio_multilateral'
    const nuevoRegimenRequiereJurisdicciones = nuevoRegimen === 'local' || nuevoRegimen === 'convenio_multilateral'

    // Si tiene jurisdicciones y va a cambiar a un régimen que no las usa, confirmar
    if (tieneJurisdicciones && regimenActualRequiereJurisdicciones && !nuevoRegimenRequiereJurisdicciones) {
      setModalConfirmCambio({
        isOpen: true,
        nuevoRegimen
      })
    } else {
      // Cambio directo
      setRegimenSeleccionado(nuevoRegimen)
      if (!nuevoRegimenRequiereJurisdicciones) {
        // Limpiar jurisdicciones si el nuevo régimen no las usa
        setEditData({ ...editData, jurisdicciones: [] })
      }
    }
  }

  const confirmarCambioRegimen = () => {
    setRegimenSeleccionado(modalConfirmCambio.nuevoRegimen)
    setEditData({ ...editData, jurisdicciones: [] }) // Limpiar jurisdicciones
    setModalConfirmCambio({ isOpen: false, nuevoRegimen: null })
  }

  const handleAgregarProvincia = () => {
    const provinciasUsadas = editData.jurisdicciones.map(j => j.provincia)
    const provinciasDisponibles = PROVINCIAS_ARGENTINA.filter(p => !provinciasUsadas.includes(p))

    if (provinciasDisponibles.length === 0) {
      setModalError({
        isOpen: true,
        message: 'Ya se agregaron todas las provincias disponibles'
      })
      return
    }

    setEditData({
      ...editData,
      jurisdicciones: [
        ...editData.jurisdicciones,
        {
          provincia: provinciasDisponibles[0],
          numeroInscripcion: cliente?.numero_iibb || '',
          coeficiente: regimenSeleccionado === 'convenio_multilateral' ? 0 : 100.00,
          alicuota: null,
          esSede: false,
          notas: null,
          anioVigencia: editData.anioVigencia
        }
      ]
    })
  }

  const handleEliminarProvincia = (index) => {
    const nuevasJurisdicciones = [...editData.jurisdicciones]
    nuevasJurisdicciones.splice(index, 1)
    setEditData({ ...editData, jurisdicciones: nuevasJurisdicciones })
  }

  const handleUpdateJurisdiccion = (index, campo, valor) => {
    const nuevasJurisdicciones = [...editData.jurisdicciones]
    nuevasJurisdicciones[index] = {
      ...nuevasJurisdicciones[index],
      [campo]: valor
    }

    // Si se marca como sede, desmarcar las demás
    if (campo === 'esSede' && valor === true) {
      nuevasJurisdicciones.forEach((j, i) => {
        if (i !== index) j.esSede = false
      })
    }

    setEditData({ ...editData, jurisdicciones: nuevasJurisdicciones })
  }

  // Calcular suma de coeficientes para CM
  const sumaCoeficientes = editData.jurisdicciones.reduce(
    (sum, j) => sum + parseFloat(j.coeficiente || 0),
    0
  )

  const coeficientesValidos = cliente?.regimen_iibb === 'convenio_multilateral'
    ? Math.abs(sumaCoeficientes - 100) < 0.01
    : true

  if (!isOpen) return null

  const esEditable = regimenSeleccionado === 'local' || regimenSeleccionado === 'convenio_multilateral'

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`IIBB: ${cliente?.full_name || cliente?.razon_social || 'Cliente'}`}
        size="lg"
        variant="info"
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-500 mt-2">Cargando...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selector de régimen */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-gray-500 mb-1">Régimen:</label>
                  <select
                    value={regimenSeleccionado || ''}
                    onChange={(e) => handleCambioRegimen(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white"
                  >
                    {REGIMENES_IIBB.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Nº Inscripción:</span>
                  <p className="font-medium px-3 py-2">{cliente?.numero_iibb || '-'}</p>
                </div>
              </div>
            </div>

            {!esEditable ? (
              <div className="text-center py-6 text-gray-600">
                <p>Este régimen no requiere configuración de jurisdicciones</p>
              </div>
            ) : (
              <>
                {/* Selector de año (solo CM) */}
                {regimenSeleccionado === 'convenio_multilateral' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-blue-900">
                        Año vigencia:
                      </label>
                      <select
                        value={editData.anioVigencia}
                        onChange={(e) => {
                          const nuevoAnio = Number(e.target.value)
                          setEditData({
                            ...editData,
                            anioVigencia: nuevoAnio,
                            jurisdicciones: editData.jurisdicciones.map(j => ({
                              ...j,
                              anioVigencia: nuevoAnio
                            }))
                          })
                        }}
                        className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-medium bg-white"
                      >
                        {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Lista de jurisdicciones */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {editData.jurisdicciones.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      No hay provincias agregadas
                    </div>
                  ) : (
                    editData.jurisdicciones.map((j, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-3">
                            {/* Provincia */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Provincia
                              </label>
                              <select
                                value={j.provincia}
                                onChange={(e) => handleUpdateJurisdiccion(idx, 'provincia', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              >
                                {PROVINCIAS_ARGENTINA.map(p => (
                                  <option
                                    key={p}
                                    value={p}
                                    disabled={editData.jurisdicciones.some((jur, i) => i !== idx && jur.provincia === p)}
                                  >
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Sede (solo CM) */}
                            {regimenSeleccionado === 'convenio_multilateral' && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`sede-${idx}`}
                                  checked={j.esSede}
                                  onChange={(e) => handleUpdateJurisdiccion(idx, 'esSede', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor={`sede-${idx}`} className="text-sm text-gray-700">
                                  Es jurisdicción sede
                                </label>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              {/* Coeficiente (solo CM) */}
                              {regimenSeleccionado === 'convenio_multilateral' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Coeficiente (%)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={j.coeficiente || ''}
                                    onChange={(e) => handleUpdateJurisdiccion(idx, 'coeficiente', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                </div>
                              )}

                              {/* Alícuota */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Alícuota (%)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={j.alicuota || ''}
                                  onChange={(e) => handleUpdateJurisdiccion(idx, 'alicuota', parseFloat(e.target.value) || null)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Botón eliminar */}
                          <button
                            onClick={() => handleEliminarProvincia(idx)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Botón agregar provincia */}
                <button
                  onClick={handleAgregarProvincia}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar provincia
                </button>

                {/* Validación coeficientes CM */}
                {regimenSeleccionado === 'convenio_multilateral' && editData.jurisdicciones.length > 0 && (
                  <div className={`p-3 rounded-lg border ${
                    coeficientesValidos
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2 text-sm">
                      {coeficientesValidos ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-700">
                            Suma de coeficientes: <strong>{sumaCoeficientes.toFixed(2)}%</strong> ✓
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-700">
                            Suma de coeficientes: <strong>{sumaCoeficientes.toFixed(2)}%</strong> (debe ser 100%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Botones de acción - SIEMPRE VISIBLES */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (esEditable && regimenSeleccionado === 'convenio_multilateral' && !coeficientesValidos)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de errores */}
      <AlertModal
        isOpen={modalError.isOpen}
        onClose={() => setModalError({ isOpen: false, message: '' })}
        title="Error"
        message={modalError.message}
        variant="error"
        buttonText="Entendido"
      />

      {/* Modal de confirmación de cambio de régimen */}
      <ConfirmModal
        isOpen={modalConfirmCambio.isOpen}
        onClose={() => setModalConfirmCambio({ isOpen: false, nuevoRegimen: null })}
        onConfirm={confirmarCambioRegimen}
        title="Cambio de régimen IIBB"
        message={`Al cambiar a "${getRegimenIibbLabel(modalConfirmCambio.nuevoRegimen)}" se eliminarán todas las jurisdicciones y alícuotas configuradas. ¿Desea continuar?`}
        variant="warning"
        confirmText="Sí, cambiar régimen"
        cancelText="Cancelar"
      />
    </>
  )
}
