/**
 * Hook para verificar permisos del usuario en caja diaria
 */

import { useState, useEffect, useCallback } from 'react'
import { getMisPermisos } from '../services/empleadosService'

// Nombres de días en español (como los guardamos en la DB)
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

/**
 * Convierte hora HH:MM a minutos desde medianoche
 */
function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

/**
 * Verifica si la hora actual está dentro de los horarios permitidos
 * @param {object|null} horariosAcceso - Horarios configurados o null si sin restricciones
 * @returns {{ dentroDeHorario: boolean, proximoHorario: string|null, minutosRestantes: number|null }}
 */
function verificarHorarioAcceso(horariosAcceso) {
  // Si no hay restricciones, siempre está dentro del horario
  if (!horariosAcceso || Object.keys(horariosAcceso).length === 0) {
    return { dentroDeHorario: true, proximoHorario: null, minutosRestantes: null }
  }

  // Obtener fecha/hora actual en Argentina (UTC-3)
  const ahora = new Date()
  const ahoraArgentina = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }))

  const diaActual = DIAS_SEMANA[ahoraArgentina.getDay()]
  const horaActual = ahoraArgentina.getHours().toString().padStart(2, '0') + ':' +
                     ahoraArgentina.getMinutes().toString().padStart(2, '0')
  const minutosActuales = horaAMinutos(horaActual)

  // Verificar si el día actual tiene horarios configurados
  const rangosDia = horariosAcceso[diaActual]
  if (!rangosDia || rangosDia.length === 0) {
    // No trabaja este día, buscar próximo día con horario
    return {
      dentroDeHorario: false,
      proximoHorario: buscarProximoHorario(horariosAcceso, diaActual),
      minutosRestantes: null
    }
  }

  // Verificar si está dentro de algún rango del día
  for (const rango of rangosDia) {
    if (horaActual >= rango.desde && horaActual < rango.hasta) {
      // Calcular minutos restantes hasta el fin del rango
      const minutosHasta = horaAMinutos(rango.hasta)
      const minutosRestantes = minutosHasta - minutosActuales
      return { dentroDeHorario: true, proximoHorario: null, minutosRestantes }
    }
  }

  // No está dentro de ningún rango, buscar el próximo
  // Primero buscar si hay un rango más tarde hoy
  const rangosMasTarde = rangosDia.filter(r => r.desde > horaActual)
  if (rangosMasTarde.length > 0) {
    rangosMasTarde.sort((a, b) => a.desde.localeCompare(b.desde))
    return {
      dentroDeHorario: false,
      proximoHorario: `Hoy a las ${rangosMasTarde[0].desde}`,
      minutosRestantes: null
    }
  }

  // Buscar próximo día con horario
  return {
    dentroDeHorario: false,
    proximoHorario: buscarProximoHorario(horariosAcceso, diaActual),
    minutosRestantes: null
  }
}

/**
 * Busca el próximo día/horario disponible
 */
function buscarProximoHorario(horariosAcceso, diaActual) {
  const indiceDiaActual = DIAS_SEMANA.indexOf(diaActual)

  // Buscar en los próximos 7 días
  for (let i = 1; i <= 7; i++) {
    const indiceDia = (indiceDiaActual + i) % 7
    const dia = DIAS_SEMANA[indiceDia]
    const rangos = horariosAcceso[dia]

    if (rangos && rangos.length > 0) {
      // Ordenar rangos por hora de inicio
      const rangosOrdenados = [...rangos].sort((a, b) => a.desde.localeCompare(b.desde))
      const nombreDia = dia.charAt(0).toUpperCase() + dia.slice(1)
      return `${nombreDia} a las ${rangosOrdenados[0].desde}`
    }
  }

  return null
}

export function usePermisosCaja() {
  const [permisos, setPermisos] = useState({
    anular_movimientos: true,
    eliminar_arqueos: true,
    editar_saldo_inicial: true,
    agregar_categorias: true,
    agregar_metodos_pago: true,
    editar_cierre: true,
    reabrir_dia: true,
    ver_reportes: true,
    ver_total_dia: true,
    ver_estadisticas: true,
    editar_cuentas_corrientes: true,
    eliminar_clientes_cc: true,
    ver_dias_anteriores: true
  })
  const [esDuenio, setEsDuenio] = useState(true)
  const [horariosAcceso, setHorariosAcceso] = useState(null)
  const [dentroDeHorario, setDentroDeHorario] = useState(true)
  const [proximoHorario, setProximoHorario] = useState(null)
  const [minutosRestantes, setMinutosRestantes] = useState(null)
  const [alertaFinSesion, setAlertaFinSesion] = useState(false)
  const [loading, setLoading] = useState(true)

  // Verificar horario actual
  const verificarHorario = useCallback(() => {
    const { dentroDeHorario: dentro, proximoHorario: proximo, minutosRestantes: minutos } = verificarHorarioAcceso(horariosAcceso)
    setDentroDeHorario(dentro)
    setProximoHorario(proximo)
    setMinutosRestantes(minutos)
    // Activar alerta si faltan 5 minutos o menos y está dentro del horario
    setAlertaFinSesion(dentro && minutos !== null && minutos <= 5)
  }, [horariosAcceso])

  const fetchPermisos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getMisPermisos()

    if (!error && data) {
      setPermisos(data.permisos)
      setEsDuenio(data.esDuenio)
      setHorariosAcceso(data.horariosAcceso)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPermisos()
  }, [fetchPermisos])

  // Verificar horario cuando cambian los horarios de acceso
  useEffect(() => {
    verificarHorario()
  }, [verificarHorario])

  // Verificar horario cada minuto para detectar cambios
  useEffect(() => {
    const intervalo = setInterval(verificarHorario, 60000) // Cada 1 minuto
    return () => clearInterval(intervalo)
  }, [verificarHorario])

  // Helpers para verificar permisos individuales
  const puede = {
    anularMovimientos: permisos.anular_movimientos,
    eliminarArqueos: permisos.eliminar_arqueos,
    editarSaldoInicial: permisos.editar_saldo_inicial,
    agregarCategorias: permisos.agregar_categorias,
    agregarMetodosPago: permisos.agregar_metodos_pago,
    editarCierre: permisos.editar_cierre,
    reabrirDia: permisos.reabrir_dia,
    verReportes: permisos.ver_reportes,
    verTotalDia: permisos.ver_total_dia,
    verEstadisticas: permisos.ver_estadisticas,
    editarCuentasCorrientes: permisos.editar_cuentas_corrientes,
    eliminarClientesCC: permisos.eliminar_clientes_cc,
    verDiasAnteriores: permisos.ver_dias_anteriores,
    // El dueño siempre puede gestionar empleados y configuración
    gestionarEmpleados: esDuenio,
    cambiarNombreNegocio: esDuenio
  }

  return {
    permisos,
    esDuenio,
    loading,
    puede,
    dentroDeHorario,
    proximoHorario,
    minutosRestantes,
    alertaFinSesion,
    refresh: fetchPermisos
  }
}
