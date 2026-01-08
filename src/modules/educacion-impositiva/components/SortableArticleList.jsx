import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Edit2, Trash2, Eye, EyeOff, Star, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as LucideIcons from 'lucide-react'

/**
 * Item sorteable individual
 */
function SortableItem({ articulo, onToggleEstado, onToggleDestacado, onEliminar, eliminando }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: articulo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const CategoriaIcon = articulo.categoria?.icono
    ? LucideIcons[articulo.categoria.icono] || LucideIcons.BookOpen
    : LucideIcons.BookOpen

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      amber: 'bg-amber-100 text-amber-700',
      purple: 'bg-purple-100 text-purple-700',
      red: 'bg-red-100 text-red-700',
      violet: 'bg-violet-100 text-violet-700',
      pink: 'bg-pink-100 text-pink-700',
      teal: 'bg-teal-100 text-teal-700'
    }
    return colors[color] || colors.violet
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${
        isDragging
          ? 'border-violet-400 shadow-lg opacity-90'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Handle de arrastre */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Estado publicado/borrador */}
      <button
        onClick={() => onToggleEstado(articulo.id, articulo.estado)}
        className={`p-1.5 rounded transition-colors ${
          articulo.estado === 'publicado'
            ? 'text-green-600 hover:bg-green-50'
            : 'text-gray-400 hover:bg-gray-100'
        }`}
        title={articulo.estado === 'publicado' ? 'Publicado - Click para ocultar' : 'Borrador - Click para publicar'}
      >
        {articulo.estado === 'publicado' ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </button>

      {/* Info del articulo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">{articulo.titulo}</h3>
          {articulo.categoria && (
            <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getColorClasses(articulo.categoria.color)}`}>
              <CategoriaIcon className="w-3 h-3" />
              {articulo.categoria.nombre}
            </span>
          )}
        </div>
        {articulo.resumen && (
          <p className="text-sm text-gray-500 truncate mt-0.5">{articulo.resumen}</p>
        )}
      </div>

      {/* Destacado */}
      <button
        onClick={() => onToggleDestacado(articulo.id, !articulo.destacado)}
        className={`p-1.5 rounded transition-colors ${
          articulo.destacado
            ? 'text-amber-500 hover:bg-amber-50'
            : 'text-gray-300 hover:text-amber-400 hover:bg-gray-100'
        }`}
        title={articulo.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}
      >
        <Star className={`w-4 h-4 ${articulo.destacado ? 'fill-current' : ''}`} />
      </button>

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <Link
          to={`/educacion/admin/editar/${articulo.id}`}
          className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </Link>

        <button
          onClick={() => onEliminar(articulo.id)}
          disabled={eliminando === articulo.id}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Eliminar"
        >
          {eliminando === articulo.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}

/**
 * Lista ordenable de articulos con drag & drop
 */
export function SortableArticleList({
  articulos,
  onReorder,
  onToggleEstado,
  onToggleDestacado,
  onEliminar
}) {
  const [eliminando, setEliminando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = articulos.findIndex(a => a.id === active.id)
      const newIndex = articulos.findIndex(a => a.id === over.id)
      const newOrder = arrayMove(articulos, oldIndex, newIndex)

      // Generar ordenamientos para guardar
      const ordenamientos = newOrder.map((art, index) => ({
        id: art.id,
        orden: index
      }))

      onReorder(ordenamientos)
    }
  }

  const handleEliminar = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }

    try {
      setEliminando(id)
      await onEliminar(id)
      setConfirmDelete(null)
    } finally {
      setEliminando(null)
    }
  }

  if (articulos.length === 0) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={articulos.map(a => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {articulos.map((articulo) => (
            <div key={articulo.id}>
              <SortableItem
                articulo={articulo}
                onToggleEstado={onToggleEstado}
                onToggleDestacado={onToggleDestacado}
                onEliminar={handleEliminar}
                eliminando={eliminando}
              />
              {/* Confirmacion de eliminacion */}
              {confirmDelete === articulo.id && (
                <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-red-700">
                    Eliminar "{articulo.titulo}"?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEliminar(articulo.id)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Si, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1 text-xs bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
