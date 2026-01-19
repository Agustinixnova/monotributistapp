/**
 * Modal de configuración para gestionar categorías y métodos de pago personalizados
 */

import { useState } from 'react'
import { X, Plus, Edit2, Trash2, Settings } from 'lucide-react'
import IconoDinamico from './IconoDinamico'
import ModalCategoria from './ModalCategoria'
import ModalMetodoPago from './ModalMetodoPago'
import { useCategorias } from '../hooks/useCategorias'
import { useMetodosPago } from '../hooks/useMetodosPago'

export default function ModalConfiguracion({ isOpen, onClose }) {
  const [tab, setTab] = useState('categorias') // 'categorias' | 'metodos'
  const [modalCategoria, setModalCategoria] = useState(false)
  const [modalMetodoPago, setModalMetodoPago] = useState(false)
  const [categoriaEditar, setCategoriaEditar] = useState(null)
  const [metodoEditar, setMetodoEditar] = useState(null)

  const { categorias, crear: crearCategoria, actualizar: actualizarCategoria, eliminar: eliminarCategoria } = useCategorias()
  const { metodos: metodosPago, crear: crearMetodo, actualizar: actualizarMetodo, eliminar: eliminarMetodo } = useMetodosPago()

  // Filtrar solo personalizados
  const categoriasPersonalizadas = categorias.filter(c => !c.es_sistema)
  const metodosPersonalizados = metodosPago.filter(m => !m.es_sistema)

  const handleGuardarCategoria = async (data) => {
    if (categoriaEditar) {
      await actualizarCategoria(categoriaEditar.id, data)
    } else {
      await crearCategoria(data)
    }
    setModalCategoria(false)
    setCategoriaEditar(null)
  }

  const handleGuardarMetodo = async (data) => {
    if (metodoEditar) {
      await actualizarMetodo(metodoEditar.id, data)
    } else {
      await crearMetodo(data)
    }
    setModalMetodoPago(false)
    setMetodoEditar(null)
  }

  const handleEditarCategoria = (categoria) => {
    setCategoriaEditar(categoria)
    setModalCategoria(true)
  }

  const handleEditarMetodo = (metodo) => {
    setMetodoEditar(metodo)
    setModalMetodoPago(true)
  }

  const handleEliminarCategoria = async (id) => {
    if (confirm('¿Eliminar esta categoría?')) {
      await eliminarCategoria(id)
    }
  }

  const handleEliminarMetodo = async (id) => {
    if (confirm('¿Eliminar este método de pago?')) {
      await eliminarMetodo(id)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-violet-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <h3 className="font-heading font-semibold text-lg">Configuración</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setTab('categorias')}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    tab === 'categorias'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Categorías ({categoriasPersonalizadas.length})
                </button>
                <button
                  onClick={() => setTab('metodos')}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    tab === 'metodos'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Métodos de pago ({metodosPersonalizados.length})
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Tab Categorías */}
              {tab === 'categorias' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Tus categorías personalizadas
                    </p>
                    <button
                      onClick={() => {
                        setCategoriaEditar(null)
                        setModalCategoria(true)
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Nueva categoría
                    </button>
                  </div>

                  {categoriasPersonalizadas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No tenés categorías personalizadas todavía
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoriasPersonalizadas.map(cat => (
                        <div
                          key={cat.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-violet-300"
                        >
                          <IconoDinamico nombre={cat.icono} className="w-6 h-6 text-gray-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{cat.nombre}</div>
                            <div className="text-xs text-gray-500">
                              {cat.tipo === 'entrada' && 'Entrada'}
                              {cat.tipo === 'salida' && 'Salida'}
                              {cat.tipo === 'ambos' && 'Entrada/Salida'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditarCategoria(cat)}
                            className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarCategoria(cat.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Métodos de pago */}
              {tab === 'metodos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Tus métodos de pago personalizados
                    </p>
                    <button
                      onClick={() => {
                        setMetodoEditar(null)
                        setModalMetodoPago(true)
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo método
                    </button>
                  </div>

                  {metodosPersonalizados.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No tenés métodos de pago personalizados todavía
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {metodosPersonalizados.map(metodo => (
                        <div
                          key={metodo.id}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-violet-300"
                        >
                          <IconoDinamico nombre={metodo.icono} className="w-6 h-6 text-gray-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{metodo.nombre}</div>
                            <div className="text-xs text-gray-500">
                              {metodo.es_efectivo ? 'Efectivo' : 'Digital'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditarMetodo(metodo)}
                            className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarMetodo(metodo.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-4">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales de creación/edición */}
      <ModalCategoria
        isOpen={modalCategoria}
        onClose={() => {
          setModalCategoria(false)
          setCategoriaEditar(null)
        }}
        onGuardar={handleGuardarCategoria}
        categoria={categoriaEditar}
      />

      <ModalMetodoPago
        isOpen={modalMetodoPago}
        onClose={() => {
          setModalMetodoPago(false)
          setMetodoEditar(null)
        }}
        onGuardar={handleGuardarMetodo}
        metodo={metodoEditar}
      />
    </>
  )
}
