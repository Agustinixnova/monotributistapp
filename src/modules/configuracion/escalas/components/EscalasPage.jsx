import { useState } from 'react'
import { ArrowLeft, Scale, Bell, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../auth/hooks/useAuth'
import { useCategorias } from '../hooks/useCategorias'
import TablaCategorias from './TablaCategorias'
import ConfigAlertas from './ConfigAlertas'
import HistorialEscalas from './HistorialEscalas'

const TABS = [
  { id: 'categorias', label: 'Categorias Vigentes', icon: Scale },
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

  // Verificar permisos
  const userRole = user?.user_metadata?.role || user?.role
  const canEdit = ['admin', 'contadora_principal'].includes(userRole)

  const handleNuevaEscala = () => {
    // TODO: Implementar modal para cargar nueva escala completa
    alert('Funcionalidad en desarrollo: Cargar nueva escala')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/configuracion')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-heading">Escalas Monotributo</h1>
              <p className="text-sm text-gray-500">Categorias, valores y configuracion de alertas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
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
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
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

        {activeTab === 'historial' && (
          <HistorialEscalas
            historial={historial}
            loading={loading}
            onVerDetalle={getCategoriasPorPeriodo}
          />
        )}
      </div>
    </div>
  )
}

export default EscalasPage
