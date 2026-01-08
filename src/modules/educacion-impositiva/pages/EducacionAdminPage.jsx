import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Layout } from '../../../components/layout/Layout'
import { ArticulosManager } from '../components/ArticulosManager'
import { ArticuloEditor } from '../components/ArticuloEditor'
import { useCanEditEducacion } from '../hooks/useCanEditEducacion'

/**
 * Pagina de administracion de educacion impositiva
 * Solo accesible por usuarios con permisos de edicion
 */
export function EducacionAdminPage() {
  const { canEdit, cargando } = useCanEditEducacion()

  if (cargando) {
    return (
      <Layout title="Administrar Educacion">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!canEdit) {
    return <Navigate to="/educacion" replace />
  }

  return (
    <Layout title="Administrar Educacion">
      <div className="max-w-4xl mx-auto">
        <ArticulosManager />
      </div>
    </Layout>
  )
}

/**
 * Pagina de edicion/creacion de articulo
 */
export function EducacionEditorPage() {
  const { id } = useParams()
  const { canEdit, cargando } = useCanEditEducacion()

  if (cargando) {
    return (
      <Layout title="Editor de Articulo">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!canEdit) {
    return <Navigate to="/educacion" replace />
  }

  return (
    <Layout title={id ? "Editar Articulo" : "Nuevo Articulo"}>
      <ArticuloEditor />
    </Layout>
  )
}
