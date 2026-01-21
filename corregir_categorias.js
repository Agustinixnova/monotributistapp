// Script para corregir categorías de ventas
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhwiezngaprzoqcvutbx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5od2llem5nYXByem9xY3Z1dGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5OTQsImV4cCI6MjA4MzkxMjk5NH0.LbQ7w36ChLcgn3dyoiLZhW3pu7U4HpIJVQGlDcV0h2A'
const userId = 'c671f12e-d88c-45e2-86c7-a37a8040492d'

const supabase = createClient(supabaseUrl, supabaseKey)

async function corregirCategorias() {
  console.log('='.repeat(80))
  console.log('CORRECCIÓN DE CATEGORÍAS - Usuario:', userId)
  console.log('='.repeat(80))

  // 1. Buscar categorías "Venta online" y "Venta offline"
  console.log('\n1. Buscando categorías...')

  const { data: categorias } = await supabase
    .from('caja_categorias')
    .select('*')
    .or(`nombre.ilike.%venta online%,nombre.ilike.%venta offline%`)

  console.log('Categorías encontradas:')
  categorias?.forEach(cat => {
    console.log(`   - ${cat.nombre} (ID: ${cat.id}, User: ${cat.user_id || 'sistema'})`)
  })

  // Identificar IDs
  const catOnline = categorias?.find(c => c.nombre.toLowerCase().includes('online'))
  const catOffline = categorias?.find(c => c.nombre.toLowerCase().includes('offline'))

  if (!catOnline) {
    console.log('\n❌ No se encontró la categoría "Venta online"')
    return
  }

  if (!catOffline) {
    console.log('\n❌ No se encontró la categoría "Venta offline"')
    return
  }

  console.log(`\n2. Categorías identificadas:`)
  console.log(`   Venta Online:  ${catOnline.id}`)
  console.log(`   Venta Offline: ${catOffline.id}`)

  // 2. Contar movimientos en "Venta online" de este usuario
  const { data: movimientosOnline, count: countOnline } = await supabase
    .from('caja_movimientos')
    .select('id, fecha, hora, monto_total, descripcion', { count: 'exact' })
    .eq('user_id', userId)
    .eq('categoria_id', catOnline.id)
    .order('fecha', { ascending: false })

  console.log(`\n3. Movimientos en "Venta online": ${countOnline || 0}`)

  if (movimientosOnline && movimientosOnline.length > 0) {
    console.log('\n   Primeros 5 movimientos a corregir:')
    movimientosOnline.slice(0, 5).forEach((mov, idx) => {
      console.log(`   ${idx + 1}. ${mov.fecha} ${mov.hora} - $${mov.monto_total} - ${mov.descripcion || 'sin descripción'}`)
    })
  }

  // 3. Contar movimientos actuales en "Venta offline"
  const { count: countOffline } = await supabase
    .from('caja_movimientos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('categoria_id', catOffline.id)

  console.log(`\n4. Movimientos actuales en "Venta offline": ${countOffline || 0}`)

  if (!movimientosOnline || movimientosOnline.length === 0) {
    console.log('\n✅ No hay movimientos para corregir')
    return
  }

  // 4. Hacer la actualización
  console.log(`\n5. Actualizando ${movimientosOnline.length} movimientos...`)
  console.log(`   De: Venta online (${catOnline.id})`)
  console.log(`   A:  Venta offline (${catOffline.id})`)

  const { data, error } = await supabase
    .from('caja_movimientos')
    .update({ categoria_id: catOffline.id })
    .eq('user_id', userId)
    .eq('categoria_id', catOnline.id)
    .select()

  if (error) {
    console.log('\n❌ Error al actualizar:', error.message)
    return
  }

  console.log(`\n✅ Actualización completada: ${data?.length || 0} movimientos corregidos`)

  // 5. Verificar resultado
  const { count: countOnlineNuevo } = await supabase
    .from('caja_movimientos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('categoria_id', catOnline.id)

  const { count: countOfflineNuevo } = await supabase
    .from('caja_movimientos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('categoria_id', catOffline.id)

  console.log('\n6. Resultado final:')
  console.log(`   Venta online:  ${countOnlineNuevo || 0} movimientos`)
  console.log(`   Venta offline: ${countOfflineNuevo || 0} movimientos`)

  console.log('\n' + '='.repeat(80))
  console.log('✅ CORRECCIÓN COMPLETADA')
  console.log('='.repeat(80))
}

corregirCategorias().catch(console.error)
