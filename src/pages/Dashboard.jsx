import { Layout } from '../components/layout'
import { 
  Users, 
  FileText, 
  Clock, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

// Componente para las cards de métricas
function MetricCard({ title, value, icon: Icon, trend, trendValue, color = 'violet' }) {
  const colorClasses = {
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              <span className="font-medium">{trendValue}</span>
              <span className="text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={22} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}

// Componente para secciones vacías
function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" strokeWidth={1.5} />
      </div>
      <p className="text-gray-500 font-medium">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
    </div>
  )
}

export function Dashboard() {
  const metrics = [
    { title: 'Clientes', value: '0', icon: Users, color: 'violet' },
    { title: 'Facturas', value: '0', icon: FileText, color: 'blue' },
    { title: 'Pendientes', value: '0', icon: Clock, color: 'amber' },
    { title: 'Ingresos', value: '$0', icon: DollarSign, color: 'green' },
  ]

  return (
    <Layout title="Dashboard">
      {/* Welcome section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
        <p className="text-gray-500 mt-1">Panel de gestión de clientes monotributistas</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Two column layout for activity and calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
          </div>
          <EmptyState 
            icon={Clock} 
            title="Sin actividad reciente"
            description="Las acciones recientes aparecerán aquí"
          />
        </div>

        {/* Upcoming deadlines */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Próximos vencimientos</h3>
          </div>
          <EmptyState 
            icon={Calendar} 
            title="Sin vencimientos próximos"
            description="Los vencimientos aparecerán aquí"
          />
        </div>
      </div>

      {/* Alerts section */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Recordatorio</p>
            <p className="text-sm text-amber-700 mt-0.5">
              El vencimiento del monotributo es el día 20 de cada mes.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
