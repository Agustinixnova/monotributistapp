import { useState, useEffect, useCallback } from 'react'
import { subscriptionService } from '../services/subscriptionService'

/**
 * Hook para obtener y gestionar los planes de suscripción
 */
export function usePlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true)
        setError(null)
        const data = await subscriptionService.getPlans()
        setPlans(data || [])
      } catch (err) {
        console.error('Error fetching plans:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  /**
   * Busca un plan por su key
   * @param {string} key - plan_key del plan (monthly, quarterly, etc.)
   */
  const getPlanByKey = useCallback((key) => {
    return plans.find(plan => plan.plan_key === key) || null
  }, [plans])

  /**
   * Formatea un precio a pesos argentinos
   * @param {number} amount - Monto en centavos/pesos sin decimales
   */
  const formatPrice = useCallback((amount) => {
    return subscriptionService.formatPrice(amount)
  }, [])

  return {
    plans,
    loading,
    error,
    getPlanByKey,
    formatPrice
  }
}

export default usePlans
