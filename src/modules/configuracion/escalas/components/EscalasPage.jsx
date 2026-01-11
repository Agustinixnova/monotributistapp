import { useState, useEffect } from 'react'
import { ArrowLeft, Scale, Bell, History, FileSpreadsheet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../../../components/layout/Layout'
import { useAuth } from '../../../../auth/hooks/useAuth'
import { useCategorias } from '../hooks/useCategorias'
import { supabase } from '../../../../lib/supabase'
import TablaCategorias from './TablaCategorias'
import ConfigAlertas from './ConfigAlertas'
import HistorialEscalas from './HistorialEscalas'
import ConfigConvenioMultilateral from './ConfigConvenioMultilateral'

const TABS = [
  { id: 'categorias', label: 'Categorias', icon: Scale },
  { id: 'convenio', label: 'Conv. Multilateral', icon: FileSpreadsheet },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'historial', label: 'Historial', icon: History }
]

/**
 * Pagina principal del modulo Escalas Monotributo
 */
export function EscalasPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('categorias')
  const [userRole, setUserRole] = useState(null)

  const {
    categorias,
    historial,
    loading,
    error,
    fechaVigencia,
    updateCategoria,
    cargarNuevaEscala,
    getCategoriasPorPeriodo
  } = useCategorias()

  // Obtener rol del usuario desde profiles
  useEffect(() => {
    async function fetchUserRole() {
      if (!user?.id) return

      const { data } = await supabase
        .from('profiles')
        .select('role:roles(name)')
        .eq('id', user.id)
        .single()

      if (data?.role?.name) {
        setUserRole(data.role.name)
      }
    }
    fetchUserRole()
  }, [user?.id])

  // Verificar permisos (roles con acceso de edicion)
  const canEdit = ['admin', 'contadora_principal', 'comunicadora', 'desarrollo'].includes(userRole)

  const handleNuevaEscala = () => {
    // TODO: Implementar modal para cargar nueva escala completa
    alert('Funcionalidad en desarrollo: Cargar nueva escala')
  }

  return (
    <Layout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/configuracion')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Escalas Monotributo</h1>
            <p className="text-sm text-gray-500">Categorias, valores y configuracion de alertas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-t-xl">
          <div className="flex gap-1 overflow-x-auto px-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${isActive
                      ? 'border-violet-600 text-violet-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-4 md:p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {activeTab === 'categorias' && (
            <TablaCategorias
              categorias={categorias}
              fechaVigencia={fechaVigencia}
              loading={loading}
              onUpdate={updateCategoria}
              onNuevaEscala={handleNuevaEscala}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'alertas' && (
            <ConfigAlertas canEdit={canEdit} />
          )}

          {activeTab === 'convenio' && (
            <ConfigConvenioMultilateral canEdit={canEdit} />
          )}

          {activeTab === 'historial' && (
            <HistorialEscalas
              historial={historial}
              loading={loading}
              onVerDetalle={getCategoriasPorPeriodo}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

export default EscalasPage
