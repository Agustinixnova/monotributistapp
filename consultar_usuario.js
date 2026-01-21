// Script temporal para consultar información de un usuario
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhwiezngaprzoqcvutbx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'
const userId = 'c671f12e-d88c-45e2-86c7-a37a8040492d'

const supabase = createClient(supabaseUrl, supabaseKey)

async function consultarUsuario() {
  console.log('='.repeat(80))
  console.log('INFORMACIÓN DEL USUARIO')
  console.log('='.repeat(80))

  // 1. Información básica
  console.log('\n1. INFORMACIÓN BÁSICA:')
  const { data: perfil } = await supabase
    .from('profiles')
    .select('*, roles(nombre)')
    .eq('id', userId)
    .single()

  if (perfil) {
    console.log(`   ID: ${perfil.id}`)
    console.log(`   Nombre: ${perfil.nombre} ${perfil.apellido || ''}`)
    console.log(`   Email: ${perfil.email}`)
    console.log(`   Rol: ${perfil.roles?.nombre || 'N/A'}`)
  }

  // 2. ¿Es empleado?
  console.log('\n2. RELACIÓN DE EMPLEADO:')
  const { data: empleado } = await supabase
    .from('caja_empleados')
    .select('*, profiles!caja_empleados_duenio_id_fkey(nombre, apellido)')
    .eq('empleado_id', userId)
    .eq('activo', true)
    .single()

  if (empleado) {
    console.log(`   Es empleado de: ${empleado.profiles.nombre} ${empleado.profiles.apellido || ''}`)
    console.log(`   Permisos:`)
    console.log(`     - Registrar movimientos: ${empleado.puede_registrar_movimientos ? 'SÍ' : 'NO'}`)
    console.log(`     - Hacer arqueos: ${empleado.puede_hacer_arqueos ? 'SÍ' : 'NO'}`)
    console.log(`     - Cerrar caja: ${empleado.puede_cerrar_caja ? 'SÍ' : 'NO'}`)
  } else {
    console.log('   No es empleado de nadie (es dueño de su propia caja)')
  }

  // 3. Categorías creadas
  console.log('\n3. CATEGORÍAS PROPIAS CREADAS:')
  const { data: categorias } = await supabase
    .from('caja_categorias')
    .select('*')
    .eq('user_id', userId)
    .order('orden')

  if (categorias && categorias.length > 0) {
    categorias.forEach(cat => {
      console.log(`   - ${cat.nombre} (${cat.tipo}) - Icono: ${cat.icono}`)
    })
    console.log(`   Total: ${categorias.length} categorías`)
  } else {
    console.log('   No tiene categorías propias (usa solo las del sistema)')
  }

  // 4. Resumen de ventas por categoría
  console.log('\n4. RESUMEN DE VENTAS POR CATEGORÍA:')
  const { data: resumenVentas } = await supabase
    .from('caja_movimientos')
    .select('categoria_id, monto_total, caja_categorias(nombre, tipo)')
    .eq('user_id', userId)
    .eq('tipo', 'entrada')
    .eq('anulado', false)

  if (resumenVentas && resumenVentas.length > 0) {
    const porCategoria = {}
    resumenVentas.forEach(mov => {
      const catNombre = mov.caja_categorias?.nombre || 'Sin categoría'
      if (!porCategoria[catNombre]) {
        porCategoria[catNombre] = { cantidad: 0, total: 0 }
      }
      porCategoria[catNombre].cantidad++
      porCategoria[catNombre].total += parseFloat(mov.monto_total)
    })

    Object.entries(porCategoria)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([nombre, datos]) => {
        console.log(`   ${nombre}: ${datos.cantidad} operaciones - $${datos.total.toFixed(2)}`)
      })
  } else {
    console.log('   No tiene ventas registradas')
  }

  // 5. Resumen general
  console.log('\n5. RESUMEN GENERAL:')
  const { data: movimientos } = await supabase
    .from('caja_movimientos')
    .select('tipo, monto_total, anulado, fecha')
    .eq('user_id', userId)

  if (movimientos && movimientos.length > 0) {
    const activos = movimientos.filter(m => !m.anulado)
    const ingresos = activos.filter(m => m.tipo === 'entrada')
    const egresos = activos.filter(m => m.tipo === 'salida')

    const totalIngresos = ingresos.reduce((sum, m) => sum + parseFloat(m.monto_total), 0)
    const totalEgresos = egresos.reduce((sum, m) => sum + parseFloat(m.monto_total), 0)

    const fechas = activos.map(m => new Date(m.fecha))
    const primerMov = new Date(Math.min(...fechas))
    const ultimoMov = new Date(Math.max(...fechas))

    console.log(`   Total de movimientos: ${activos.length}`)
    console.log(`   Ingresos: ${ingresos.length} operaciones - $${totalIngresos.toFixed(2)}`)
    console.log(`   Egresos: ${egresos.length} operaciones - $${totalEgresos.toFixed(2)}`)
    console.log(`   Balance: $${(totalIngresos - totalEgresos).toFixed(2)}`)
    console.log(`   Primer movimiento: ${primerMov.toLocaleDateString('es-AR')}`)
    console.log(`   Último movimiento: ${ultimoMov.toLocaleDateString('es-AR')}`)
  }

  // 6. Últimos 10 movimientos
  console.log('\n6. ÚLTIMOS 10 MOVIMIENTOS:')
  const { data: ultimos } = await supabase
    .from('caja_movimientos')
    .select('fecha, hora, tipo, monto_total, caja_categorias(nombre), descripcion')
    .eq('user_id', userId)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .limit(10)

  if (ultimos && ultimos.length > 0) {
    ultimos.forEach((mov, idx) => {
      const signo = mov.tipo === 'entrada' ? '+' : '-'
      console.log(`   ${idx + 1}. ${mov.fecha} ${mov.hora} | ${mov.caja_categorias?.nombre || 'N/A'} | ${signo}$${mov.monto_total} | ${mov.descripcion || ''}`)
    })
  }

  console.log('\n' + '='.repeat(80))
}

consultarUsuario().catch(console.error)
