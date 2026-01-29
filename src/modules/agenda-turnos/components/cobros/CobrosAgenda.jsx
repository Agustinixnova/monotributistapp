/**
 * Caja/Cobros para Agenda - Wrapper con sub-pestañas
 * Muestra pestañas: Cobros | Facturación (si tiene módulo premium)
 */

import { useState } from 'react'
import { DollarSign, Receipt } from 'lucide-react'
import CobrosLista from './CobrosLista'
import TabFacturacion from '../facturacion/TabFacturacion'
import { useFacturacion } from '../../hooks/useFacturacion'

export default function CobrosAgenda() {
  const { tieneModuloPremium } = useFacturacion()
  const [subTab, setSubTab] = useState('cobros')

  // Si no tiene el módulo premium, mostrar solo la lista de cobros
  if (!tieneModuloPremium) {
    return <CobrosLista />
  }

  return (
    <div className="space-y-4">
      {/* Sub-pestañas */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSubTab('cobros')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            subTab === 'cobros'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Cobros
        </button>
        <button
          onClick={() => setSubTab('facturacion')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            subTab === 'facturacion'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Facturación
        </button>
      </div>

      {/* Contenido de la sub-pestaña */}
      {subTab === 'cobros' ? (
        <CobrosLista />
      ) : (
        <TabFacturacion />
      )}
    </div>
  )
}
