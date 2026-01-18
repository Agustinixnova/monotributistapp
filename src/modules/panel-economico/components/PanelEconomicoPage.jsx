/**
 * Pagina principal del Panel Economico
 * Muestra indicadores economicos de Argentina
 */

import { TrendingUp } from 'lucide-react'
import { Layout } from '../../../components/layout'
import SeccionCotizaciones from './SeccionCotizaciones'
import SeccionIndicadores from './SeccionIndicadores'
import CalculadoraIPC from './CalculadoraIPC'
import ConversorMonedas from './ConversorMonedas'
import ProximosFeriados from './ProximosFeriados'

export default function PanelEconomicoPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="text-2xl font-heading font-bold">Panel Economico</h1>
          </div>
          <p className="text-blue-100 text-sm">
            Cotizaciones, indicadores e inflacion de Argentina
          </p>
        </div>

        {/* Contenido */}
        <div className="px-4 -mt-4 space-y-4">
          {/* Cotizaciones - Principal */}
          <SeccionCotizaciones />

          {/* Indicadores economicos */}
          <SeccionIndicadores />

          {/* Calculadora IPC - Feature principal */}
          <CalculadoraIPC />

          {/* Dos columnas: Conversor y Feriados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ConversorMonedas />
            <ProximosFeriados />
          </div>
        </div>
      </div>
    </Layout>
  )
}
