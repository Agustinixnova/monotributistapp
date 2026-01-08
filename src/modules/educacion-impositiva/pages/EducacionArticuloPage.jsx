import { useParams, Navigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { Layout } from '../../../components/layout/Layout'
import { ArticuloViewer } from '../components/ArticuloViewer'
import { useArticuloBySlug } from '../hooks/useArticulo'
import { useCanEditEducacion } from '../hooks/useCanEditEducacion'

/**
 * Pagina de visualizacion de un articulo individual
 */
export function EducacionArticuloPage() {
  const { slug } = useParams()
  const { articulo, cargando, error } = useArticuloBySlug(slug)
  const { canEdit } = useCanEditEducacion()

  if (cargando) {
    return (
      <Layout title="Cargando...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Error">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error al cargar el articulo</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!articulo) {
    return <Navigate to="/educacion" replace />
  }

  // Si el articulo no esta publicado y el usuario no puede editar, redirigir
  if (articulo.estado !== 'publicado' && !canEdit) {
    return <Navigate to="/educacion" replace />
  }

  return (
    <Layout title={articulo.titulo}>
      <ArticuloViewer articulo={articulo} canEdit={canEdit} />
    </Layout>
  )
}
