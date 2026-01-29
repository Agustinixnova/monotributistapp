/**
 * Componente para mostrar la lista de links de reserva
 */

import { useState } from 'react'
import {
  Link2, Clock, Calendar, User, Trash2, Copy, Check,
  ExternalLink, MoreVertical, Share2, CheckCircle, XCircle,
  AlertCircle, Loader2
} from 'lucide-react'
import { useReservaLinks } from '../../hooks/useReservaLinks'

// Badge de estado
function EstadoBadge({ estado }) {
  const config = {
    activo: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Activo' },
    usado: { color: 'bg-blue-100 text-blue-700', icon: Check, label: 'Usado' },
    expirado: { color: 'bg-gray-100 text-gray-500', icon: XCircle, label: 'Expirado' }
  }

  const { color, icon: Icon, label } = config[estado] || config.activo

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// Formatear tiempo restante
function formatTiempoRestante(expiresAt) {
  const ahora = new Date()
  const expira = new Date(expiresAt)
  const diff = expira - ahora

  if (diff <= 0) return 'Expirado'

  const horas = Math.floor(diff / (1000 * 60 * 60))
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (horas > 24) {
    const dias = Math.floor(horas / 24)
    return `${dias}d ${horas % 24}h`
  }

  return `${horas}h ${minutos}m`
}

// Item de link
function LinkItem({ link, onEliminar, onCopiar, onCompartir }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const handleCopiar = async () => {
    const url = `${window.location.origin}/reservar/${link.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Error copiando:', err)
    }
  }

  const handleCompartirWhatsApp = () => {
    const url = `${window.location.origin}/reservar/${link.token}`
    const clienteNombre = link.cliente?.nombre || 'cliente'
    let mensaje = `Hola ${clienteNombre}! Te comparto el link para que reserves tu turno:`
    if (link.mensaje_personalizado) {
      mensaje = link.mensaje_personalizado
    }
    mensaje += `\n\n${url}`

    const whatsappUrl = link.cliente?.telefono
      ? `https://wa.me/${link.cliente.telefono}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`

    window.open(whatsappUrl, '_blank')
  }

  const totalSlots = Object.values(link.slots_disponibles || {}).reduce((acc, arr) => acc + arr.length, 0)
  const totalDias = Object.keys(link.slots_disponibles || {}).length

  return (
    <div className={`border rounded-lg p-4 transition-colors ${
      link.estado === 'activo' ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
    }`}>
      <div className="flex items-start justify-between gap-4">
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <EstadoBadge estado={link.estado} />
            {link.estado === 'activo' && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expira en {formatTiempoRestante(link.expires_at)}
              </span>
            )}
          </div>

          {/* Cliente */}
          <div className="flex items-center gap-2 text-sm mb-1">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium">
              {link.cliente
                ? `${link.cliente.nombre} ${link.cliente.apellido}`
                : 'Cualquier cliente'}
            </span>
          </div>

          {/* Fechas y slots */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {link.fecha_desde} - {link.fecha_hasta}
            </span>
            <span>
              {totalSlots} horarios en {totalDias} días
            </span>
          </div>

          {/* Token */}
          <div className="mt-2">
            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
              {link.token}
            </code>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          {link.estado === 'activo' && (
            <>
              <button
                onClick={handleCopiar}
                title="Copiar link"
                className={`p-2 rounded-lg transition-colors ${
                  copiado ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCompartirWhatsApp}
                title="Compartir por WhatsApp"
                className="p-2 hover:bg-green-100 text-gray-500 hover:text-green-600 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Menú */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>

            {menuAbierto && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuAbierto(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 py-1 min-w-32">
                  <button
                    onClick={() => {
                      window.open(`/reservar/${link.token}`, '_blank')
                      setMenuAbierto(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver página
                  </button>
                  <button
                    onClick={() => {
                      onEliminar(link.id)
                      setMenuAbierto(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ListaReservaLinks({ onNuevoLink }) {
  const { links, linksActivos, linksUsados, loading, eliminar } = useReservaLinks()
  const [filtro, setFiltro] = useState('todos') // todos, activos, usados

  const handleEliminar = async (linkId) => {
    if (window.confirm('Eliminar este link de reserva?')) {
      await eliminar(linkId)
    }
  }

  const linksFiltrados = filtro === 'activos'
    ? linksActivos
    : filtro === 'usados'
    ? linksUsados
    : links

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos ({links.length})</option>
            <option value="activos">Activos ({linksActivos.length})</option>
            <option value="usados">Usados ({linksUsados.length})</option>
          </select>
        </div>

        <button
          onClick={onNuevoLink}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Link2 className="w-4 h-4" />
          Nuevo link
        </button>
      </div>

      {/* Lista de links */}
      {linksFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-600 mb-1">
            {filtro === 'todos'
              ? 'No hay links de reserva'
              : filtro === 'activos'
              ? 'No hay links activos'
              : 'No hay links usados'}
          </h3>
          <p className="text-sm text-gray-500">
            Generá un link para que tus clientes puedan reservar turnos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {linksFiltrados.map(link => (
            <LinkItem
              key={link.id}
              link={link}
              onEliminar={handleEliminar}
            />
          ))}
        </div>
      )}
    </div>
  )
}
