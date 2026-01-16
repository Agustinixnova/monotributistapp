import { useState } from 'react'
import { FileText, Edit2, X, Plus, CheckCircle, AlertTriangle, Home, CreditCard } from 'lucide-react'
import { PROVINCIAS_ARGENTINA, REGIMENES_IIBB, getRegimenIibbLabel } from '../../../constants/fiscales'
import { guardarJurisdiccionesIibb, actualizarCamposCliente } from '../services/carteraService'
import { AlertModal } from '../../../components/ui/Modal'

const METODOS_PAGO = [
  { value: 'debito_automatico', label: 'Débito automático' },
  { value: 'vep', label: 'VEP' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'efectivo', label: 'Efectivo / Rapipago / PagoFacil' },
  { value: 'otro', label: 'Otro' }
]

/**
 * Componente para mostrar y editar jurisdicciones IIBB
 * Maneja todos los regímenes: simplificado, local, CM, exento, no inscripto
 */
export function FichaSeccionIIBB({ cliente, onUpdate, saving, userId }) {
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    jurisdicciones: [],
    anioVigencia: new Date().getFullYear(),
    metodo_pago_iibb: null
  })
  const [modalError, setModalError] = useState({ isOpen: false, message: '' })

  const regimen = cliente?.regimen_iibb
  const numeroIibb = cliente?.numero_iibb
  const metodoPagoIibb = cliente?.metodo_pago_iibb
  const jurisdicciones = cliente?.jurisdiccionesIibb || []

  // Año de vigencia actual (tomar de la primera jurisdicción)
  const anioVigenciaActual = jurisdicciones.length > 0 ? jurisdicciones[0].anio_vigencia : null
  const currentYear = new Date().getFullYear()

  // Iniciar edición
  const handleEdit = () => {
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
      anioVigencia: anioVigenciaActual || currentYear,
      metodo_pago_iibb: metodoPagoIibb
    })
    setEditing(true)
  }

  // Cancelar edición
  const handleCancel = () => {
    setEditing(false)
    setEditData({ jurisdicciones: [] })
  }

  // Guardar cambios
  const handleSave = async () => {
    try {
      const clientId = cliente.id || cliente.client_id

      // Guardar jurisdicciones
      await guardarJurisdiccionesIibb(
        clientId,
        editData.jurisdicciones,
        userId
      )

      // Guardar método de pago si cambió
      if (editData.metodo_pago_iibb !== metodoPagoIibb) {
        await actualizarCamposCliente(
          clientId,
          { metodo_pago_iibb: editData.metodo_pago_iibb },
          { metodo_pago_iibb: metodoPagoIibb },
          userId
        )
      }

      setEditing(false)
      if (onUpdate) await onUpdate()
    } catch (error) {
      console.error('Error guardando datos IIBB:', error)
      setModalError({
        isOpen: true,
        message: error.message || 'Ocurrió un error al guardar los datos de IIBB'
      })
    }
  }

  // Agregar provincia
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
          numeroInscripcion: numeroIibb || '',
          coeficiente: regimen === 'convenio_multilateral' ? 0 : 100.00,
          alicuota: null,
          esSede: false,
          notas: null,
          anioVigencia: editData.anioVigencia
        }
      ]
    })
  }

  // Eliminar provincia
  const handleEliminarProvincia = (index) => {
    const nuevasJurisdicciones = [...editData.jurisdicciones]
    nuevasJurisdicciones.splice(index, 1)
    setEditData({ ...editData, jurisdicciones: nuevasJurisdicciones })
  }

  // Actualizar provincia específica
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

  // Validar suma de coeficientes
  const coeficientesValidos = regimen === 'convenio_multilateral'
    ? Math.abs(sumaCoeficientes - 100) < 0.01
    : true

  // ============================================
  // RENDERIZADO SEGÚN RÉGIMEN
  // ============================================

  // SIMPLIFICADO
  if (regimen === 'simplificado') {
    return (
      <div className="border border-gray-200 rounded-lg">
        <div className="p-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <span className="font-medium text-gray-900">Ingresos Brutos</span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Régimen: Simplificado</p>
              <p className="text-gray-600 mt-1">IIBB incluido en la cuota mensual del monotributo</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // EXENTO
  if (regimen === 'exento') {
    return (
      <div className="border border-gray-200 rounded-lg">
        <div className="p-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <span className="font-medium text-gray-900">Ingresos Brutos</span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Régimen: Exento</p>
              <p className="text-gray-600 mt-1">Cliente exento de IIBB (verificar vigencia de exención)</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // NO INSCRIPTO
  if (regimen === 'no_inscripto') {
    return (
      <div className="border border-red-200 rounded-lg bg-red-50">
        <div className="p-4 flex items-center justify-between bg-red-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            <span className="font-medium text-gray-900">Ingresos Brutos</span>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-700">Régimen: No inscripto</p>
              <p className="text-red-600 mt-1">
                <strong>ATENCIÓN:</strong> Cliente no inscripto en Ingresos Brutos. Regularizar situación.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // LOCAL Y CONVENIO MULTILATERAL
  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          <span className="font-medium text-gray-900">Ingresos Brutos</span>
        </div>
        {!editing && (
          <button
            onClick={handleEdit}
            className="p-2 hover:bg-teal-100 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4 text-teal-600" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Régimen y número */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Régimen</span>
            <p className="font-medium text-gray-900">{getRegimenIibbLabel(regimen)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">
              {regimen === 'convenio_multilateral' ? 'Nº CM' : 'Nº Inscripción IIBB'}
            </span>
            <p className="font-medium text-gray-900">{numeroIibb || '-'}</p>
          </div>
        </div>

        {/* Método de pago - siempre visible en modo edición */}
        {editing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de pago predeterminado para IIBB
            </label>
            <select
              value={editData.metodo_pago_iibb || ''}
              onChange={(e) => setEditData(p => ({ ...p, metodo_pago_iibb: e.target.value || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            >
              <option value="">Seleccionar método...</option>
              {METODOS_PAGO.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Este método se usará por defecto al generar instrucciones de pago
            </p>
          </div>
        )}

        {/* Mostrar método en modo visualización si existe */}
        {!editing && metodoPagoIibb && (
          <div>
            <span className="text-sm text-gray-500">Método de pago predeterminado</span>
            <p className="font-medium text-gray-900">
              {METODOS_PAGO.find(m => m.value === metodoPagoIibb)?.label}
            </p>
          </div>
        )}

        {/* Modo visualización */}
        {!editing && (
          <>
            {jurisdicciones.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-4">No hay jurisdicciones configuradas</p>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar jurisdicciones
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {regimen === 'convenio_multilateral'
                      ? `Jurisdicciones ${anioVigenciaActual ? `(Coeficientes ${anioVigenciaActual})` : ''}`
                      : 'Jurisdicción:'
                    }
                  </p>
                </div>

                {/* Alerta de año desactualizado (solo CM) */}
                {regimen === 'convenio_multilateral' && anioVigenciaActual && anioVigenciaActual < currentYear && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Los coeficientes son del {anioVigenciaActual}. Verificar si corresponde actualizarlos para {currentYear}.
                    </span>
                  </div>
                )}

                {jurisdicciones.map((j, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {j.es_sede && <Home className="w-4 h-4 text-teal-600" />}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {j.provincia}
                            {j.es_sede && <span className="ml-2 text-teal-600 text-sm">(Sede)</span>}
                          </p>
                          {regimen === 'convenio_multilateral' ? (
                            <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                              <p>Coeficiente: <span className="font-medium">{j.coeficiente}%</span></p>
                              <p>Alícuota: <span className="font-medium">{j.alicuota ? `${j.alicuota}%` : '-'}</span></p>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600 mt-1">
                              Alícuota: <span className="font-medium">{j.alicuota ? `${j.alicuota}%` : '-'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modo edición */}
        {editing && (
          <>
            {/* Selector de año de vigencia (solo para CM) */}
            {regimen === 'convenio_multilateral' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-blue-900">
                    Año vigencia coeficientes:
                  </label>
                  <select
                    value={editData.anioVigencia}
                    onChange={(e) => {
                      const nuevoAnio = Number(e.target.value)
                      setEditData({
                        ...editData,
                        anioVigencia: nuevoAnio,
                        // Actualizar todas las jurisdicciones con el nuevo año
                        jurisdicciones: editData.jurisdicciones.map(j => ({
                          ...j,
                          anioVigencia: nuevoAnio
                        }))
                      })
                    }}
                    className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-medium text-blue-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Los coeficientes de Convenio Multilateral se calculan anualmente. Seleccione el año fiscal correspondiente.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {editData.jurisdicciones.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No hay provincias agregadas. Haga clic en "+ Agregar provincia"
                </div>
              ) : (
                editData.jurisdicciones.map((j, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        {/* Provincia */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Provincia
                          </label>
                          <select
                            value={j.provincia}
                            onChange={(e) => handleUpdateJurisdiccion(idx, 'provincia', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
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
                        {regimen === 'convenio_multilateral' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`sede-${idx}`}
                              checked={j.esSede}
                              onChange={(e) => handleUpdateJurisdiccion(idx, 'esSede', e.target.checked)}
                              className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`sede-${idx}`} className="text-sm text-gray-700">
                              Es jurisdicción sede
                            </label>
                          </div>
                        )}

                        {/* Coeficiente (solo CM) */}
                        {regimen === 'convenio_multilateral' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Coeficiente (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={j.coeficiente || ''}
                              onChange={(e) => handleUpdateJurisdiccion(idx, 'coeficiente', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        )}

                        {/* Alícuota */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Alícuota (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={j.alicuota || ''}
                            onChange={(e) => handleUpdateJurisdiccion(idx, 'alicuota', parseFloat(e.target.value) || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                            placeholder="3.50"
                          />
                        </div>
                      </div>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleEliminarProvincia(idx)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                        title="Eliminar"
                      >
                        <X className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Botón agregar provincia */}
            <button
              onClick={handleAgregarProvincia}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar provincia
            </button>

            {/* Validación coeficientes CM */}
            {regimen === 'convenio_multilateral' && editData.jurisdicciones.length > 0 && (
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

            {/* Botones de acción */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (regimen === 'convenio_multilateral' && !coeficientesValidos)}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de errores */}
      <AlertModal
        isOpen={modalError.isOpen}
        onClose={() => setModalError({ isOpen: false, message: '' })}
        title="Error"
        message={modalError.message}
        variant="error"
        buttonText="Entendido"
      />
    </div>
  )
}
