/**
 * Modal de configuración para gestionar categorías, métodos de pago y configuración general
 */

import { useState, useEffect } from 'react'
import { X, Plus, Edit2, Trash2, Settings, Store, Check } from 'lucide-react'
import IconoDinamico from './IconoDinamico'
import ModalCategoria from './ModalCategoria'
import ModalMetodoPago from './ModalMetodoPago'
import { useCategorias } from '../hooks/useCategorias'
import { useMetodosPago } from '../hooks/useMetodosPago'
import { useConfiguracion } from '../hooks/useConfiguracion'

export default function ModalConfiguracion({ isOpen, onClose, onConfigChange }) {
  const [tab, setTab] = useState('general') // 'general' | 'categorias' | 'metodos'
  const [modalCategoria, setModalCategoria] = useState(false)
  const [modalMetodoPago, setModalMetodoPago] = useState(false)
  const [categoriaEditar, setCategoriaEditar] = useState(null)
  const [metodoEditar, setMetodoEditar] = useState(null)

  // Configuración general
  const { configuracion, nombreNegocio, actualizarNombreNegocio, loading: loadingConfig } = useConfiguracion()
  const [nombreNegocioInput, setNombreNegocioInput] = useState('')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [nombreGuardado, setNombreGuardado] = useState(false)

  const { categorias, crear: crearCategoria, actualizar: actualizarCategoria, eliminar: eliminarCategoria } = useCategorias()
  const { metodos: metodosPago, crear: crearMetodo, actualizar: actualizarMetodo, eliminar: eliminarMetodo } = useMetodosPago()

  // Sincronizar input con valor guardado
  useEffect(() => {
    if (isOpen && nombreNegocio) {
      setNombreNegocioInput(nombreNegocio)
      setNombreGuardado(false)
    }
  }, [isOpen, nombreNegocio])

  const handleGuardarNombre = async () => {
    if (!nombreNegocioInput.trim()) return

    setGuardandoNombre(true)
    const result = await actualizarNombreNegocio(nombreNegocioInput.trim())
    setGuardandoNombre(false)

    if (result.success) {
      setNombreGuardado(true)
      // Notificar al padre que cambió la configuración
      if (onConfigChange) {
        onConfigChange({ nombreNegocio: nombreNegocioInput.trim() })
      }
      setTimeout(() => setNombreGuardado(false), 2000)
    }
  }

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
                  onClick={() => setTab('general')}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    tab === 'general'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setTab('categorias')}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    tab === 'categorias'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Categorías
                </button>
                <button
                  onClick={() => setTab('metodos')}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    tab === 'metodos'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Métodos
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Tab General */}
              {tab === 'general' && (
                <div className="space-y-6">
                  {/* Nombre del negocio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del negocio
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Este nombre aparecerá en los PDF de cierre de caja
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={nombreNegocioInput}
                          onChange={(e) => setNombreNegocioInput(e.target.value)}
                          placeholder="Ej: Kiosco Don Pedro"
                          maxLength={100}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                      </div>
                      <button
                        onClick={handleGuardarNombre}
                        disabled={guardandoNombre || nombreNegocioInput === nombreNegocio}
                        className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                          nombreGuardado
                            ? 'bg-emerald-100 text-emerald-700'
                            : nombreNegocioInput === nombreNegocio
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-violet-600 hover:bg-violet-700 text-white'
                        }`}
                      >
                        {nombreGuardado ? (
                          <>
                            <Check className="w-4 h-4" />
                            Guardado
                          </>
                        ) : guardandoNombre ? (
                          'Guardando...'
                        ) : (
                          'Guardar'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Información</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>El nombre del negocio se muestra en el encabezado del PDF de cierre</li>
                      <li>Podés cambiarlo en cualquier momento</li>
                    </ul>
                  </div>
                </div>
              )}

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
