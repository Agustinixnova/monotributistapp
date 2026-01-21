// Script para corregir "Venta online" a "Venta offline"
// Usuario: elizabeth3612@hotmail.com
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhwiezngaprzoqcvutbx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'
const userEmail = 'elizabeth3612@hotmail.com'

const supabase = createClient(supabaseUrl, supabaseKey)

async function corregirVentas() {
  console.log('='.repeat(80))
  console.log('CORRECCIÓN: Venta online → Venta offline')
  console.log('Usuario:', userEmail)
  console.log('='.repeat(80))

  // 1. Buscar el user_id por email
  console.log('\n1. Buscando usuario...')
  const { data: perfil, error: perfilError } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email')
    .eq('email', userEmail)
    .single()

  if (perfilError || !perfil) {
    console.log('❌ No se encontró el usuario con ese email')
    return
  }

  const userId = perfil.id
  console.log(`✓ Usuario encontrado:`)
  console.log(`  ID: ${userId}`)
  console.log(`  Nombre: ${perfil.nombre} ${perfil.apellido || ''}`)

  // 2. Buscar categorías
  console.log('\n2. Buscando categorías...')
  const { data: categorias } = await supabase
    .from('caja_categorias')
    .select('*')
    .in('nombre', ['Venta online', 'Venta offline'])

  if (!categorias || categorias.length === 0) {
    console.log('❌ No se encontraron las categorías')
    return
  }

  const catOnline = categorias.find(c => c.nombre === 'Venta online')
  const catOffline = categorias.find(c => c.nombre === 'Venta offline')

  if (!catOnline) {
    console.log('❌ No se encontró la categoría "Venta online"')
    return
  }

  if (!catOffline) {
    console.log('❌ No se encontró la categoría "Venta offline"')
    return
  }

  console.log('✓ Categorías encontradas:')
  console.log(`  Venta online:  ${catOnline.id}`)
  console.log(`  Venta offline: ${catOffline.id}`)

  // 3. Contar movimientos en "Venta online"
  console.log('\n3. Contando movimientos en "Venta online"...')
  const { data: movOnline, count } = await supabase
    .from('caja_movimientos')
    .select('id, fecha, hora, monto_total, descripcion', { count: 'exact' })
    .eq('user_id', userId)
    .eq('categoria_id', catOnline.id)
    .eq('anulado', false)
    .order('fecha', { ascending: false })

  console.log(`✓ Movimientos encontrados: ${count || 0}`)

  if (movOnline && movOnline.length > 0) {
    console.log('\n  Movimientos a corregir:')
    movOnline.forEach((mov, idx) => {
      console.log(`  ${idx + 1}. ${mov.fecha} ${mov.hora} - $${mov.monto_total} - ${mov.descripcion || '(sin descripción)'}`)
    })

    const totalMonto = movOnline.reduce((sum, m) => sum + parseFloat(m.monto_total), 0)
    console.log(`\n  Total a mover: $${totalMonto.toFixed(2)}`)
  }

  if (!movOnline || movOnline.length === 0) {
    console.log('\n✅ No hay movimientos para corregir. Todo está bien.')
    return
  }

  // 4. Confirmar antes de actualizar
  console.log('\n4. Realizando actualización...')
  console.log(`   Cambiando ${movOnline.length} movimientos de:`)
  console.log(`   "${catOnline.nombre}" → "${catOffline.nombre}"`)

  // 5. Hacer la actualización
  const { data: updated, error: updateError } = await supabase
    .from('caja_movimientos')
    .update({ categoria_id: catOffline.id })
    .eq('user_id', userId)
    .eq('categoria_id', catOnline.id)
    .eq('anulado', false)
    .select()

  if (updateError) {
    console.log('\n❌ Error al actualizar:', updateError.message)
    return
  }

  console.log(`\n✅ Actualización completada: ${updated?.length || 0} movimientos`)

  // 6. Verificar resultado final
  console.log('\n5. Verificando resultado...')
  const { count: countOnlineFinal } = await supabase
    .from('caja_movimientos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('categoria_id', catOnline.id)
    .eq('anulado', false)

  const { count: countOfflineFinal } = await supabase
    .from('caja_movimientos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('categoria_id', catOffline.id)
    .eq('anulado', false)

  console.log('\n  Resultado final:')
  console.log(`  Venta online:  ${countOnlineFinal || 0} movimientos`)
  console.log(`  Venta offline: ${countOfflineFinal || 0} movimientos`)

  console.log('\n' + '='.repeat(80))
  console.log('✅ CORRECCIÓN COMPLETADA EXITOSAMENTE')
  console.log('='.repeat(80))
}

corregirVentas().catch(console.error)
