import { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, MessageSquare, Search, Users, User, Paperclip, Image, FileSpreadsheet, FileText, Video, File as FileIcon } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { crearConversacion, actualizarAdjuntosConversacion } from '../services/buzonService'
import {
  getMonotributistas,
  getResponsablesInscriptos,
  getOperadoresGastos,
  getClientesAsignados,
  getTodosLosClientes,
  buscarUsuarios
} from '../services/destinatariosService'
import { subirAdjunto, validarArchivo } from '../services/adjuntosService'

export function ModalNuevoMensaje({ onClose, onSuccess }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [userRole, setUserRole] = useState(null)

  // Para adjuntos
  const [adjuntos, setAdjuntos] = useState([])
  const [isDragging, setIsDragging] = useState(false)

  // Para full_access (contadora_principal, desarrollo, comunicadora)
  const [tipoDestinatario, setTipoDestinatario] = useState('todos') // 'todos', 'monotributistas', 'responsables', 'operadores', 'especifico'
  const [destinatarioEspecifico, setDestinatarioEspecifico] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [usuariosBusqueda, setUsuariosBusqueda] = useState([])
  const [loadingBusqueda, setLoadingBusqueda] = useState(false)

  // Para contador_secundario
  const [clientesAsignados, setClientesAsignados] = useState([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  const esFullAccess = ['admin', 'contadora_principal', 'desarrollo', 'comunicadora'].includes(userRole)
  const esContadorSecundario = userRole === 'contador_secundario'
  const esCliente = ['monotributista', 'responsable_inscripto', 'operador_gastos'].includes(userRole)

  // Obtener rol del usuario
  useEffect(() => {
    async function fetchUserRole() {
      if (!user?.id) return

      const { data, error } = await supabase
        .from('profiles')
        .select('role:roles(name)')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error obteniendo rol:', error)
        return
      }

      setUserRole(data?.role?.name)
    }

    fetchUserRole()
  }, [user?.id])

  // Cargar clientes asignados si es contador secundario
  useEffect(() => {
    if (esContadorSecundario && user?.id) {
      cargarClientesAsignados()
    }
  }, [esContadorSecundario, user?.id])

  const cargarClientesAsignados = async () => {
    setLoadingClientes(true)
    try {
      const clientes = await getClientesAsignados(user.id)
      setClientesAsignados(clientes)
    } catch (err) {
      console.error('Error cargando clientes:', err)
    } finally {
      setLoadingClientes(false)
    }
  }

  // Funciones para manejo de adjuntos
  const agregarArchivos = (files) => {
    const nuevosAdjuntos = []

    for (const file of files) {
      const validacion = validarArchivo(file)
      if (!validacion.valid) {
        setError(validacion.error)
        return
      }

      // Crear preview para imágenes
      let preview = null
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      nuevosAdjuntos.push({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview
      })
    }

    setAdjuntos(prev => [...prev, ...nuevosAdjuntos])
    setError(null)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    agregarArchivos(files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    agregarArchivos(files)
  }

  const eliminarAdjunto = (index) => {
    setAdjuntos(prev => {
      const nuevo = [...prev]
      if (nuevo[index].preview) {
        URL.revokeObjectURL(nuevo[index].preview)
      }
      nuevo.splice(index, 1)
      return nuevo
    })
  }

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Video
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet
    if (type.includes('pdf') || type.includes('word') || type.includes('document')) return FileText
    return FileIcon
  }

  // Buscar usuarios cuando cambia el texto de búsqueda
  useEffect(() => {
    if (busqueda.length < 2) {
      setUsuariosBusqueda([])
      return
    }

    const timer = setTimeout(async () => {
      setLoadingBusqueda(true)
      try {
        const usuarios = esContadorSecundario
          ? await buscarUsuarios(busqueda, user.id) // Solo sus asignados
          : await buscarUsuarios(busqueda, null) // Todos

        setUsuariosBusqueda(usuarios)
      } catch (err) {
        console.error('Error buscando usuarios:', err)
      } finally {
        setLoadingBusqueda(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [busqueda, esContadorSecundario, user?.id])

  const handleEnviar = async () => {
    if (!asunto.trim()) {
      setError('El asunto es requerido')
      return
    }
    if (!mensaje.trim()) {
      setError('El mensaje es requerido')
      return
    }

    // Validar destinatarios
    if (esFullAccess && tipoDestinatario === 'especifico' && !destinatarioEspecifico) {
      setError('Selecciona un destinatario')
      return
    }
    if (esContadorSecundario && !destinatarioEspecifico) {
      setError('Selecciona un cliente')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let destinatarios = []

      if (esCliente) {
        console.log('📨 Creando conversación primero...')
        // Crear conversación SIN adjuntos primero
        const conversacionId = await crearConversacion(
          user.id,
          asunto.trim(),
          mensaje.trim(),
          'general',
          null,
          [] // Sin adjuntos por ahora
        )
        console.log('✅ Conversación creada:', conversacionId)

        // Ahora subir adjuntos con el ID real de la conversación
        if (adjuntos.length > 0) {
          console.log('📤 Subiendo adjuntos a conversación:', conversacionId)
          const adjuntosSubidos = []
          for (const adjunto of adjuntos) {
            try {
              const resultado = await subirAdjunto(adjunto.file, conversacionId)
              console.log('✅ Adjunto subido:', resultado)
              adjuntosSubidos.push(resultado)
            } catch (err) {
              console.error('❌ Error subiendo adjunto:', err)
              setError(`Error al subir ${adjunto.name}. Intenta nuevamente.`)
              setLoading(false)
              return
            }
          }
          console.log('📎 Todos los adjuntos subidos:', adjuntosSubidos)

          // Actualizar el primer mensaje con los adjuntos
          await actualizarAdjuntosConversacion(conversacionId, adjuntosSubidos)
        }
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.(conversacionId)
          onClose()
        }, 1500)
        return
      }

      if (esContadorSecundario || (esFullAccess && tipoDestinatario === 'especifico')) {
        // Envío a un usuario específico
        destinatarios = [destinatarioEspecifico.id]
      } else if (esFullAccess) {
        // Envío masivo según tipo
        if (tipoDestinatario === 'todos') {
          const usuarios = await getTodosLosClientes()
          destinatarios = usuarios.map(u => u.id)
        } else if (tipoDestinatario === 'monotributistas') {
          const usuarios = await getMonotributistas()
          destinatarios = usuarios.map(u => u.id)
        } else if (tipoDestinatario === 'responsables') {
          const usuarios = await getResponsablesInscriptos()
          destinatarios = usuarios.map(u => u.id)
        } else if (tipoDestinatario === 'operadores') {
          const usuarios = await getOperadoresGastos()
          destinatarios = usuarios.map(u => u.id)
        }
      }

      // Crear conversaciones primero (sin adjuntos)
      console.log('📨 Creando conversaciones para', destinatarios.length, 'destinatarios')
      const conversacionesIds = await Promise.all(
        destinatarios.map(destId =>
          crearConversacionIndividual(user.id, destId, asunto.trim(), mensaje.trim())
        )
      )
      console.log('✅ Conversaciones creadas:', conversacionesIds.length)

      // Subir adjuntos a cada conversación si hay
      if (adjuntos.length > 0) {
        console.log('📤 Subiendo adjuntos a cada conversación...')
        for (const conversacionId of conversacionesIds) {
          const adjuntosSubidos = []
          for (const adjunto of adjuntos) {
            try {
              const resultado = await subirAdjunto(adjunto.file, conversacionId)
              adjuntosSubidos.push(resultado)
            } catch (err) {
              console.error(`Error subiendo adjunto a conversación ${conversacionId}:`, err)
            }
          }
          if (adjuntosSubidos.length > 0) {
            await actualizarAdjuntosConversacion(conversacionId, adjuntosSubidos)
          }
        }
        console.log('✅ Adjuntos subidos a todas las conversaciones')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error enviando mensaje:', err)
      setError('Error al enviar el mensaje. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // Función helper para crear conversación individual
  const crearConversacionIndividual = async (remitenteId, destinatarioId, asunto, contenido) => {
    const { data, error } = await supabase.rpc('crear_conversacion_directa', {
      p_remitente_id: remitenteId,
      p_destinatario_id: destinatarioId,
      p_asunto: asunto,
      p_contenido: contenido,
      p_adjuntos: [] // Siempre vacío, los adjuntos se suben después
    })

    if (error) throw error
    return data
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold text-gray-900">Nuevo mensaje</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                {esCliente ? 'Mensaje enviado' : 'Mensajes enviados'}
              </h4>
              <p className="text-sm text-gray-500">
                {esCliente
                  ? 'Tu contadora lo verá pronto'
                  : tipoDestinatario === 'especifico' || esContadorSecundario
                  ? 'El destinatario lo verá pronto'
                  : 'Los destinatarios lo verán pronto'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selector de destinatarios para full_access */}
              {esFullAccess && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinatarios
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setTipoDestinatario('todos')
                        setDestinatarioEspecifico(null)
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        tipoDestinatario === 'todos'
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-1" />
                      Todos los clientes
                    </button>
                    <button
                      onClick={() => {
                        setTipoDestinatario('monotributistas')
                        setDestinatarioEspecifico(null)
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        tipoDestinatario === 'monotributistas'
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Monotributistas
                    </button>
                    <button
                      onClick={() => {
                        setTipoDestinatario('responsables')
                        setDestinatarioEspecifico(null)
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        tipoDestinatario === 'responsables'
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Responsables Inscriptos
                    </button>
                    <button
                      onClick={() => {
                        setTipoDestinatario('operadores')
                        setDestinatarioEspecifico(null)
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        tipoDestinatario === 'operadores'
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Operadores de Gastos
                    </button>
                    <button
                      onClick={() => setTipoDestinatario('especifico')}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        tipoDestinatario === 'especifico'
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-4 h-4 inline mr-1" />
                      Usuario específico
                    </button>
                  </div>
                </div>
              )}

              {/* Búsqueda de usuario específico (full_access con modo específico) */}
              {esFullAccess && tipoDestinatario === 'especifico' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar usuario
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Busca por nombre o email..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  {busqueda.length >= 2 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                      {loadingBusqueda ? (
                        <div className="p-3 text-center text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        </div>
                      ) : usuariosBusqueda.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          Sin resultados
                        </div>
                      ) : (
                        usuariosBusqueda.map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setDestinatarioEspecifico(u)
                              setBusqueda('')
                            }}
                            className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {destinatarioEspecifico && (
                    <div className="mt-2 p-3 bg-violet-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{destinatarioEspecifico.fullName}</p>
                        <p className="text-xs text-gray-500">{destinatarioEspecifico.email}</p>
                      </div>
                      <button
                        onClick={() => setDestinatarioEspecifico(null)}
                        className="p-1 hover:bg-violet-100 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Selector de cliente para contador_secundario */}
              {esContadorSecundario && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selecciona un cliente
                  </label>

                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Busca entre tus clientes asignados..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  {busqueda.length >= 2 ? (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                      {loadingBusqueda ? (
                        <div className="p-3 text-center text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        </div>
                      ) : usuariosBusqueda.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          Sin resultados
                        </div>
                      ) : (
                        usuariosBusqueda.map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setDestinatarioEspecifico(u)
                              setBusqueda('')
                            }}
                            className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </button>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                      {loadingClientes ? (
                        <div className="p-3 text-center text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        </div>
                      ) : clientesAsignados.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No tienes clientes asignados
                        </div>
                      ) : (
                        clientesAsignados.map(u => (
                          <button
                            key={u.id}
                            onClick={() => setDestinatarioEspecifico(u)}
                            className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                              destinatarioEspecifico?.id === u.id ? 'bg-violet-50' : ''
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Asunto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto
                </label>
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Escribe el asunto..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Adjuntos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Adjuntos (opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                    Adjuntar
                  </button>
                </div>

                {/* Input file oculto - con soporte para cámara en mobile */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,video/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Zona drag & drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                    isDragging
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {adjuntos.length === 0 ? (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">
                        Arrastra archivos aquí o haz clic en "Adjuntar"
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, Word, Imágenes, Excel, Videos (máx 100MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adjuntos.map((adjunto, index) => {
                        const Icon = getFileIcon(adjunto.type)
                        const esImagen = adjunto.type.startsWith('image/')

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                          >
                            {esImagen && adjunto.preview ? (
                              <img
                                src={adjunto.preview}
                                alt={adjunto.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <Icon className="w-6 h-6 text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {adjunto.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(adjunto.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                            <button
                              onClick={() => eliminarAdjunto(index)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {isDragging && (
                    <div className="absolute inset-0 bg-violet-100/50 border-2 border-violet-400 rounded-lg flex items-center justify-center">
                      <p className="text-violet-700 font-medium">
                        Suelta los archivos aquí
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <p className="text-xs text-gray-500">
                {esCliente
                  ? 'Tu mensaje será enviado a tu contadora y podrás ver las respuestas en tu Buzón de mensajes.'
                  : tipoDestinatario === 'especifico' || esContadorSecundario
                  ? 'El destinatario recibirá una notificación y podrá ver el mensaje en su Buzón.'
                  : 'Se creará una conversación individual con cada destinatario seleccionado.'}
              </p>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-4 pb-safe-bottom border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviar}
              disabled={loading || !asunto.trim() || !mensaje.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl transition-colors font-medium text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
