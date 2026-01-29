import { useState, useEffect, useMemo } from 'react'
import { User, CreditCard, FileText, MessageSquare, Receipt } from 'lucide-react'
import { Layout } from '../../../components/layout/Layout'
import { MisDatos } from './MisDatos'
import { MiSuscripcion } from './MiSuscripcion'
import { FichaClienteReducida } from '../../mi-cartera/components/FichaClienteReducida'
import { MisSugerencias } from '../../mi-cartera/components/MisSugerencias'
import ConfiguracionAfip from './ConfiguracionAfip'
import { cuentaService } from '../services/cuentaService'
import { useFacturacion } from '../../agenda-turnos/hooks/useFacturacion'

/**
 * Página principal de Mi Cuenta
 * Tabs: Mis Datos | Datos Fiscales | Facturación (premium) | Sugerencias | Mi Suscripción
 */
export function MiCuentaPage() {
  const [activeTab, setActiveTab] = useState('datos')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verificar si tiene el módulo premium de facturación
  const { tieneModuloPremium, loading: loadingFacturacion } = useFacturacion()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await cuentaService.getMyProfile()
      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  // Tabs base (siempre visibles)
  const baseTabs = [
    { id: 'datos', label: 'Mis Datos', icon: User },
    { id: 'fiscales', label: 'Datos Fiscales', icon: FileText }
  ]

  // Tab de facturación (solo si tiene el módulo premium)
  const facturacionTab = { id: 'facturacion', label: 'Facturación', icon: Receipt }

  // Tabs finales (siempre visibles)
  const finalTabs = [
    { id: 'sugerencias', label: 'Sugerencias', icon: MessageSquare },
    { id: 'suscripcion', label: 'Mi Suscripcion', icon: CreditCard }
  ]

  // Construir tabs según permisos
  const tabs = useMemo(() => {
    const result = [...baseTabs]
    if (tieneModuloPremium) {
      result.push(facturacionTab)
    }
    result.push(...finalTabs)
    return result
  }, [tieneModuloPremium])

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>
            <p className="text-gray-500 mt-1">Gestioná tus datos personales y suscripción</p>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 -mb-px overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 min-h-touch border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading || loadingFacturacion ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'datos' && (
                <MisDatos profile={profile} onProfileUpdate={loadProfile} />
              )}
              {activeTab === 'fiscales' && (
                <FichaClienteReducida />
              )}
              {activeTab === 'facturacion' && tieneModuloPremium && (
                <div className="bg-white rounded-xl border p-6">
                  <ConfiguracionAfip />
                </div>
              )}
              {activeTab === 'sugerencias' && (
                <MisSugerencias />
              )}
              {activeTab === 'suscripcion' && (
                <MiSuscripcion />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default MiCuentaPage
