import { TIPOS_REPORTE, ESTADOS_REPORTE } from '../../utils/config'

/**
 * Filtros para la lista de reportes
 */
export function FiltrosReporte({ filtros, onChange }) {
  const handleChange = (campo, valor) => {
    onChange({ ...filtros, [campo]: valor })
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Filtro por tipo */}
      <select
        value={filtros.tipo || 'todos'}
        onChange={(e) => handleChange('tipo', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
      >
        <option value="todos">Todos los tipos</option>
        {TIPOS_REPORTE.map(t => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>

      {/* Filtro por estado */}
      <select
        value={filtros.estado || 'todos'}
        onChange={(e) => handleChange('estado', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
      >
        <option value="todos">Todos los estados</option>
        {ESTADOS_REPORTE.map(e => (
          <option key={e.id} value={e.id}>
            {e.nombre}
          </option>
        ))}
      </select>
    </div>
  )
}

export default FiltrosReporte
