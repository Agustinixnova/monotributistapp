import { useState, useEffect } from 'react'
import { X, Check, ArrowRight, MessageSquare, Paperclip, CheckCircle, Circle, Save } from 'lucide-react'
import { useIdea } from '../../hooks/useIdeas'
import { ETAPAS, TONOS, getPrioridad, getEtapa, getIcon } from '../../utils/config'
import { puedeEditarSeccion, puedeMoverA, puedeIrADesarrollo, mostrarChecklist } from '../../utils/permisos'
import { Avatar } from '../compartidos/Avatar'
import { SubidorArchivos } from '../compartidos/SubidorArchivos'
import { ListaArchivos } from '../compartidos/ListaArchivos'
import { archivosService } from '../../services/archivosService'
import { useAuth } from '../../../../auth/hooks/useAuth'

/**
 * Modal para ver/editar una idea
 */
export function ModalIdea({ ideaId, onClose, miRol }) {
  const { idea, loading, actualizar, agregarComentario, marcarFiscalListo, marcarUxListo } = useIdea(ideaId)
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('info')
  const [comentario, setComentario] = useState('')
  const [saving, setSaving] = useState(false)
  const [archivos, setArchivos] = useState([])
  const [loadingArchivos, setLoadingArchivos] = useState(false)

  // Cargar archivos de la idea
  useEffect(() => {
    async function cargarArchivos() {
      if (!ideaId) return
      setLoadingArchivos(true)
      const { data } = await archivosService.getByIdea(ideaId)
      setArchivos(data || [])
      setLoadingArchivos(false)
    }
    cargarArchivos()
  }, [ideaId])

  const handleUploadArchivo = async (file) => {
    const { data, error } = await archivosService.upload(file, {
      ideaId,
      userId: user.id
    })
    if (data) {
      setArchivos(prev => [data, ...prev])
    }
    return { data, error }
  }

  const handleDeleteArchivo = async (archivoId, rutaStorage) => {
    await archivosService.delete(archivoId, rutaStorage)
    setArchivos(prev => prev.filter(a => a.id !== archivoId))
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!idea) {
    return null
  }

  const etapa = getEtapa(idea.etapa)
  const prioridad = getPrioridad(idea.prioridad)

  const handleSaveField = async (field, value) => {
    setSaving(true)
    await actualizar({ [field]: value })
    setSaving(false)
  }

  const handleEnviarComentario = async () => {
    if (!comentario.trim()) return
    await agregarComentario(comentario)
    setComentario('')
  }

  const handleMoverEtapa = async (nuevaEtapa) => {
    await actualizar({ etapa: nuevaEtapa })
  }

  const tabs = [
    { id: 'info', label: 'Info', visible: true },
    { id: 'fiscal', label: 'Fiscal', visible: true, done: idea.fiscal_listo },
    { id: 'ux', label: 'UX/Textos', visible: true, done: idea.ux_listo },
    { id: 'archivos', label: `Archivos (${archivos.length})`, visible: true },
    { id: 'checklist', label: 'Checklist', visible: mostrarChecklist(idea.etapa) },
    { id: 'comentarios', label: `Chat (${idea.comentarios?.length || 0})`, visible: true }
  ].filter(t => t.visible)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono text-gray-500">{idea.codigo}</span>
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${etapa.color}-100 text-${etapa.color}-700`}>
                {(() => { const EtapaIcon = getIcon(etapa.icon); return <EtapaIcon className="w-3 h-3" />; })()}
                {etapa.nombre}
              </span>
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${prioridad.color}-100 text-${prioridad.color}-700`}>
                {(() => { const PrioridadIcon = getIcon(prioridad.icon); return <PrioridadIcon className="w-3 h-3" />; })()}
                {prioridad.nombre}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{idea.titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.done && <CheckCircle className="w-4 h-4 text-green-500" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab Info */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Qué queremos hacer?
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">{idea.que_queremos_hacer}</p>
              </div>

              {idea.para_quien && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Para quién?
                  </label>
                  <p className="text-gray-900">{idea.para_quien}</p>
                </div>
              )}

              {idea.por_que_importa && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Por qué importa?
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">{idea.por_que_importa}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Avatar
                      nombre={idea.creador?.nombre}
                      apellido={idea.creador?.apellido}
                      avatarUrl={idea.creador?.avatar_url}
                      size="sm"
                    />
                    <span>Creado por {idea.creador?.nombre}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Fiscal */}
          {activeTab === 'fiscal' && (
            <div className="space-y-4">
              {puedeEditarSeccion('fiscal', miRol) ? (
                <>
                  <EditableField
                    label="Reglas fiscales clave"
                    value={idea.fiscal_reglas}
                    onSave={(v) => handleSaveField('fiscal_reglas', v)}
                    placeholder="¿Qué reglas fiscales aplican?"
                  />
                  <EditableField
                    label="¿Qué hay que validar?"
                    value={idea.fiscal_validar}
                    onSave={(v) => handleSaveField('fiscal_validar', v)}
                    placeholder="Validaciones necesarias..."
                  />
                  <EditableField
                    label="Casos especiales"
                    value={idea.fiscal_casos_especiales}
                    onSave={(v) => handleSaveField('fiscal_casos_especiales', v)}
                    placeholder="Excepciones o casos edge..."
                  />

                  {!idea.fiscal_listo && (
                    <button
                      onClick={marcarFiscalListo}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Check className="w-5 h-5" />
                      Marcar fiscal como listo
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <ReadOnlyField label="Reglas fiscales" value={idea.fiscal_reglas} />
                  <ReadOnlyField label="Validaciones" value={idea.fiscal_validar} />
                  <ReadOnlyField label="Casos especiales" value={idea.fiscal_casos_especiales} />
                </div>
              )}

              {idea.fiscal_listo && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span>Fiscal completado por {idea.fiscal_por?.nombre}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab UX */}
          {activeTab === 'ux' && (
            <div className="space-y-4">
              {puedeEditarSeccion('ux', miRol) ? (
                <>
                  <EditableField
                    label="Mensaje principal"
                    value={idea.ux_mensaje_principal}
                    onSave={(v) => handleSaveField('ux_mensaje_principal', v)}
                    placeholder="¿Qué mensaje mostramos al usuario?"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tono</label>
                    <select
                      value={idea.ux_tono || ''}
                      onChange={(e) => handleSaveField('ux_tono', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Seleccionar...</option>
                      {TONOS.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <EditableField
                    label="Si falta información..."
                    value={idea.ux_si_falta_info}
                    onSave={(v) => handleSaveField('ux_si_falta_info', v)}
                    placeholder="¿Qué mostramos si no hay datos?"
                  />

                  {!idea.ux_listo && (
                    <button
                      onClick={marcarUxListo}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Check className="w-5 h-5" />
                      Marcar UX como listo
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <ReadOnlyField label="Mensaje principal" value={idea.ux_mensaje_principal} />
                  <ReadOnlyField label="Tono" value={idea.ux_tono} />
                  <ReadOnlyField label="Si falta info" value={idea.ux_si_falta_info} />
                </div>
              )}

              {idea.ux_listo && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span>UX completado por {idea.ux_por?.nombre}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab Checklist */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <ChecklistItem
                label="Funciona como se esperaba"
                checked={idea.check_funciona}
                onChange={(v) => handleSaveField('check_funciona', v)}
                disabled={!puedeEditarSeccion('checklist', miRol)}
              />
              <ChecklistItem
                label="Cálculos correctos (si aplica)"
                checked={idea.check_calculos}
                onChange={(v) => handleSaveField('check_calculos', v)}
                disabled={!puedeEditarSeccion('checklist', miRol)}
              />
              <ChecklistItem
                label="Textos correctos"
                checked={idea.check_textos}
                onChange={(v) => handleSaveField('check_textos', v)}
                disabled={!puedeEditarSeccion('checklist', miRol)}
              />
              <ChecklistItem
                label="Se ve bien en celular"
                checked={idea.check_mobile}
                onChange={(v) => handleSaveField('check_mobile', v)}
                disabled={!puedeEditarSeccion('checklist', miRol)}
              />
            </div>
          )}

          {/* Tab Archivos */}
          {activeTab === 'archivos' && (
            <div className="space-y-4">
              <SubidorArchivos
                onUpload={handleUploadArchivo}
                multiple={true}
              />

              {loadingArchivos ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ListaArchivos
                  archivos={archivos}
                  onDelete={handleDeleteArchivo}
                  canDelete={true}
                />
              )}
            </div>
          )}

          {/* Tab Comentarios */}
          {activeTab === 'comentarios' && (
            <div className="space-y-4">
              {/* Lista de comentarios */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {idea.comentarios?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay comentarios</p>
                ) : (
                  idea.comentarios?.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar
                        nombre={c.autor?.nombre}
                        apellido={c.autor?.apellido}
                        avatarUrl={c.autor?.avatar_url}
                        size="sm"
                      />
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{c.autor?.nombre}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(c.fecha).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{c.contenido}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input nuevo comentario */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEnviarComentario()}
                  placeholder="Escribí un comentario..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={handleEnviarComentario}
                  disabled={!comentario.trim()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones de mover */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col gap-3">
          {/* Indicador de progreso */}
          {idea.etapa === 'idea' && !puedeIrADesarrollo(idea) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                Falta completar:
                {!idea.fiscal_listo && <span className="block">- Info fiscal</span>}
                {!idea.ux_listo && <span className="block">- UX/Textos</span>}
              </p>
            </div>
          )}

          {/* Botón especial: Pasar a desarrollo */}
          {idea.etapa === 'idea' && puedeIrADesarrollo(idea) && puedeMoverA('desarrollo', miRol) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm mb-2">
                Info fiscal y UX completas. Listo para desarrollar!
              </p>
              <button
                onClick={() => handleMoverEtapa('desarrollo')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <ArrowRight className="w-5 h-5" />
                Pasar a desarrollo
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {saving && 'Guardando...'}
            </div>

            {/* Botones de mover genéricos */}
            <div className="flex gap-2">
              {ETAPAS.filter(e => e.id !== idea.etapa && e.id !== 'desarrollo' && puedeMoverA(e.id, miRol)).map(e => {
                const EtapaIcon = getIcon(e.icon)
                return (
                  <button
                    key={e.id}
                    onClick={() => handleMoverEtapa(e.id)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    <EtapaIcon className="w-4 h-4" /> {e.nombre}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componentes auxiliares
function EditableField({ label, value, onSave, placeholder }) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value || '')

  const handleSave = () => {
    onSave(tempValue)
    setEditing(false)
  }

  if (editing) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex gap-2">
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 resize-none"
          />
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200"
    >
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className={`${value ? 'text-gray-900' : 'text-gray-400'} whitespace-pre-wrap`}>
        {value || placeholder}
      </p>
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className={`${value ? 'text-gray-900' : 'text-gray-400'} whitespace-pre-wrap`}>
        {value || 'Sin completar'}
      </p>
    </div>
  )
}

function ChecklistItem({ label, checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
        checked
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 hover:border-gray-300'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {checked ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <Circle className="w-5 h-5 text-gray-300" />
      )}
      <span className={checked ? 'text-green-700' : 'text-gray-700'}>{label}</span>
    </button>
  )
}

export default ModalIdea
