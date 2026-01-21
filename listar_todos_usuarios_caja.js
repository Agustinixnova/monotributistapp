// Script para listar TODOS los usuarios con movimientos en Caja Diaria
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhwiezngaprzoqcvutbx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function listarTodosUsuarios() {
  console.log('='.repeat(80))
  console.log('TODOS LOS USUARIOS CON MOVIMIENTOS EN CAJA DIARIA')
  console.log('='.repeat(80))

  // 1. Obtener todos los user_id únicos de caja_movimientos
  const { data: movimientos } = await supabase
    .from('caja_movimientos')
    .select('user_id, categoria_id, tipo, monto_total, fecha, caja_categorias(nombre, tipo)')
    .order('fecha', { ascending: false })
    .limit(1000)

  if (!movimientos || movimientos.length === 0) {
    console.log('\n❌ No hay ningún movimiento en la base de datos')
    return
  }

  // Agrupar por usuario
  const porUsuario = {}
  movimientos.forEach(mov => {
    if (!porUsuario[mov.user_id]) {
      porUsuario[mov.user_id] = {
        movimientos: [],
        categorias: {},
        primerMov: mov.fecha,
        ultimoMov: mov.fecha
      }
    }

    porUsuario[mov.user_id].movimientos.push(mov)

    const catNombre = mov.caja_categorias?.nombre || 'Sin categoría'
    if (!porUsuario[mov.user_id].categorias[catNombre]) {
      porUsuario[mov.user_id].categorias[catNombre] = {
        cantidad: 0,
        total: 0,
        tipo: mov.caja_categorias?.tipo || mov.tipo
      }
    }
    porUsuario[mov.user_id].categorias[catNombre].cantidad++
    porUsuario[mov.user_id].categorias[catNombre].total += parseFloat(mov.monto_total)

    if (mov.fecha < porUsuario[mov.user_id].primerMov) {
      porUsuario[mov.user_id].primerMov = mov.fecha
    }
    if (mov.fecha > porUsuario[mov.user_id].ultimoMov) {
      porUsuario[mov.user_id].ultimoMov = mov.fecha
    }
  })

  // Obtener perfiles
  const userIds = Object.keys(porUsuario)
  const { data: perfiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email')
    .in('id', userIds)

  console.log(`\nEncontrados ${userIds.length} usuarios con movimientos:\n`)

  for (const userId of userIds) {
    const perfil = perfiles?.find(p => p.id === userId)
    const datos = porUsuario[userId]

    console.log('='.repeat(80))
    console.log(`\n📊 Usuario ID: ${userId}`)

    if (perfil) {
      console.log(`   Nombre: ${perfil.nombre || '(sin nombre)'} ${perfil.apellido || ''}`)
      console.log(`   Email: ${perfil.email}`)
    } else {
      console.log(`   ⚠️  Sin perfil en la tabla profiles`)
    }

    console.log(`   Total movimientos: ${datos.movimientos.length}`)
    console.log(`   Período: ${datos.primerMov} a ${datos.ultimoMov}`)

    console.log(`\n   Categorías usadas:`)
    Object.entries(datos.categorias)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([nombre, info]) => {
        console.log(`     • ${nombre} [${info.tipo}]: ${info.cantidad} ops - $${info.total.toFixed(2)}`)
      })

    console.log('')
  }

  console.log('='.repeat(80))
}

listarTodosUsuarios().catch(console.error)
