/**
 * Hook para verificar permisos del usuario en caja diaria
 */

import { useState, useEffect, useCallback } from 'react'
import { getMisPermisos } from '../services/empleadosService'

export function usePermisosCaja() {
  const [permisos, setPermisos] = useState({
    anular_movimientos: true,
    eliminar_arqueos: true,
    editar_saldo_inicial: true,
    agregar_categorias: true,
    agregar_metodos_pago: true,
    editar_cierre: true,
    reabrir_dia: true
  })
  const [esDuenio, setEsDuenio] = useState(true)
  const [loading, setLoading] = useState(true)

  const fetchPermisos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getMisPermisos()

    if (!error && data) {
      setPermisos(data.permisos)
      setEsDuenio(data.esDuenio)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPermisos()
  }, [fetchPermisos])

  // Helpers para verificar permisos individuales
  const puede = {
    anularMovimientos: permisos.anular_movimientos,
    eliminarArqueos: permisos.eliminar_arqueos,
    editarSaldoInicial: permisos.editar_saldo_inicial,
    agregarCategorias: permisos.agregar_categorias,
    agregarMetodosPago: permisos.agregar_metodos_pago,
    editarCierre: permisos.editar_cierre,
    reabrirDia: permisos.reabrir_dia,
    // El dueño siempre puede gestionar empleados y configuración
    gestionarEmpleados: esDuenio,
    cambiarNombreNegocio: esDuenio
  }

  return {
    permisos,
    esDuenio,
    loading,
    puede,
    refresh: fetchPermisos
  }
}
