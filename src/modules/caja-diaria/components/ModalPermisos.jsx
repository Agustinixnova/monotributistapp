/**
 * Modal para editar permisos de un empleado
 */

import { useState, useEffect } from 'react'
import { X, Shield, Check } from 'lucide-react'

const PERMISOS_INFO = [
  {
    key: 'ver_total_dia',
    label: 'Ver resumen Total del Día',
    descripcion: 'Permite ver la card con el resumen de entradas, salidas y saldo del día'
  },
  {
    key: 'ver_reportes',
    label: 'Acceder a Reportes',
    descripcion: 'Permite acceder al módulo de reportes y generar PDF/Excel'
  },
  {
    key: 'ver_estadisticas',
    label: 'Acceder a Estadísticas',
    descripcion: 'Permite ver estadísticas, gráficos y el detalle de movimientos por categoría'
  },
  {
    key: 'anular_movimientos',
    label: 'Anular movimientos',
    descripcion: 'Permite anular entradas y salidas registradas'
  },
  {
    key: 'eliminar_arqueos',
    label: 'Eliminar arqueos',
    descripcion: 'Permite eliminar arqueos de caja realizados'
  },
  {
    key: 'editar_saldo_inicial',
    label: 'Editar saldo inicial',
    descripcion: 'Permite modificar el saldo inicial del día'
  },
  {
    key: 'agregar_categorias',
    label: 'Agregar categorías',
    descripcion: 'Permite crear nuevas categorías de movimientos'
  },
  {
    key: 'agregar_metodos_pago',
    label: 'Agregar métodos de pago',
    descripcion: 'Permite crear nuevos métodos de pago'
  },
  {
    key: 'editar_cierre',
    label: 'Editar cierre de caja',
    descripcion: 'Permite modificar un cierre de caja existente'
  },
  {
    key: 'reabrir_dia',
    label: 'Reabrir día',
    descripcion: 'Permite reabrir un día cerrado para agregar movimientos'
  },
  {
    key: 'editar_cuentas_corrientes',
    label: 'Editar cuentas corrientes',
    descripcion: 'Permite editar datos de clientes de cuenta corriente'
  },
  {
    key: 'eliminar_clientes_cc',
    label: 'Eliminar clientes de cuenta corriente',
    descripcion: 'Permite eliminar clientes del sistema de cuentas corrientes'
  },
  {
    key: 'editar_movimientos_cc',
    label: 'Editar movimientos de cuenta corriente',
    descripcion: 'Permite editar o anular movimientos de deudas y pagos'
  },
  {
    key: 'ver_dias_anteriores',
    label: 'Ver días anteriores',
    descripcion: 'Permite cambiar la fecha y ver cajas de días anteriores'
  }
]

export default function ModalPermisos({ isOpen, onClose, empleado, onGuardar }) {
  const [permisos, setPermisos] = useState({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (isOpen && empleado) {
      setPermisos(empleado.permisos || {})
    }
  }, [isOpen, empleado])

  const handleToggle = (key) => {
    setPermisos(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await onGuardar(empleado.id, permisos)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen || !empleado) return null

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="bg-violet-600 px-5 py-4 text-white flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <h3 className="font-heading font-semibold text-lg">Permisos</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Info empleado */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-500">Configurar permisos para:</p>
              <p className="font-medium text-gray-900">
                {empleado.nombre} {empleado.apellido}
              </p>
              <p className="text-sm text-gray-500">{empleado.email}</p>
            </div>

            {/* Lista de permisos */}
            <div className="space-y-3">
              {PERMISOS_INFO.map(permiso => (
                <label
                  key={permiso.key}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-violet-300 cursor-pointer transition-colors"
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={permisos[permiso.key] || false}
                      onChange={() => handleToggle(permiso.key)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      permisos[permiso.key]
                        ? 'bg-violet-600 border-violet-600'
                        : 'border-gray-300'
                    }`}>
                      {permisos[permiso.key] && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{permiso.label}</p>
                    <p className="text-xs text-gray-500">{permiso.descripcion}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Info */}
            <div className="mt-4 bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
              El empleado siempre puede registrar entradas, salidas, hacer arqueos y cerrar caja.
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={onClose}
                disabled={guardando}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium disabled:bg-violet-400"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
