import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Layout } from '../../../components/layout/Layout'
import { ArticulosList } from '../components/ArticulosList'
import { useArticulos } from '../hooks/useArticulos'
import { useCategorias } from '../hooks/useCategorias'
import { useCanEditEducacion } from '../hooks/useCanEditEducacion'

/**
 * Pagina principal de Educacion Impositiva
 * Lista de articulos publicados para todos los usuarios
 */
export function EducacionPage() {
  const { articulos, cargando: cargandoArticulos } = useArticulos({ soloPublicados: true })
  const { categorias, cargando: cargandoCategorias } = useCategorias()
  const { canEdit } = useCanEditEducacion()

  const cargando = cargandoArticulos || cargandoCategorias

  return (
    <Layout title="Educacion Impositiva">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <p className="text-gray-600">Aprende sobre monotributo, impuestos y obligaciones fiscales</p>

          {canEdit && (
            <Link
              to="/educacion/admin"
              className="flex items-center gap-2 px-3 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors text-sm"
            >
              <Settings className="w-4 h-4" />
              Administrar
            </Link>
          )}
        </div>

        {/* Lista de articulos */}
        <ArticulosList
          articulos={articulos}
          categorias={categorias}
          cargando={cargando}
          mostrarFiltros={true}
          mostrarBusqueda={true}
        />
      </div>
    </Layout>
  )
}
