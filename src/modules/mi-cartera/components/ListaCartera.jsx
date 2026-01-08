import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, AlertCircle, Building2, Briefcase, ChevronRight } from 'lucide-react'
import { FiltrosCartera } from './FiltrosCartera'
import { TarjetaCliente } from './TarjetaCliente'

const ESTADO_PAGO_COLORS = {
  al_dia: 'bg-green-100 text-green-700',
  debe_1_cuota: 'bg-yellow-100 text-yellow-700',
  debe_2_mas: 'bg-red-100 text-red-700',
  desconocido: 'bg-gray-100 text-gray-600'
}

/**
 * Lista de clientes con tabla desktop y cards mobile
 */
export function ListaCartera({ clientes, loading, filters, onFilterChange, stats }) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrar por busqueda local
  const clientesFiltrados = searchTerm
    ? clientes.filter(c =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cuit?.includes(searchTerm) ||
        c.razon_social?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : clientes

  const formatCuit = (cuit) => {
    if (!cuit) return '-'
    return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`
  }

  // Categorias unicas
  const categorias = [...new Set(clientes.map(c => c.categoria_monotributo).filter(Boolean))].sort()

  return (
    <div className="space-y-4">
      {/* Stats rapidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-500" />
            <span className="text-2xl font-bold text-gray-900">{stats?.total || 0}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total clientes</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">{stats?.alDia || 0}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Al dia</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-amber-600">{stats?.conSugerencias || 0}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Con sugerencias</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">{stats?.conDeuda || 0}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Con deuda</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, CUIT o razon social..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        />
      </div>

      {/* Filtros */}
      <FiltrosCartera
        filters={filters}
        onFilterChange={onFilterChange}
        categorias={categorias}
        stats={stats}
      />

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-gray-500 mt-2">Cargando clientes...</p>
        </div>
      )}

      {/* Sin resultados */}
      {!loading && clientesFiltrados.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No se encontraron clientes</p>
          {(searchTerm || Object.values(filters).some(v => v)) && (
            <p className="text-sm text-gray-400 mt-1">
              Proba ajustando los filtros o la busqueda
            </p>
          )}
        </div>
      )}

      {/* Lista - Mobile: Cards */}
      {!loading && clientesFiltrados.length > 0 && (
        <>
          {/* Vista mobile: Cards */}
          <div className="md:hidden space-y-3">
            {clientesFiltrados.map(cliente => (
              <TarjetaCliente key={cliente.client_id} cliente={cliente} />
            ))}
          </div>

          {/* Vista desktop: Tabla */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      CUIT
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cat.
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contador
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientesFiltrados.map(cliente => (
                    <tr
                      key={cliente.client_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {cliente.full_name || cliente.razon_social || 'Sin nombre'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cliente.tipo_contribuyente === 'monotributista' ? 'Monotributista' : 'Resp. Inscripto'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-600">
                        {formatCuit(cliente.cuit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cliente.categoria_monotributo && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                            {cliente.categoria_monotributo}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ESTADO_PAGO_COLORS[cliente.estado_pago_monotributo] || ESTADO_PAGO_COLORS.desconocido
                        }`}>
                          {cliente.estado_pago_monotributo === 'al_dia' ? 'Al dia' :
                           cliente.estado_pago_monotributo === 'debe_1_cuota' ? '1 cuota' :
                           cliente.estado_pago_monotributo === 'debe_2_mas' ? '2+ cuotas' : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {cliente.sugerencias_pendientes > 0 && (
                            <span className="p-1 bg-amber-100 text-amber-700 rounded" title="Sugerencias pendientes">
                              <AlertCircle className="w-4 h-4" />
                            </span>
                          )}
                          {cliente.cantidad_locales > 0 && (
                            <span className="p-1 bg-orange-100 text-orange-700 rounded" title={`${cliente.cantidad_locales} locales`}>
                              <Building2 className="w-4 h-4" />
                            </span>
                          )}
                          {cliente.trabaja_relacion_dependencia && (
                            <span className="p-1 bg-teal-100 text-teal-700 rounded" title="Trabaja en dependencia">
                              <Briefcase className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {cliente.contador_nombre
                          ? `${cliente.contador_nombre} ${cliente.contador_apellido || ''}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/mi-cartera/${cliente.client_id}`}
                          className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contador de resultados */}
          <p className="text-sm text-gray-500 text-center">
            Mostrando {clientesFiltrados.length} de {clientes.length} clientes
          </p>
        </>
      )}
    </div>
  )
}
