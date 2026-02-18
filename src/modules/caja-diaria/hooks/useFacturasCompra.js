/**
 * Hooks para gestionar facturas de compra y reportes
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getFacturasByProveedor,
  getFacturasRecientes,
  createFactura,
  createFacturaConEgreso,
  deleteFactura,
  getReporteComprasPorProveedor,
  getDetalleFacturasProveedor
} from '../services/facturasCompraService'

/**
 * Hook para CRUD de facturas de compra
 * @param {string} proveedorId - Si se pasa, carga facturas del proveedor
 */
export function useFacturasCompra(proveedorId = null) {
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cargar facturas
  const fetchFacturas = useCallback(async () => {
    setLoading(true)
    setError(null)

    let result
    if (proveedorId) {
      result = await getFacturasByProveedor(proveedorId)
    } else {
      result = await getFacturasRecientes(10)
    }

    if (result.error) {
      setError(result.error)
    } else {
      setFacturas(result.data || [])
    }
    setLoading(false)
  }, [proveedorId])

  useEffect(() => {
    fetchFacturas()
  }, [fetchFacturas])

  // Crear factura simple
  const crear = async (facturaData) => {
    const { data, error: err } = await createFactura(facturaData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchFacturas()
    return { success: true, data }
  }

  // Crear factura con egreso
  const crearConEgreso = async (facturaData) => {
    const { data, error: err } = await createFacturaConEgreso(facturaData)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchFacturas()
    return { success: true, data }
  }

  // Eliminar factura (soft delete)
  const eliminar = async (id) => {
    const { data, error: err } = await deleteFactura(id)
    if (err) {
      setError(err)
      return { success: false, error: err }
    }
    await fetchFacturas()
    return { success: true, data }
  }

  return {
    facturas,
    loading,
    error,
    refresh: fetchFacturas,
    crear,
    crearConEgreso,
    eliminar
  }
}

/**
 * Hook para reporte de compras por proveedor
 */
export function useReporteCompras() {
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Generar reporte
  const generarReporte = async (fechaDesde, fechaHasta) => {
    setLoading(true)
    setError(null)

    const { data, error: err } = await getReporteComprasPorProveedor(fechaDesde, fechaHasta)

    if (err) {
      setError(err)
    } else {
      setDatos(data || [])
    }
    setLoading(false)
    return { data, error: err }
  }

  // Obtener detalle de facturas de un proveedor
  const getDetalleProveedor = async (proveedorId, fechaDesde, fechaHasta) => {
    const { data, error: err } = await getDetalleFacturasProveedor(proveedorId, fechaDesde, fechaHasta)
    if (err) {
      return { data: null, error: err }
    }
    return { data: data || [], error: null }
  }

  // Limpiar datos
  const limpiar = () => {
    setDatos(null)
    setError(null)
  }

  return {
    datos,
    loading,
    error,
    generarReporte,
    getDetalleProveedor,
    limpiar
  }
}
