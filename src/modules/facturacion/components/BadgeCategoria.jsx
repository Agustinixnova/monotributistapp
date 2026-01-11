import { useState } from 'react'
import { ModalCambiarCategoria } from './ModalCambiarCategoria'
import { getCategoriaColorWithBorder } from '../../../utils/categoriaColors'

/**
 * Badge de categoria con color segun la categoria (A-K)
 * Click para abrir modal de cambio de categoria
 *
 * @param {Object} cliente - Datos del cliente (debe tener categoria_monotributo, tipo_actividad, etc)
 * @param {number} porcentajeUso - Porcentaje de uso del tope (0-100+) - ya no afecta el color
 * @param {boolean} clickable - Si permite click para abrir modal (default: true)
 * @param {string} size - Tamaño: 'sm' | 'md' | 'lg' (default: 'sm')
 * @param {Function} onCategoriaChanged - Callback cuando cambia la categoria
 */
export function BadgeCategoria({
  cliente,
  porcentajeUso = 0,
  clickable = true,
  size = 'sm',
  onCategoriaChanged
}) {
  const [showModal, setShowModal] = useState(false)

  if (!cliente?.categoria_monotributo) return null

  // Tamaños con touch targets apropiados para mobile
  const getSizeClasses = () => {
    switch (size) {
      case 'lg':
        return 'px-3 py-2.5 min-h-[44px] text-base font-bold'
      case 'md':
        return 'px-2.5 py-2 min-h-[44px] text-sm font-bold'
      default:
        return 'px-2.5 py-2 min-h-[44px] text-xs font-bold'
    }
  }

  const handleClick = (e) => {
    if (!clickable) return
    // Prevenir navegación del Link padre y propagación
    e.preventDefault()
    e.stopPropagation()
    // También prevenir el evento nativo touch en mobile
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation()
    }
    setShowModal(true)
  }

  const handleSuccess = (nuevaCategoria) => {
    onCategoriaChanged?.(nuevaCategoria)
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!clickable}
        className={`
          inline-flex items-center rounded border transition-colors
          ${getCategoriaColorWithBorder(cliente.categoria_monotributo)}
          ${getSizeClasses()}
          ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
        `}
        title={clickable ? 'Click para cambiar categoria' : `Categoria ${cliente.categoria_monotributo}`}
      >
        {cliente.categoria_monotributo}
      </button>

      {showModal && (
        <ModalCambiarCategoria
          cliente={cliente}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

/**
 * Badge simple sin modal (para contextos donde no se permite editar)
 */
export function BadgeCategoriaSimple({ categoria, size = 'sm' }) {
  if (!categoria) return null

  const getSizeClasses = () => {
    switch (size) {
      case 'lg': return 'px-3 py-2.5 min-h-[44px] text-base font-bold'
      case 'md': return 'px-2.5 py-2 min-h-[44px] text-sm font-bold'
      default: return 'px-2.5 py-2 min-h-[44px] text-xs font-bold'
    }
  }

  return (
    <span className={`inline-flex items-center rounded ${getCategoriaColorWithBorder(categoria)} ${getSizeClasses()}`}>
      {categoria}
    </span>
  )
}

export default BadgeCategoria
