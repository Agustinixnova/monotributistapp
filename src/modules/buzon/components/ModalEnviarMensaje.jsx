import { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, MessageSquare, Users, User, Search, Check, Paperclip, Image, FileText, Video, FileSpreadsheet, File as FileIcon, Trash2, Upload } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth'
import { supabase } from '../../../lib/supabase'
import { crearConversacion, crearConversacionConDestinatarios, getClientesParaMensajes } from '../services/buzonService'
import { subirAdjunto, validarArchivo } from '../services/adjuntosService'

// Roles que pueden seleccionar destinatarios
const ROLES_CON_SELECTOR = ['desarrollo', 'contadora_principal', 'comunicadora', 'admin']

// Grupos predefinidos para envío masivo
const GRUPOS_DESTINATARIOS = [
  { id: 'todos', label: 'Todos los clientes', roles: ['monotributista', 'responsable_inscripto'] },
  { id: 'monotributistas', label: 'Solo Monotributistas', roles: ['monotributista'] },
  { id: 'responsables', label: 'Solo Resp. Inscriptos', roles: ['responsable_inscripto'] }
]

/**
 * Modal reutilizable para enviar mensajes al buzon
 *
 * Props:
 * - asunto: Asunto predefinido (opcional, editable si asuntoEditable=true)
 * - asuntoEditable: Si el asunto se puede editar (default: true)
 * - origen: De donde se origina el mensaje ('facturacion', 'exclusion', etc.)
 * - origenReferencia: Datos adicionales del contexto (objeto JSON)
 * - onClose: Funcion para cerrar el modal
 * - onSuccess: Funcion llamada al enviar exitosamente (recibe conversacionId)
 */
