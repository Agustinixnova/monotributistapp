import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'

/**
 * Selector de módulos de la app
 */
export function SelectorModulo({ value, onChange, className = '' }) {
  const [modulos, setModulos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('modules')
        .select('id, name, icon')
        .eq('is_active', true)
        .order('display_order')

      setModulos(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={loading}
      className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${className}`}
    >
      <option value="">Seleccionar módulo...</option>
      {modulos.map(m => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  )
}

export default SelectorModulo
