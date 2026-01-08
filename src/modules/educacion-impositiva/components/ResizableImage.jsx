import { useState, useCallback } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Maximize2, Minimize2, Trash2 } from 'lucide-react'

/**
 * Componente de imagen redimensionable para TipTap
 */
export function ResizableImageComponent({ node, updateAttributes, deleteNode, selected }) {
  const [isResizing, setIsResizing] = useState(false)
  const { src, alt, width } = node.attrs

  const sizes = [
    { label: 'S', value: '25%' },
    { label: 'M', value: '50%' },
    { label: 'L', value: '75%' },
    { label: 'XL', value: '100%' }
  ]

  const handleResize = useCallback((newWidth) => {
    updateAttributes({ width: newWidth })
    setIsResizing(false)
  }, [updateAttributes])

  return (
    <NodeViewWrapper className="relative my-4">
      <div
        className={`relative inline-block max-w-full ${selected ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`}
        style={{ width: width || '100%' }}
      >
        <img
          src={src}
          alt={alt || ''}
          className="rounded-lg shadow-md w-full h-auto"
          draggable={false}
        />

        {/* Controles de edicion (solo cuando esta seleccionada) */}
        {selected && (
          <div className="absolute -top-10 left-0 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
            {/* Botones de tamaño */}
            {sizes.map((size) => (
              <button
                key={size.value}
                onClick={() => handleResize(size.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  width === size.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={`Tamaño ${size.label}`}
              >
                {size.label}
              </button>
            ))}

            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* Eliminar */}
            <button
              onClick={deleteNode}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Eliminar imagen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
