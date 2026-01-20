/**
 * Modal de configuración para gestionar categorías, métodos de pago, empleados y configuración general
 */

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Edit2, Trash2, Settings, Store, Check, Users, Shield, UserX, UserCheck, QrCode, CreditCard, Upload, Image, UserPlus, Phone, History } from 'lucide-react'
import IconoDinamico from './IconoDinamico'
import ModalCategoria from './ModalCategoria'
import ModalMetodoPago from './ModalMetodoPago'
import ModalEmpleado from './ModalEmpleado'
import ModalPermisos from './ModalPermisos'
import ModalConfirmacion from './ModalConfirmacion'
import ModalClienteFiado from './ModalClienteFiado'
import ModalFichaCliente from './ModalFichaCliente'
import { useCategorias } from '../hooks/useCategorias'
import { useMetodosPago } from '../hooks/useMetodosPago'
import { useConfiguracion } from '../hooks/useConfiguracion'
import { useEmpleados } from '../hooks/useEmpleados'
import { usePermisosCaja } from '../hooks/usePermisosCaja'
import { useAliasPago } from '../hooks/useAliasPago'
import { useClientesFiado } from '../hooks/useClientesFiado'
import { formatearMonto } from '../utils/formatters'

export default function ModalConfiguracion({ isOpen, onClose, onConfigChange }) {
  const [tab, setTab] = useState('general') // 'general' | 'categorias' | 'metodos' | 'empleados' | 'pagos'
  const [modalCategoria, setModalCategoria] = useState(false)
  const [modalMetodoPago, setModalMetodoPago] = useState(false)
  const [modalEmpleado, setModalEmpleado] = useState(false)
  const [modalPermisos, setModalPermisos] = useState(false)
  const [modalClienteFiado, setModalClienteFiado] = useState(false)
  const [categoriaEditar, setCategoriaEditar] = useState(null)
  const [metodoEditar, setMetodoEditar] = useState(null)
  const [empleadoPermisos, setEmpleadoPermisos] = useState(null)
  const [clienteFiadoEditar, setClienteFiadoEditar] = useState(null)
  const [clienteFichaSeleccionado, setClienteFichaSeleccionado] = useState(null)
  const [clientesDeudas, setClientesDeudas] = useState({})

  // Estados para alias
  const [nuevoAlias, setNuevoAlias] = useState({ nombre: '', alias: '', banco: '' })
  const [aliasEditando, setAliasEditando] = useState(null)
  const [guardandoAlias, setGuardandoAlias] = useState(false)
  const [subiendoQR, setSubiendoQR] = useState(false)
  const [confirmEliminarQR, setConfirmEliminarQR] = useState(false)
  const [eliminandoQR, setEliminandoQR] = useState(false)
  const fileInputRef = useRef(null)

  // Configuración general
  const { configuracion, nombreNegocio, qrUrl, actualizarNombreNegocio, refresh: refreshConfig, loading: loadingConfig } = useConfiguracion()

  // Alias de pago
  const { alias: aliasPago, crear: crearAlias, actualizar: actualizarAlias, eliminar: eliminarAlias, subirQR, eliminarQR } = useAliasPago()

  // Empleados (solo se carga si el usuario es dueño)
  const { empleados, crear: crearEmpleado, actualizarPermisos, toggleActivo, eliminar: eliminarEmpleado, loading: loadingEmpleados } = useEmpleados()
  const { esDuenio, puede } = usePermisosCaja()
  const [nombreNegocioInput, setNombreNegocioInput] = useState('')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [nombreGuardado, setNombreGuardado] = useState(false)

  const { categorias, crear: crearCategoria, actualizar: actualizarCategoria, eliminar: eliminarCategoria } = useCategorias()
  const { metodos: metodosPago, crear: crearMetodo, actualizar: actualizarMetodo, eliminar: eliminarMetodo } = useMetodosPago()

  // Clientes fiado
  const { clientes: clientesFiado, crear: crearClienteFiado, actualizar: actualizarClienteFiado, eliminar: eliminarClienteFiado, obtenerDeuda, loading: loadingClientesFiado } = useClientesFiado()

  // Cargar deudas de clientes fiado cuando se abre el tab
  useEffect(() => {
    if (isOpen && tab === 'fiados' && clientesFiado.length > 0) {
      const cargarDeudas = async () => {
        const deudas = {}
        for (const cliente of clientesFiado) {
          const { deuda } = await obtenerDeuda(cliente.id)
          deudas[cliente.id] = deuda || 0
        }
        setClientesDeudas(deudas)
      }
      cargarDeudas()
    }
  }, [isOpen, tab, clientesFiado, obtenerDeuda])

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

  // Handlers para clientes fiado
  const handleGuardarClienteFiado = async (data) => {
    if (clienteFiadoEditar) {
      await actualizarClienteFiado(clienteFiadoEditar.id, data)
    } else {
      await crearClienteFiado(data)
    }
    setModalClienteFiado(false)
    setClienteFiadoEditar(null)
  }

  const handleEditarClienteFiado = (cliente) => {
    setClienteFiadoEditar(cliente)
    setModalClienteFiado(true)
  }

  const handleEliminarClienteFiado = async (id) => {
    if (confirm('¿Desactivar este cliente? Ya no aparecerá en la lista de cuenta corriente.')) {
      await eliminarClienteFiado(id)
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
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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

            {/* Tabs - scroll horizontal en móviles */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <div className="flex min-w-max">
                <button
                  onClick={() => setTab('general')}
                  className={`px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${
                    tab === 'general'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setTab('categorias')}
                  className={`px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${
                    tab === 'categorias'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Categorías
                </button>
                <button
                  onClick={() => setTab('metodos')}
                  className={`px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${
                    tab === 'metodos'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Métodos
                </button>
                <button
                  onClick={() => setTab('fiados')}
                  className={`px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${
                    tab === 'fiados'
                      ? 'text-violet-600 border-b-2 border-violet-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Clientes Cta. Cte.
                </button>
                {esDuenio && (
                  <button
                    onClick={() => setTab('pagos')}
                    className={`px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${
                      tab === 'pagos'
                        ? 'text-violet-600 border-b-2 border-violet-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    QR/Alias
                  </button>
                )}
                {esDuenio && (
                  <button
                    onClick={() => setTab('empleados')}
                    className={`px-4 py-3 font-medium transition-colors whitespace-nowrap text-sm ${
                      tab === 'empleados'
                        ? 'text-violet-600 border-b-2 border-violet-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Empleados
                  </button>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Tab General */}
              {tab === 'general' && (
                <div className="space-y-6">
                  {/* Nombre del negocio */}
                  {puede.cambiarNombreNegocio ? (
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
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del negocio
                      </label>
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                        <Store className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{nombreNegocio || 'Sin nombre'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Solo el dueño puede modificar el nombre del negocio
                      </p>
                    </div>
                  )}

                  {/* Info adicional */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Información</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>El nombre del negocio se muestra en el encabezado del PDF de cierre</li>
                      {puede.cambiarNombreNegocio && <li>Podés cambiarlo en cualquier momento</li>}
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
                    {puede.agregarCategorias && (
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
                    )}
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
                    {puede.agregarMetodosPago && (
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
                    )}
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

              {/* Tab Clientes Cta. Cte. */}
              {tab === 'fiados' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Clientes con cuenta corriente
                    </p>
                    <button
                      onClick={() => {
                        setClienteFiadoEditar(null)
                        setModalClienteFiado(true)
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
                    >
                      <UserPlus className="w-4 h-4" />
                      Nuevo cliente
                    </button>
                  </div>

                  {loadingClientesFiado ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-violet-600 border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : clientesFiado.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No tenés clientes registrados</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Agregá clientes para poder registrar ventas fiadas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientesFiado.map(cliente => {
                        const deuda = clientesDeudas[cliente.id] || 0
                        return (
                          <div
                            key={cliente.id}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-violet-300 transition-colors"
                          >
                            {/* Área clickeable para abrir ficha */}
                            <button
                              onClick={() => setClienteFichaSeleccionado(cliente)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              {/* Avatar */}
                              <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-violet-600 font-medium">
                                  {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0) || ''}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {cliente.nombre} {cliente.apellido || ''}
                                </div>
                                {cliente.telefono && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {cliente.telefono}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400 flex items-center gap-2">
                                  {cliente.limite_credito ? (
                                    <span>Límite: {formatearMonto(cliente.limite_credito)}</span>
                                  ) : (
                                    <span>Sin límite</span>
                                  )}
                                  {deuda > 0 ? (
                                    <span className="text-red-600 font-medium">
                                      Deuda: {formatearMonto(deuda)}
                                    </span>
                                  ) : deuda < 0 ? (
                                    <span className="text-blue-600 font-medium">
                                      A favor: {formatearMonto(Math.abs(deuda))}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </button>

                            {/* Acciones */}
                            <button
                              onClick={() => handleEditarClienteFiado(cliente)}
                              className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminarClienteFiado(cliente.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Desactivar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Info */}
                  <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-700">
                    <p className="font-medium mb-1">Sobre cuenta corriente:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-600">
                      <li>Las cuentas corrientes NO se registran en la caja del día</li>
                      <li>Solo registran la deuda del cliente</li>
                      <li>Al cobrar una deuda, se genera una entrada en caja</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab Pagos QR */}
              {tab === 'pagos' && esDuenio && (
                <div className="space-y-6">
                  {/* Sección QR */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-violet-600" />
                      Código QR de pago
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Subí una imagen o PDF de tu QR para que los clientes puedan escanearlo
                    </p>

                    {qrUrl ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                          {qrUrl.toLowerCase().endsWith('.pdf') || qrUrl.includes('.pdf?') ? (
                            <div className="w-48 h-48 flex flex-col items-center justify-center gap-3">
                              <Image className="w-12 h-12 text-gray-400" />
                              <span className="text-sm text-gray-600">PDF cargado</span>
                              <a
                                href={qrUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-violet-600 hover:underline"
                              >
                                Ver archivo
                              </a>
                            </div>
                          ) : (
                            <img
                              src={qrUrl}
                              alt="QR de pago"
                              className="w-48 h-48 object-contain"
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg text-sm font-medium"
                          >
                            Cambiar archivo
                          </button>
                          <button
                            onClick={() => setConfirmEliminarQR(true)}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={subiendoQR}
                        className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors"
                      >
                        {subiendoQR ? (
                          <div className="animate-spin h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-gray-400" />
                            <span className="text-gray-600 font-medium">
                              Subir QR (imagen o PDF)
                            </span>
                            <span className="text-xs text-gray-400">
                              PNG, JPG o PDF hasta 10MB
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            alert('El archivo no puede superar 10MB')
                            return
                          }
                          setSubiendoQR(true)
                          const result = await subirQR(file)
                          setSubiendoQR(false)
                          if (result.data) {
                            await refreshConfig()
                          } else if (result.error) {
                            alert('Error al subir imagen: ' + result.error.message)
                          }
                        }
                        e.target.value = ''
                      }}
                    />
                  </div>

                  {/* Separador */}
                  <div className="border-t border-gray-200" />

                  {/* Sección Alias */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-violet-600" />
                      Alias de pago
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Agregá tus alias de Mercado Pago, banco, etc. para que los clientes puedan transferirte
                    </p>

                    {/* Lista de alias existentes */}
                    {aliasPago.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {aliasPago.map(a => (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-violet-300"
                          >
                            <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">{a.nombre}</div>
                              <div className="text-sm text-violet-600 font-mono truncate">{a.alias}</div>
                              {a.banco && <div className="text-xs text-gray-500">{a.banco}</div>}
                            </div>
                            <button
                              onClick={() => setAliasEditando(a)}
                              className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('¿Eliminar este alias?')) {
                                  await eliminarAlias(a.id)
                                }
                              }}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario para nuevo alias */}
                    {aliasEditando ? (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h5 className="font-medium text-gray-700">Editar alias</h5>
                        <input
                          type="text"
                          placeholder="Nombre (ej: Mercado Pago)"
                          value={aliasEditando.nombre}
                          onChange={(e) => setAliasEditando({ ...aliasEditando, nombre: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Alias (ej: mi.negocio.mp)"
                          value={aliasEditando.alias}
                          onChange={(e) => setAliasEditando({ ...aliasEditando, alias: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Banco (opcional)"
                          value={aliasEditando.banco || ''}
                          onChange={(e) => setAliasEditando({ ...aliasEditando, banco: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAliasEditando(null)}
                            className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={async () => {
                              if (!aliasEditando.nombre || !aliasEditando.alias) return
                              setGuardandoAlias(true)
                              await actualizarAlias(aliasEditando.id, aliasEditando)
                              setGuardandoAlias(false)
                              setAliasEditando(null)
                            }}
                            disabled={guardandoAlias || !aliasEditando.nombre || !aliasEditando.alias}
                            className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:bg-violet-400"
                          >
                            {guardandoAlias ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h5 className="font-medium text-gray-700">Agregar nuevo alias</h5>
                        <input
                          type="text"
                          placeholder="Nombre (ej: Mercado Pago)"
                          value={nuevoAlias.nombre}
                          onChange={(e) => setNuevoAlias({ ...nuevoAlias, nombre: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Alias (ej: mi.negocio.mp)"
                          value={nuevoAlias.alias}
                          onChange={(e) => setNuevoAlias({ ...nuevoAlias, alias: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Banco (opcional)"
                          value={nuevoAlias.banco}
                          onChange={(e) => setNuevoAlias({ ...nuevoAlias, banco: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          onClick={async () => {
                            if (!nuevoAlias.nombre || !nuevoAlias.alias) return
                            setGuardandoAlias(true)
                            await crearAlias(nuevoAlias)
                            setGuardandoAlias(false)
                            setNuevoAlias({ nombre: '', alias: '', banco: '' })
                          }}
                          disabled={guardandoAlias || !nuevoAlias.nombre || !nuevoAlias.alias}
                          className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:bg-violet-400 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {guardandoAlias ? 'Agregando...' : 'Agregar alias'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                    <p className="font-medium mb-1">Sobre QR y Alias:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-600">
                      <li>El QR y alias se muestran con el botón de pago en la caja</li>
                      <li>Ideal para mostrar a clientes que quieren transferir</li>
                      <li>Podés agregar varios alias si tenés múltiples cuentas</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab Empleados */}
              {tab === 'empleados' && esDuenio && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Empleados que acceden a tu caja
                    </p>
                    <button
                      onClick={() => setModalEmpleado(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar empleado
                    </button>
                  </div>

                  {loadingEmpleados ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-violet-600 border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : empleados.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No tenés empleados todavía</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Agregá empleados para que puedan registrar movimientos en tu caja
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {empleados.map(emp => (
                        <div
                          key={emp.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg ${
                            emp.activo
                              ? 'border-gray-200 hover:border-violet-300'
                              : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-violet-600 font-medium">
                              {emp.nombre?.charAt(0)}{emp.apellido?.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {emp.nombre} {emp.apellido}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{emp.email}</div>
                            <div className="text-xs text-gray-400">{emp.whatsapp}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Botón permisos */}
                            <button
                              onClick={() => {
                                setEmpleadoPermisos(emp)
                                setModalPermisos(true)
                              }}
                              className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                              title="Editar permisos"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            {/* Botón activar/desactivar */}
                            <button
                              onClick={() => toggleActivo(emp.id, !emp.activo)}
                              className={`p-2 rounded-lg ${
                                emp.activo
                                  ? 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={emp.activo ? 'Desactivar' : 'Activar'}
                            >
                              {emp.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            {/* Botón eliminar */}
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar este empleado? Ya no podrá acceder a tu caja.')) {
                                  eliminarEmpleado(emp.id)
                                }
                              }}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Info */}
                  <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                    <p className="font-medium mb-1">Sobre los empleados:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-600">
                      <li>Los empleados acceden con su email y contraseña</li>
                      <li>Ven la misma caja que vos, pero con permisos limitados</li>
                      <li>Podés configurar qué acciones pueden realizar</li>
                    </ul>
                  </div>
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

      <ModalEmpleado
        isOpen={modalEmpleado}
        onClose={() => setModalEmpleado(false)}
        onGuardar={crearEmpleado}
      />

      <ModalPermisos
        isOpen={modalPermisos}
        onClose={() => {
          setModalPermisos(false)
          setEmpleadoPermisos(null)
        }}
        empleado={empleadoPermisos}
        onGuardar={actualizarPermisos}
      />

      <ModalClienteFiado
        isOpen={modalClienteFiado}
        onClose={() => {
          setModalClienteFiado(false)
          setClienteFiadoEditar(null)
        }}
        onGuardar={handleGuardarClienteFiado}
        cliente={clienteFiadoEditar}
      />

      {/* Modal Ficha Cliente */}
      <ModalFichaCliente
        isOpen={!!clienteFichaSeleccionado}
        onClose={() => setClienteFichaSeleccionado(null)}
        cliente={clienteFichaSeleccionado}
        onEditar={(cliente) => {
          setClienteFichaSeleccionado(null)
          handleEditarClienteFiado(cliente)
        }}
      />

      {/* Modal Confirmación - Eliminar QR */}
      <ModalConfirmacion
        isOpen={confirmEliminarQR}
        onClose={() => setConfirmEliminarQR(false)}
        onConfirm={async () => {
          setEliminandoQR(true)
          await eliminarQR()
          await refreshConfig()
          setEliminandoQR(false)
          setConfirmEliminarQR(false)
        }}
        titulo="¿Eliminar QR?"
        mensaje="Se eliminará el código QR de pago. Podrás subir uno nuevo en cualquier momento."
        textoConfirmar="Eliminar"
        variante="danger"
        loading={eliminandoQR}
      />
    </>
  )
}
