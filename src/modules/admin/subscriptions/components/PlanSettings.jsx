import { useState, useEffect } from 'react'
import { Settings, ToggleLeft, ToggleRight, Save, X, Edit2, AlertCircle, CheckCircle } from 'lucide-react'
import { adminSubscriptionService } from '../services/adminSubscriptionService'

/**
 * Panel de configuración de planes de suscripción
 * Solo para admin/contadora_principal
 */
export function PlanSettings() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // ID del plan siendo guardado
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingPlan, setEditingPlan] = useState(null)

  // Cargar planes al montar
  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminSubscriptionService.getAllPlans()
      setPlans(data)
    } catch (err) {
      console.error('Error loading plans:', err)
      setError('Error al cargar los planes')
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlan = (plan) => {
    setEditingPlan({
      ...plan,
      base_price: plan.base_price || plan.price_per_month,
      discount_percentage: plan.discount_percentage || 0
    })
    setError(null)
    setSuccess(null)
  }

  const handleCancelEdit = () => {
    setEditingPlan(null)
  }

  const handleSavePlan = async () => {
    if (!editingPlan) return

    try {
      setSaving(editingPlan.id)
      setError(null)

      // Calcular precios
      const prices = adminSubscriptionService.calculatePlanPrices(
        editingPlan.base_price,
        editingPlan.discount_percentage,
        editingPlan.duration_months
      )

      // Actualizar plan
      await adminSubscriptionService.updatePlan(editingPlan.id, {
        base_price: editingPlan.base_price,
        discount_percentage: editingPlan.discount_percentage,
        renewal_alert_days: editingPlan.renewal_alert_days,
        ...prices
      })

      setSuccess(`Plan "${editingPlan.name}" actualizado correctamente`)
      setEditingPlan(null)
      await loadPlans()

      // Limpiar success después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving plan:', err)
      setError('Error al guardar el plan')
    } finally {
      setSaving(null)
    }
  }

  const handleToggleActive = async (plan) => {
    try {
      setSaving(plan.id)
      setError(null)
      await adminSubscriptionService.togglePlanStatus(plan.id, !plan.is_active)
      setSuccess(`Plan "${plan.name}" ${!plan.is_active ? 'activado' : 'desactivado'}`)
      await loadPlans()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error toggling plan:', err)
      setError('Error al cambiar estado del plan')
    } finally {
      setSaving(null)
    }
  }

  // Preview de precios mientras edita
  const getEditingPreview = () => {
    if (!editingPlan) return null
    return adminSubscriptionService.calculatePlanPrices(
      editingPlan.base_price || 0,
      editingPlan.discount_percentage || 0,
      editingPlan.duration_months
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const preview = getEditingPreview()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Configuración de Planes</h2>
        </div>
        <p className="text-sm text-gray-500">
          Administrá los precios y configuración de cada plan de suscripción
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid de planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map(plan => {
          const isEditing = editingPlan?.id === plan.id
          const isSaving = saving === plan.id

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                isEditing
                  ? 'border-blue-500 shadow-lg'
                  : plan.is_active
                    ? 'border-gray-200'
                    : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Header del plan */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                isEditing ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <div>
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500">
                    {plan.duration_months} {plan.duration_months === 1 ? 'mes' : 'meses'}
                  </p>
                </div>

                {/* Toggle activo */}
                <button
                  onClick={() => handleToggleActive(plan)}
                  disabled={isSaving || isEditing}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    plan.is_active
                      ? 'text-green-700 hover:bg-green-100'
                      : 'text-gray-500 hover:bg-gray-200'
                  } ${(isSaving || isEditing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {plan.is_active ? (
                    <>
                      <ToggleRight className="w-5 h-5" />
                      <span>Activo</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5" />
                      <span>Inactivo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Contenido */}
              <div className="p-4">
                {isEditing ? (
                  /* Modo edición */
                  <div className="space-y-4">
                    {/* Precio base */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio base mensual
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={editingPlan.base_price || ''}
                          onChange={(e) => setEditingPlan({
                            ...editingPlan,
                            base_price: parseInt(e.target.value) || 0
                          })}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Descuento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descuento (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingPlan.discount_percentage || ''}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          discount_percentage: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Días de alerta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Días de alerta antes del vencimiento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={editingPlan.renewal_alert_days || ''}
                        onChange={(e) => setEditingPlan({
                          ...editingPlan,
                          renewal_alert_days: parseInt(e.target.value) || 7
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Preview de precios */}
                    {preview && (
                      <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                        <p className="text-xs font-medium text-blue-700 uppercase">Preview</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Precio/mes:</span>
                          <span className="font-semibold text-gray-900">
                            {adminSubscriptionService.formatPrice(preview.price_per_month)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-semibold text-gray-900">
                            {adminSubscriptionService.formatPrice(preview.total_price)}
                          </span>
                        </div>
                        {preview.savings_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Ahorro:</span>
                            <span className="font-semibold text-green-600">
                              {adminSubscriptionService.formatPrice(preview.savings_amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSavePlan}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Guardar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Modo visualización */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Precio/mes</p>
                        <p className="text-lg font-bold text-gray-900">
                          {adminSubscriptionService.formatPrice(plan.price_per_month)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-lg font-bold text-gray-900">
                          {adminSubscriptionService.formatPrice(plan.total_price)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Descuento</p>
                        <p className="font-medium text-gray-900">
                          {plan.discount_percentage || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Alerta</p>
                        <p className="font-medium text-gray-900">
                          {plan.renewal_alert_days || 7} días
                        </p>
                      </div>
                    </div>

                    {plan.savings_amount > 0 && (
                      <div className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Ahorro: {adminSubscriptionService.formatPrice(plan.savings_amount)}
                      </div>
                    )}

                    <button
                      onClick={() => handleEditPlan(plan)}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors mt-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PlanSettings
