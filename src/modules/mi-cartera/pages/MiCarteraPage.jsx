import { useEffect, useRef } from 'react'
import { Layout } from '../../../components/layout'
import { useCartera } from '../hooks/useCartera'
import { ListaCartera } from '../components/ListaCartera'
import { Users, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { verificarIibbDesactualizados } from '../../notificaciones/services/notificacionesService'

export function MiCarteraPage() {
  const { clientes, loading, error, filters, stats, updateFilters, refetch } = useCartera()
  const verificacionRealizada = useRef(false)

  // Verificar IIBB desactualizados una vez al cargar la página
  useEffect(() => {
    if (!verificacionRealizada.current && !loading && clientes.length > 0) {
      verificacionRealizada.current = true
      verificarIibbDesactualizados().catch(err => {
        console.error('Error verificando IIBB:', err)
      })
    }
  }, [loading, clientes])

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-violet-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Cartera</h1>
              <p className="text-sm text-gray-500">
                Gestion de clientes monotributistas
              </p>
            </div>
          </div>

          <Link
            to="/usuarios/nuevo"
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo cliente</span>
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Lista */}
        <ListaCartera
          clientes={clientes}
          loading={loading}
          filters={filters}
          onFilterChange={updateFilters}
          stats={stats}
          onRefresh={refetch}
        />
      </div>
    </Layout>
  )
}
