import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useResumenClientes } from '../hooks/useResumenClientes'
import { formatearMoneda, formatearCUIT, formatearPeriodo } from '../utils/formatters'
import { BarraProgresoTope } from './BarraProgresoTope'

export function ResumenClientes() {
  const { clientes, loading, error } = useResumenClientes()
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()

  const clientesFiltrados = clientes.filter(cliente => {
    // Filtro por búsqueda
    const matchBusqueda = busqueda === '' ||
      cliente.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.cuit?.includes(busqueda)

    // Filtro por estado
    let matchFiltro = true
    if (filtro === 'alertas') {
      matchFiltro = cliente.estadoAlerta !== 'ok'
    } else if (filtro === 'pendientes') {
      matchFiltro = cliente.ultimoMes?.estado_revision === 'pendiente'
    } else if (filtro === 'sinCargar') {
      matchFiltro = cliente.faltaMesActual
    }

    return matchBusqueda && matchFiltro
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o CUIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'alertas', label: 'Con alertas' },
            { value: 'pendientes', label: 'Pendientes' },
            { value: 'sinCargar', label: 'Sin cargar' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filtro === f.value
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-3">
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay clientes que coincidan con los filtros
          </div>
        ) : (
          clientesFiltrados.map(cliente => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onClick={() => navigate(`/facturacion/${cliente.id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ClienteCard({ cliente, onClick }) {
  const iconoAlerta = {
    exclusion: <AlertTriangle className="w-5 h-5 text-red-500" />,
    recategorizacion: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    ok: <CheckCircle className="w-5 h-5 text-green-500" />
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {iconoAlerta[cliente.estadoAlerta]}
          <div>
            <h3 className="font-semibold text-gray-900">{cliente.nombreCompleto}</h3>
            <p className="text-sm text-gray-500">
              CUIT: {formatearCUIT(cliente.cuit)} | {cliente.tipo_actividad} | Cat. {cliente.categoria_monotributo}
            </p>
            {cliente.gestion_facturacion === 'autonomo' && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                Autonomo
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            {cliente.porcentaje.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mt-3">
        <BarraProgresoTope
          facturado={cliente.acumulado12Meses}
          tope={cliente.tope}
          porcentaje={cliente.porcentaje}
          estadoAlerta={cliente.estadoAlerta}
          compacto
        />
      </div>

      {/* Estado último mes */}
      <div className="mt-3 flex items-center justify-between text-sm">
        {cliente.faltaMesActual ? (
          <span className="flex items-center gap-1 text-orange-600">
            <Clock className="w-4 h-4" />
            Sin cargar mes actual
          </span>
        ) : cliente.ultimoMes ? (
          <span className="text-gray-500">
            Ultimo: {formatearPeriodo(cliente.ultimoMes.anio, cliente.ultimoMes.mes)} - {formatearMoneda(cliente.ultimoMes.monto_declarado)}
          </span>
        ) : null}

        {cliente.ultimoMes?.estado_revision === 'pendiente' && (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
            Pendiente revisar
          </span>
        )}
      </div>
    </div>
  )
}
