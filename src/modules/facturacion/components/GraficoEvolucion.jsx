import { useMemo } from 'react'
import { formatearMoneda } from '../utils/formatters'
import { getNombreMes } from '../utils/calculosFacturacion'

export function GraficoEvolucion({ resumenes }) {
  const datos = useMemo(() => {
    // Ordenar por fecha ascendente y tomar ultimos 6 meses
    const ordenados = [...resumenes]
      .sort((a, b) => {
        if (a.anio !== b.anio) return a.anio - b.anio
        return a.mes - b.mes
      })
      .slice(-6)

    const maxValor = Math.max(...ordenados.map(r => parseFloat(r.total_facturas || 0)), 1)

    return ordenados.map(r => ({
      mes: getNombreMes(r.mes).slice(0, 3),
      anio: r.anio,
      facturas: parseFloat(r.total_facturas || 0),
      notasCredito: parseFloat(r.total_notas_credito || 0),
      neto: parseFloat(r.total_neto || 0),
      porcentaje: (parseFloat(r.total_facturas || 0) / maxValor) * 100,
      porcentajeNC: (parseFloat(r.total_notas_credito || 0) / maxValor) * 100
    }))
  }, [resumenes])

  if (datos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos para mostrar
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barras */}
      <div className="flex items-end justify-between gap-2 h-40">
        {datos.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            {/* Barra */}
            <div className="w-full flex flex-col justify-end h-32 relative">
              {/* Barra de facturas */}
              <div
                className="w-full bg-green-500 rounded-t transition-all duration-500"
                style={{ height: `${d.porcentaje}%` }}
              />
              {/* Barra de NC (superpuesta abajo) */}
              {d.porcentajeNC > 0 && (
                <div
                  className="w-full bg-red-400 absolute bottom-0 rounded-t transition-all duration-500"
                  style={{ height: `${d.porcentajeNC}%` }}
                />
              )}
            </div>
            {/* Label */}
            <span className="text-xs text-gray-500">{d.mes}</span>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-600">Facturas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-400 rounded" />
          <span className="text-gray-600">N/Credito</span>
        </div>
      </div>

      {/* Valores del ultimo mes */}
      {datos.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Ultimo mes ({datos[datos.length - 1].mes}): {formatearMoneda(datos[datos.length - 1].neto)}
        </div>
      )}
    </div>
  )
}
