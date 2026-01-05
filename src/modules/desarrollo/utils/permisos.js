// =============================================
// PERMISOS SIMPLIFICADOS - TODOS PUEDEN EDITAR TODO
// =============================================

const TODOS = ['dev', 'contadora', 'comunicadora']

// Todos los socios pueden editar todas las secciones
export const PERMISOS_SECCION = {
  idea: TODOS,
  fiscal: TODOS,           // Antes solo contadora, ahora todos
  ux: TODOS,               // Antes solo comunicadora, ahora todos
  checklist: TODOS,
  notas_tecnicas: TODOS    // Antes solo dev, ahora todos
}

// Quién puede mover a cada etapa
export const PERMISOS_MOVER = {
  idea: TODOS,
  desarrollo: ['dev'],      // Solo dev puede mover a desarrollo
  revisar: ['dev'],         // Solo dev puede mover a revisar
  publicado: ['dev']        // Solo dev puede publicar
}

// Permisos de reportes
export const PERMISOS_REPORTES = {
  crear: TODOS,             // todos los socios pueden crear
  cambiar_estado: ['dev'],  // solo dev
  comentar: TODOS
}

// Verificar permisos
export function puedeEditarSeccion(seccion, rolUsuario) {
  return PERMISOS_SECCION[seccion]?.includes(rolUsuario) ?? false
}

export function puedeMoverA(etapa, rolUsuario) {
  return PERMISOS_MOVER[etapa]?.includes(rolUsuario) ?? false
}

export function puedeCrearReporte(rolUsuario) {
  return PERMISOS_REPORTES.crear.includes(rolUsuario)
}

export function puedeCambiarEstadoReporte(rolUsuario) {
  return PERMISOS_REPORTES.cambiar_estado.includes(rolUsuario)
}

// =============================================
// HELPERS DE UX
// =============================================

// Mostrar botón "Pasar a desarrollo" cuando fiscal y UX están listos
export function puedeIrADesarrollo(idea) {
  return idea.fiscal_listo === true && idea.ux_listo === true
}

// El checklist solo se muestra en etapa "revisar"
export function mostrarChecklist(etapa) {
  return etapa === 'revisar'
}

// Verificar si una sección está completa
export function seccionFiscalCompleta(idea) {
  return idea.fiscal_listo === true
}

export function seccionUxCompleta(idea) {
  return idea.ux_listo === true
}

export function checklistCompleto(idea) {
  return idea.check_funciona && idea.check_calculos && idea.check_textos && idea.check_mobile
}
