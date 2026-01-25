/**
 * Página de gestión de documentos legales (solo para rol desarrollo)
 */

import { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { useAuth } from '../auth/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { FileText, Shield, Save, Eye, ArrowLeft, AlertTriangle } from 'lucide-react'
import { getAllDocumentosLegales, updateDocumentoLegal } from '../services/documentosLegalesService'
import { SimpleMarkdown } from '../components/common/SimpleMarkdown'
import { supabase } from '../lib/supabase'

export function DocumentosLegalesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabActiva, setTabActiva] = useState('terminos')
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [preview, setPreview] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loadingRole, setLoadingRole] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    version: ''
  })

  // Obtener rol del usuario desde profiles
  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) {
        setLoadingRole(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('roles(name)')
        .eq('id', user.id)
        .single()

      setUserRole(profile?.roles?.name)
      setLoadingRole(false)
    }
    fetchRole()
  }, [user?.id])

  const esDesarrollo = userRole === 'desarrollo' || userRole === 'dev'

  // Verificar acceso
  useEffect(() => {
    if (!loadingRole && userRole && !esDesarrollo) {
      navigate('/configuracion')
    }
  }, [userRole, esDesarrollo, loadingRole, navigate])

  // Cargar documentos
  useEffect(() => {
    const cargar = async () => {
      const { data } = await getAllDocumentosLegales()
      setDocumentos(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  // Actualizar form cuando cambia tab
  useEffect(() => {
    const doc = documentos.find(d => d.tipo === tabActiva)
    if (doc) {
      setFormData({
        titulo: doc.titulo || '',
        contenido: doc.contenido || '',
        version: doc.version || '1.0'
      })
    }
    setEditando(false)
    setPreview(false)
  }, [tabActiva, documentos])

  const handleGuardar = async () => {
    setGuardando(true)
    setMensaje(null)

    const { data, error } = await updateDocumentoLegal(tabActiva, formData)

    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar: ' + error.message })
    } else {
      setMensaje({ tipo: 'success', texto: 'Documento guardado correctamente' })
      // Actualizar lista local
      setDocumentos(prev => prev.map(d =>
        d.tipo === tabActiva ? { ...d, ...formData, updated_at: new Date().toISOString() } : d
      ))
      setEditando(false)
    }

    setGuardando(false)
    setTimeout(() => setMensaje(null), 3000)
  }

  const docActual = documentos.find(d => d.tipo === tabActiva)

  // Mostrar loading mientras se verifica el rol
  if (loadingRole) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-3 border-violet-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    )
  }

  if (!esDesarrollo) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso restringido</h2>
            <p className="text-gray-500">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/configuracion')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documentos Legales</h1>
              <p className="text-gray-500">Gestiona términos y políticas de privacidad</p>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-4 p-4 rounded-lg ${
            mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-3 border-violet-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setTabActiva('terminos')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${
                  tabActiva === 'terminos'
                    ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-5 h-5" />
                Términos y Condiciones
              </button>
              <button
                onClick={() => setTabActiva('privacidad')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${
                  tabActiva === 'privacidad'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-5 h-5" />
                Política de Privacidad
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Info */}
              {docActual && (
                <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                  <span>
                    Versión: {docActual.version} | Última actualización: {new Date(docActual.updated_at).toLocaleDateString('es-AR')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreview(!preview)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                        preview ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      {preview ? 'Ocultar preview' : 'Ver preview'}
                    </button>
                    {!editando ? (
                      <button
                        onClick={() => setEditando(true)}
                        className="px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                      >
                        Editar
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditando(false)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              )}

              {editando ? (
                /* Modo edición */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Versión
                      </label>
                      <input
                        type="text"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="1.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenido (Markdown)
                    </label>
                    <textarea
                      value={formData.contenido}
                      onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                      rows={20}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono text-sm"
                      placeholder="# Título&#10;&#10;Contenido en formato Markdown..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleGuardar}
                      disabled={guardando}
                      className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-violet-400"
                    >
                      <Save className="w-5 h-5" />
                      {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              ) : preview ? (
                /* Modo preview */
                <div className="max-w-none">
                  <SimpleMarkdown>{formData.contenido}</SimpleMarkdown>
                </div>
              ) : (
                /* Modo visualización (código) */
                <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {formData.contenido}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">Información:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-600">
            <li>Los documentos se muestran en formato Markdown</li>
            <li>Los links están disponibles en: <code className="bg-blue-100 px-1 rounded">/terminos</code> y <code className="bg-blue-100 px-1 rounded">/privacidad</code></li>
            <li>Los cambios se aplican inmediatamente</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default DocumentosLegalesPage
