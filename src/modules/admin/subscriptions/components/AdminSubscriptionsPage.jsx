import { useState } from 'react'
import { Users, Clock, Settings, FileText, CreditCard, AlertTriangle } from 'lucide-react'
import { Layout } from '../../../../components/layout/Layout'
import { SubscriptionMetrics } from './SubscriptionMetrics'
import { ExpiringSubscriptions } from './ExpiringSubscriptions'
import { PlanSettings } from './PlanSettings'
import { InvoicesList } from './InvoicesList'

/**
 * Página principal de administración de suscripciones
 * Solo accesible para admin/contadora_principal
 */
export function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: Users },
    { id: 'expiring', label: 'Vencimientos', icon: Clock },
    { id: 'plans', label: 'Planes', icon: Settings },
    { id: 'invoices', label: 'Facturas', icon: FileText },
    { id: 'settings', label: 'MercadoPago', icon: CreditCard }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <SubscriptionMetrics />
            <div className="border-t border-gray-200 pt-8">
              <ExpiringSubscriptions />
            </div>
          </div>
        )

      case 'expiring':
        return <ExpiringSubscriptions />

      case 'plans':
        return <PlanSettings />

      case 'invoices':
        return <InvoicesList />

      case 'settings':
        return (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración de MercadoPago</h3>
            <p className="text-gray-500 mb-4">
              Configurá las credenciales y opciones de pago
            </p>
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Actualmente usando modo de prueba
              </span>
              <br />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <Clock className="w-4 h-4" />
                Próximamente
              </span>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Suscripciones
            </h1>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex overflow-x-auto scrollbar-hide -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {renderContent()}
        </div>
      </div>
    </Layout>
  )
}

export default AdminSubscriptionsPage
