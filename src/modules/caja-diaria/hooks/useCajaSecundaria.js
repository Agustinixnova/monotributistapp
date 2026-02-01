/**
 * Hook para gestionar la Caja Secundaria
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getSaldoCajaSecundaria,
  getMovimientosCajaSecundaria,
  transferirACajaSecundaria,
  reintegrarACajaPrincipal,
  registrarGastoCajaSecundaria,
  transferirDesdeArqueo,
  getOCrearCategoriasSistema
} from '../services/cajaSecundariaService'

export function useCajaSecundaria() {
  const [saldo, setSaldo] = useState(0)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoriasSistema, setCategoriasSistema] = useState(null)

  // Cargar datos iniciales
  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Cargar categorías primero (siempre debe funcionar)
      const categorias = await getOCrearCategoriasSistema()
      setCategoriasSistema(categorias)

      // Luego intentar cargar saldo y movimientos (pueden fallar si la tabla no existe)
      try {
        const [saldoRes, movimientosRes] = await Promise.all([
          getSaldoCajaSecundaria(),
          getMovimientosCajaSecundaria()
        ])
        setSaldo(saldoRes.data)
        setMovimientos(movimientosRes.data || [])
      } catch (err) {
        // Si falla por tabla inexistente, mostrar saldo 0
        console.warn('Tabla caja_secundaria_movimientos posiblemente no existe:', err.message)
        setSaldo(0)
        setMovimientos([])
      }
    } catch (err) {
      console.error('Error cargando caja secundaria:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Transferir a caja secundaria
  const transferir = useCallback(async (monto, descripcion = '') => {
    if (!categoriasSistema?.catACajaSecundaria) {
      throw new Error('Categorías de sistema no cargadas')
    }

    const result = await transferirACajaSecundaria(
      monto,
      descripcion,
      categoriasSistema.catACajaSecundaria.id
    )

    // Recargar datos
    await cargar()

    return result
  }, [categoriasSistema, cargar])

  // Reintegrar a caja principal
  const reintegrar = useCallback(async (monto, descripcion = '') => {
    if (!categoriasSistema?.catDesdeCajaSecundaria) {
      throw new Error('Categorías de sistema no cargadas')
    }

    const result = await reintegrarACajaPrincipal(
      monto,
      descripcion,
      categoriasSistema.catDesdeCajaSecundaria.id
    )

    // Recargar datos
    await cargar()

    return result
  }, [categoriasSistema, cargar])

  // Registrar gasto
  const registrarGasto = useCallback(async (monto, categoriaId, descripcion = '') => {
    const result = await registrarGastoCajaSecundaria(monto, categoriaId, descripcion)

    // Recargar datos
    await cargar()

    return result
  }, [cargar])

  // Transferir desde arqueo
  const transferirArqueo = useCallback(async (monto) => {
    if (!categoriasSistema?.catACajaSecundaria) {
      throw new Error('Categorías de sistema no cargadas')
    }

    const result = await transferirDesdeArqueo(
      monto,
      categoriasSistema.catACajaSecundaria.id
    )

    // Recargar datos
    await cargar()

    return result
  }, [categoriasSistema, cargar])

  return {
    saldo,
    movimientos,
    loading,
    error,
    categoriasSistema,
    recargar: cargar,
    transferir,
    reintegrar,
    registrarGasto,
    transferirArqueo
  }
}

export default useCajaSecundaria
