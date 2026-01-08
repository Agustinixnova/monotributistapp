import { useState } from 'react'
import { Plus, Edit2, Trash2, FolderOpen, Loader2, AlertCircle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { CategoriaForm } from './CategoriaForm'
import { useCategorias } from '../hooks/useCategorias'

/**
 * Lista y gestion de categorias
 */
export function CategoriasList() {
  const { categorias, cargando, error, crear, actualizar, eliminar, guardando } = useCategorias()
  const [modalOpen, setModalOpen] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleNueva = () => {
    setCategoriaEditando(null)
    setModalOpen(true)
  }

  const handleEditar = (categoria) => {
    setCategoriaEditando(categoria)
    setModalOpen(true)
  }

  const handleGuardar = async (datos) => {
    try {
      if (categoriaEditando) {
        await actualizar(categoriaEditando.id, datos)
      } else {
        await crear(datos)
      }
      setModalOpen(false)
      setCategoriaEditando(null)
    } catch (err) {
      console.error('Error guardando categoria:', err)
    }
  }

  const handleEliminar = async (id) => {
    try {
      setEliminando(id)
      await eliminar(id)
      setConfirmDelete(null)
    } catch (err) {
      console.error('Error eliminando categoria:', err)
    } finally {
      setEliminando(null)
    }
  }

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

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
        <button
          onClick={handleNueva}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva categoria
        </button>
      </div>

      {/* Lista de categorias */}
      {categorias.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No hay categorias</p>
          <button
            onClick={handleNueva}
            className="text-violet-600 hover:text-violet-700 text-sm font-medium"
          >
            Crear la primera categoria
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {categorias.map((categoria) => {
            const Icon = categoria.icono
              ? LucideIcons[categoria.icono] || LucideIcons.BookOpen
              : LucideIcons.BookOpen

            return (
              <div
                key={categoria.id}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Icono y color */}
                <div className={`p-2 rounded-lg ${getColorClasses(categoria.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{categoria.nombre}</h3>
                  {categoria.descripcion && (
                    <p className="text-sm text-gray-500 truncate">{categoria.descripcion}</p>
                  )}
                </div>

                {/* Orden */}
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  #{categoria.orden}
                </span>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditar(categoria)}
                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {confirmDelete === categoria.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEliminar(categoria.id)}
                        disabled={eliminando === categoria.id}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {eliminando === categoria.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Si'
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(categoria.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de formulario */}
      {modalOpen && (
        <CategoriaForm
          categoria={categoriaEditando}
          onSave={handleGuardar}
          onClose={() => {
            setModalOpen(false)
            setCategoriaEditando(null)
          }}
          guardando={guardando}
        />
      )}
    </div>
  )
}
