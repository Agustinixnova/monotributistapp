/**
 * Banner que muestra las facturas pendientes de emisión
 * Se muestra en la parte superior del tab de facturación
 */

import { AlertTriangle, ChevronRight } from 'lucide-react'

export default function BannerFacturasPendientes({ count, onClick }) {
  if (!count || count === 0) return null

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-medium text-amber-900">
            {count} factura{count !== 1 ? 's' : ''} pendiente{count !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-amber-700">
            No se pudieron emitir por problemas de conexión
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-amber-400 flex-shrink-0" />
    </button>
  )
}
