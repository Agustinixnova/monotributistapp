import { History, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'

const MOTIVOS_LABELS = {
  alta_inicial: 'Alta inicial',
  recategorizacion_obligatoria: 'Recategorizacion obligatoria',
  recategorizacion_voluntaria: 'Recategorizacion voluntaria',
  exclusion: 'Exclusion',
  renuncia: 'Renuncia',
  migracion_sistema: 'Migrado al sistema',
  alta: 'Alta',
  recategorizacion: 'Recategorizacion',
  migracion: 'Migracion'
}

/**
 * Timeline de historial de categorias
 */
export function FichaHistorialCategorias({ historial = [], categoriaActual }) {
  if (!historial || historial.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Sin historial de categorias</p>
      </div>
    )
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatMonto = (monto) => {
    if (!monto) return '-'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(monto)
  }

  // Determinar tendencia entre categorias
  const getTendencia = (catActual, catAnterior) => {
    if (!catActual || !catAnterior) return null
    const categorias = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
    const idxActual = categorias.indexOf(catActual)
    const idxAnterior = categorias.indexOf(catAnterior)
    if (idxActual > idxAnterior) return 'up'
    if (idxActual < idxAnterior) return 'down'
    return 'same'
  }

  return (
    <div className="space-y-4">
      {/* Categoria actual destacada */}
      {categoriaActual && (
        <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-lg p-4 border border-violet-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-violet-600 font-medium">Categoria actual</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold text-violet-700">{categoriaActual}</span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              {historial[0]?.fecha_desde && (
                <span>Desde {formatDate(historial[0].fecha_desde)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {historial.map((item, index) => {
          const siguienteItem = historial[index + 1]
          const tendencia = siguienteItem ? getTendencia(item.categoria, siguienteItem.categoria) : null

          return (
            <div key={item.id} className="relative pl-8 pb-6 last:pb-0">
              {/* Linea vertical */}
              {index < historial.length - 1 && (
                <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200" />
              )}

              {/* Punto */}
              <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                index === 0
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {tendencia === 'up' && <TrendingUp className="w-3 h-3" />}
                {tendencia === 'down' && <TrendingDown className="w-3 h-3" />}
                {tendencia === 'same' && <Minus className="w-3 h-3" />}
                {!tendencia && <span className="text-xs font-bold">{item.categoria}</span>}
              </div>

              {/* Contenido */}
              <div className={`bg-white rounded-lg border p-3 ${
                index === 0 ? 'border-violet-200' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-violet-700' : 'text-gray-700'
                      }`}>
                        Categoria {item.categoria}
                      </span>
                      {item.tope_vigente && (
                        <span className="text-xs text-gray-500">
                          (Tope: {formatMonto(item.tope_vigente)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {formatDate(item.fecha_desde)}
                        {item.fecha_hasta ? ` - ${formatDate(item.fecha_hasta)}` : ' - Actual'}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.motivo === 'alta_inicial' || item.motivo === 'alta'
                      ? 'bg-green-100 text-green-700'
                      : item.motivo?.includes('recategorizacion')
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {MOTIVOS_LABELS[item.motivo] || item.motivo || 'Sin motivo'}
                  </span>
                </div>

                {item.notas && (
                  <p className="text-sm text-gray-500 mt-2 italic">
                    {item.notas}
                  </p>
                )}

                {item.created_by_profile && (
                  <p className="text-xs text-gray-400 mt-2">
                    Registrado por: {item.created_by_profile.nombre} {item.created_by_profile.apellido}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
