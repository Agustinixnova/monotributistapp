import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente con service role para operaciones admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar autenticación
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(token)

    if (!requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar que el usuario que hace la petición tiene permisos de admin
    const { data: requestingProfile } = await supabaseAdmin
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', requestingUser.id)
      .single()

    const allowedRoles = ['admin', 'contadora_principal', 'desarrollo']
    const userRole = requestingProfile?.role?.name

    if (!userRole || !allowedRoles.includes(userRole)) {
      return new Response(
        JSON.stringify({ success: false, error: 'No tenés permisos para eliminar usuarios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Obtener userId del body
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere userId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // No permitir auto-eliminación
    if (userId === requestingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'No podés eliminarte a vos mismo' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Eliminando usuario: ${userId}`)

    // 1. Obtener información del usuario a eliminar
    const { data: userToDelete } = await supabaseAdmin
      .from('profiles')
      .select('email, nombre, apellido')
      .eq('id', userId)
      .single()

    if (!userToDelete) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // 2. Eliminar datos relacionados (en orden para respetar foreign keys)

    // Eliminar acceso a módulos
    await supabaseAdmin
      .from('user_module_access')
      .delete()
      .eq('user_id', userId)

    // Eliminar datos fiscales si existen
    const { data: fiscalData } = await supabaseAdmin
      .from('client_fiscal_data')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (fiscalData?.id) {
      // Eliminar locales
      await supabaseAdmin
        .from('client_locales')
        .delete()
        .eq('client_id', fiscalData.id)

      // Eliminar grupo familiar
      await supabaseAdmin
        .from('client_grupo_familiar')
        .delete()
        .eq('client_id', fiscalData.id)

      // Eliminar historial de categorías
      await supabaseAdmin
        .from('client_historial_categorias')
        .delete()
        .eq('client_id', fiscalData.id)

      // Eliminar cargas de facturación
      await supabaseAdmin
        .from('client_facturacion_cargas')
        .delete()
        .eq('client_id', fiscalData.id)

      // Eliminar datos fiscales
      await supabaseAdmin
        .from('client_fiscal_data')
        .delete()
        .eq('id', fiscalData.id)
    }

    // 3. Eliminar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error eliminando perfil:', profileError)
      return new Response(
        JSON.stringify({ success: false, error: `Error eliminando perfil: ${profileError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 4. Eliminar usuario de auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error eliminando de auth:', authError)
      // No es crítico si falla auth, el perfil ya fue eliminado
      console.log('El perfil fue eliminado pero hubo error en auth.users')
    }

    console.log(`Usuario ${userToDelete.email} eliminado exitosamente`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuario ${userToDelete.nombre} ${userToDelete.apellido} eliminado exitosamente`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error general:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
