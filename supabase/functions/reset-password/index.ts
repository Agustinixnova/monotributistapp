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

    // Verificar que el usuario que hace la request tiene permisos
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar que el usuario tiene rol con permisos para resetear contraseñas
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', requestingUser.id)
      .single()

    const allowedRoles = ['admin', 'contadora_principal', 'desarrollo', 'comunicadora']
    if (!profile?.role?.name || !allowedRoles.includes(profile.role.name)) {
      return new Response(
        JSON.stringify({ success: false, error: 'No tenés permisos para realizar esta acción' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Obtener datos del body
    const body = await req.json()
    const { userId, newPassword } = body

    // Validar campos requeridos
    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Faltan campos requeridos: userId, newPassword' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validar longitud mínima de contraseña
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verificar que el usuario objetivo existe
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !targetUser?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Resetear la contraseña
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (updateError) {
      console.error('Error reseteando contraseña:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: `Error al resetear contraseña: ${updateError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Contraseña reseteada para usuario ${userId} por ${requestingUser.email}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contraseña actualizada exitosamente'
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