export function ModalEnviarMensaje({
  asunto: asuntoInicial = '',
  asuntoEditable = true,
  origen = 'general',
  origenReferencia = null,
  onClose,
  onSuccess
}) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [userRole, setUserRole] = useState(null)
  const [loadingRole, setLoadingRole] = useState(true)
  const puedeSeleccionarDestinatarios = ROLES_CON_SELECTOR.includes(userRole)

  const [asunto, setAsunto] = useState(asuntoInicial)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Estados para adjuntos
  const [adjuntos, setAdjuntos] = useState([])
  const [isDragging, setIsDragging] = useState(false)

  // Estados para selector de destinatarios
  const [modoEnvio, setModoEnvio] = useState('individual') // 'individual' | 'grupo'
  const [clientes, setClientes] = useState([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [destinatariosSeleccionados, setDestinatariosSeleccionados] = useState([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)

  // Cargar el rol del usuario desde la base de datos
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setLoadingRole(false)
        return
      }
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role_id, roles(name)')
          .eq('id', user.id)
          .single()

        if (!error && profile) {
          setUserRole(profile.roles?.name)
          console.log('ModalEnviarMensaje - userRole:', profile.roles?.name)
        }
      } catch (err) {
        console.error('Error obteniendo rol:', err)
      } finally {
        setLoadingRole(false)
      }
    }
    fetchUserRole()
  }, [user?.id])

  // Cargar clientes si puede seleccionar destinatarios
  useEffect(() => {
    if (puedeSeleccionarDestinatarios && !loadingRole) {
      fetchClientes()
    }
  }, [puedeSeleccionarDestinatarios, loadingRole])

  const fetchClientes = async () => {
    setLoadingClientes(true)
    try {
      const data = await getClientesParaMensajes(user.id)
      setClientes(data)
    } catch (err) {
      console.error('Error cargando clientes:', err)
    } finally {
      setLoadingClientes(false)
    }
  }

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientes.filter(c => {
    const texto = `${c.nombre || ''} ${c.apellido || ''} ${c.email || ''} ${c.razon_social || ''}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  // Toggle selección de cliente
  const toggleCliente = (clienteId) => {
    setDestinatariosSeleccionados(prev => {
      if (prev.includes(clienteId)) {
        return prev.filter(id => id !== clienteId)
      } else {
        return [...prev, clienteId]
      }
    })
  }

  // Seleccionar todos los filtrados
  const seleccionarTodos = () => {
    const ids = clientesFiltrados.map(c => c.user_id)
    setDestinatariosSeleccionados(ids)
  }

  // Deseleccionar todos
  const deseleccionarTodos = () => {
    setDestinatariosSeleccionados([])
  }

  // Obtener destinatarios según modo
  const getDestinatariosFinales = () => {
    if (modoEnvio === 'grupo' && grupoSeleccionado) {
      const grupo = GRUPOS_DESTINATARIOS.find(g => g.id === grupoSeleccionado)
      if (grupo) {
        return clientes
          .filter(c => grupo.roles.includes(c.rol))
          .map(c => c.user_id)
      }
    }
    return destinatariosSeleccionados
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

  const handleEnviar = async () => {
    if (!asunto.trim()) {
      setError('El asunto es requerido')
      return
    }
    if (!mensaje.trim()) {
      setError('El mensaje es requerido')
      return
    }

    // Validar destinatarios si puede seleccionarlos
    if (puedeSeleccionarDestinatarios) {
      const destinatarios = getDestinatariosFinales()
      if (destinatarios.length === 0) {
        setError('Selecciona al menos un destinatario')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      // Subir adjuntos primero si hay (usar UUID temporal)
      const adjuntosData = []
      const tempId = crypto.randomUUID() // Generar UUID temporal válido

      if (adjuntos.length > 0) {
        for (const adjunto of adjuntos) {
          try {
            const data = await subirAdjunto(adjunto.file, tempId)
            adjuntosData.push(data)
          } catch (err) {
            console.error('Error subiendo adjunto:', err)
            setError(`Error subiendo archivo: ${adjunto.name}`)
            return
          }
        }
      }

      // Crear conversación con adjuntos
      let conversacionId

      if (puedeSeleccionarDestinatarios) {
        // Usar función con destinatarios específicos
        const destinatarios = getDestinatariosFinales()
        conversacionId = await crearConversacionConDestinatarios(
          user.id,
          asunto.trim(),
          mensaje.trim(),
          destinatarios,
          origen,
          origenReferencia,
          adjuntosData
        )
      } else {
        // Usar función normal (clientes enviando a contadoras)
        conversacionId = await crearConversacion(
          user.id,
          asunto.trim(),
          mensaje.trim(),
          origen,
          origenReferencia,
          adjuntosData
        )
      }

      setSuccess(true)

      setTimeout(() => {
        onSuccess?.(conversacionId)
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error enviando mensaje:', err)
      setError('Error al enviar el mensaje. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const cantidadSeleccionados = modoEnvio === 'grupo' && grupoSeleccionado
    ? clientes.filter(c => GRUPOS_DESTINATARIOS.find(g => g.id === grupoSeleccionado)?.roles.includes(c.rol)).length
    : destinatariosSeleccionados.length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col safe-area-bottom ${puedeSeleccionarDestinatarios ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold text-gray-900">Enviar mensaje</h3>
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
          {loadingRole ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
            </div>
          ) : success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                Mensaje enviado
              </h4>
              <p className="text-sm text-gray-500">
                {puedeSeleccionarDestinatarios
                  ? `Se envió a ${cantidadSeleccionados} destinatario${cantidadSeleccionados !== 1 ? 's' : ''}`
                  : 'Tu contadora lo verá pronto'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selector de destinatarios (solo para roles permitidos) */}
              {puedeSeleccionarDestinatarios && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Destinatarios
                  </label>

                  {/* Tabs de modo */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => {
                        setModoEnvio('individual')
                        setGrupoSeleccionado(null)
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        modoEnvio === 'individual'
                          ? 'bg-white shadow text-gray-900 font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Individual
                    </button>
                    <button
                      onClick={() => {
                        setModoEnvio('grupo')
                        setDestinatariosSeleccionados([])
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        modoEnvio === 'grupo'
                          ? 'bg-white shadow text-gray-900 font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Grupo
                    </button>
                  </div>

                  {modoEnvio === 'individual' ? (
                    <>
                      {/* Buscador */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          placeholder="Buscar cliente..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Acciones rápidas */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {destinatariosSeleccionados.length} seleccionado{destinatariosSeleccionados.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={seleccionarTodos}
                            className="text-violet-600 hover:text-violet-700"
                          >
                            Seleccionar todos
                          </button>
                          {destinatariosSeleccionados.length > 0 && (
                            <button
                              onClick={deseleccionarTodos}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              Limpiar
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lista de clientes */}
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {loadingClientes ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                          </div>
                        ) : clientesFiltrados.length === 0 ? (
                          <div className="py-6 text-center text-gray-500 text-sm">
                            No se encontraron clientes
                          </div>
                        ) : (
                          clientesFiltrados.map((cliente) => (
                            <button
                              key={cliente.user_id}
                              onClick={() => toggleCliente(cliente.user_id)}
                              className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                                destinatariosSeleccionados.includes(cliente.user_id) ? 'bg-violet-50' : ''
                              }`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                destinatariosSeleccionados.includes(cliente.user_id)
                                  ? 'bg-violet-600 border-violet-600'
                                  : 'border-gray-300'
                              }`}>
                                {destinatariosSeleccionados.includes(cliente.user_id) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {cliente.nombre && cliente.apellido
                                    ? `${cliente.nombre} ${cliente.apellido}`
                                    : cliente.razon_social || cliente.email}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {cliente.email}
                                  {cliente.es_mi_cliente && (
                                    <span className="ml-2 text-violet-600">(Mi cliente)</span>
                                  )}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                cliente.rol === 'monotributista'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {cliente.rol === 'monotributista' ? 'Mono' : 'RI'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    /* Selector de grupos */
                    <div className="space-y-2">
                      {GRUPOS_DESTINATARIOS.map((grupo) => {
                        const cantidad = clientes.filter(c => grupo.roles.includes(c.rol)).length
                        return (
                          <button
                            key={grupo.id}
                            onClick={() => setGrupoSeleccionado(grupo.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                              grupoSeleccionado === grupo.id
                                ? 'border-violet-600 bg-violet-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                grupoSeleccionado === grupo.id ? 'bg-violet-600' : 'bg-gray-100'
                              }`}>
                                <Users className={`w-5 h-5 ${
                                  grupoSeleccionado === grupo.id ? 'text-white' : 'text-gray-500'
                                }`} />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900">{grupo.label}</p>
                                <p className="text-sm text-gray-500">{cantidad} cliente{cantidad !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              grupoSeleccionado === grupo.id
                                ? 'bg-violet-600 border-violet-600'
                                : 'border-gray-300'
                            }`}>
                              {grupoSeleccionado === grupo.id && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Asunto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto
                </label>
                {asuntoEditable ? (
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="Escribe el asunto..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                    {asunto}
                  </div>
                )}
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Adjuntos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjuntos (opcional)
                </label>

                {/* Input file oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Zona drag & drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                    isDragging
                      ? 'border-violet-500 bg-violet-50 scale-[1.02]'
                      : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'
                  }`}
                >
                  {adjuntos.length === 0 ? (
                    <div className="text-center py-8">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
                        isDragging ? 'bg-violet-100' : 'bg-gray-100'
                      }`}>
                        <Upload className={`w-8 h-8 transition-colors ${
                          isDragging ? 'text-violet-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí o haz clic'}
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, Word, Imágenes, Excel, Videos (máx 100MB)
                      </p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-2 mb-3">
                        {adjuntos.map((adjunto, index) => {
                          const Icon = getFileIcon(adjunto.type)
                          const esImagen = adjunto.type.startsWith('image/')

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {esImagen && adjunto.preview ? (
                                <img
                                  src={adjunto.preview}
                                  alt={adjunto.name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {adjunto.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(adjunto.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  eliminarAdjunto(index)
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* Zona para agregar más archivos */}
                      <div className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                        isDragging
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-400'
                      }`}>
                        <p className="text-xs text-gray-600">
                          <Paperclip className="w-4 h-4 inline mr-1" />
                          {isDragging ? 'Suelta para agregar más archivos' : 'Haz clic o arrastra para agregar más'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Overlay cuando se arrastra */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-violet-500/10 rounded-lg flex items-center justify-center pointer-events-none">
                      <div className="bg-white rounded-lg shadow-lg p-4">
                        <Upload className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-violet-600">Suelta aquí</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <p className="text-xs text-gray-500">
                {puedeSeleccionarDestinatarios
                  ? 'Los destinatarios recibirán este mensaje en su buzón.'
                  : 'Tu mensaje será enviado a tu contadora y podrás ver las respuestas en tu Buzón de mensajes.'}
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
        {!success && !loadingRole && (
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviar}
              disabled={loading || !asunto.trim() || !mensaje.trim() || (puedeSeleccionarDestinatarios && cantidadSeleccionados === 0)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {puedeSeleccionarDestinatarios && cantidadSeleccionados > 0
                    ? `Enviar a ${cantidadSeleccionados}`
                    : 'Enviar'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
