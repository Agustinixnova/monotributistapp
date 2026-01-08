import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Eye, EyeOff, Star, Loader2, AlertCircle, Paperclip } from 'lucide-react'
import { TipTapEditor } from './TipTapEditor'
import { AdjuntosManager } from './AdjuntosManager'
import { useCategorias } from '../hooks/useCategorias'
import { useArticulo } from '../hooks/useArticulo'
import { crearArticulo, actualizarArticulo, cambiarEstadoArticulo } from '../services/articulosService'
import { useAuth } from '../../../auth/hooks/useAuth'

/**
 * Editor de articulos (crear/editar)
 */
export function ArticuloEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { categorias, cargando: cargandoCategorias } = useCategorias()
  const { articulo: articuloExistente, cargando: cargandoArticulo } = useArticulo(id, { porId: true })

  const [formData, setFormData] = useState({
    titulo: '',
    resumen: '',
    contenido: null,
    categoria_id: '',
    destacado: false,
    estado: 'borrador'
  })
  const [adjuntos, setAdjuntos] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})

  // Cargar articulo existente
  useEffect(() => {
    if (articuloExistente) {
      setFormData({
        titulo: articuloExistente.titulo || '',
        resumen: articuloExistente.resumen || '',
        contenido: articuloExistente.contenido,
        categoria_id: articuloExistente.categoria_id || '',
        destacado: articuloExistente.destacado || false,
        estado: articuloExistente.estado || 'borrador'
      })
      setAdjuntos(articuloExistente.adjuntos || [])
    }
  }, [articuloExistente])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El titulo es requerido'
    }
    if (!formData.contenido) {
      newErrors.contenido = 'El contenido es requerido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGuardar = async (publicar = false) => {
    if (!validate()) return

    try {
      setGuardando(true)
      setError(null)

      const datos = {
        titulo: formData.titulo,
        resumen: formData.resumen,
        contenido: formData.contenido,
        categoriaId: formData.categoria_id || null,
        destacado: formData.destacado,
        estado: publicar ? 'publicado' : formData.estado
      }

      if (id) {
        await actualizarArticulo(id, datos, user.id)
        if (publicar && formData.estado === 'borrador') {
          await cambiarEstadoArticulo(id, 'publicado', user.id)
        }
      } else {
        await crearArticulo(datos, user.id)
      }

      navigate('/educacion/admin')
    } catch (err) {
      console.error('Error guardando articulo:', err)
      setError(err.message || 'Error al guardar el articulo')
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleEstado = async () => {
    if (!id) return

    try {
      setGuardando(true)
      const nuevoEstado = formData.estado === 'publicado' ? 'borrador' : 'publicado'
      await cambiarEstadoArticulo(id, nuevoEstado, user.id)
      setFormData(prev => ({ ...prev, estado: nuevoEstado }))
    } catch (err) {
      console.error('Error cambiando estado:', err)
      setError(err.message || 'Error al cambiar estado')
    } finally {
      setGuardando(false)
    }
  }

  const cargando = cargandoArticulo || cargandoCategorias

  if (id && cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/educacion/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </button>

        <div className="flex items-center gap-2">
          {id && (
            <button
              onClick={handleToggleEstado}
              disabled={guardando}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                formData.estado === 'publicado'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {formData.estado === 'publicado' ? (
                <>
                  <Eye className="w-4 h-4" />
                  Publicado
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Borrador
                </>
              )}
            </button>
          )}

          <button
            onClick={() => handleGuardar(false)}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>

          {formData.estado !== 'publicado' && (
            <button
              onClick={() => handleGuardar(true)}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              Publicar
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="space-y-6">
        {/* Titulo */}
        <div>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => handleChange('titulo', e.target.value)}
            placeholder="Titulo del articulo..."
            className={`w-full text-2xl font-bold border-0 border-b-2 pb-2 focus:outline-none focus:border-violet-500 ${
              errors.titulo ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.titulo && (
            <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
          )}
        </div>

        {/* Resumen */}
        <div>
          <textarea
            value={formData.resumen}
            onChange={(e) => handleChange('resumen', e.target.value)}
            placeholder="Resumen breve del articulo (opcional)..."
            rows={2}
            className="w-full px-0 py-2 text-gray-600 border-0 border-b border-gray-200 focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>

        {/* Opciones */}
        <div className="flex flex-wrap items-center gap-4 py-3 border-b border-gray-200">
          {/* Categoria */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Categoria:</label>
            <select
              value={formData.categoria_id}
              onChange={(e) => handleChange('categoria_id', e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="">Sin categoria</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Destacado */}
          <button
            type="button"
            onClick={() => handleChange('destacado', !formData.destacado)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              formData.destacado
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Star className={`w-4 h-4 ${formData.destacado ? 'fill-current' : ''}`} />
            {formData.destacado ? 'Destacado' : 'Destacar'}
          </button>
        </div>

        {/* Editor de contenido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contenido
          </label>
          <div className={`border rounded-lg ${errors.contenido ? 'border-red-500' : 'border-gray-300'}`}>
            <TipTapEditor
              content={formData.contenido}
              onChange={(content) => handleChange('contenido', content)}
              placeholder="Escribe el contenido del articulo..."
              articuloId={id}
            />
          </div>
          {errors.contenido && (
            <p className="mt-1 text-sm text-red-600">{errors.contenido}</p>
          )}
        </div>

        {/* Adjuntos descargables */}
        <div className="pt-6 border-t border-gray-200">
          <AdjuntosManager
            articuloId={id}
            adjuntos={adjuntos}
            onAdjuntosChange={setAdjuntos}
          />
        </div>
      </div>
    </div>
  )
}
