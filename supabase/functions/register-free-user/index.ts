import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente admin con SERVICE_ROLE_KEY (seguro en Edge Function)
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

    // Obtener datos del body
    const { email, password, nombre, apellido, whatsapp, origen, origenDetalle } = await req.json()

    // Validaciones básicas
    if (!email || !password || !nombre || !apellido) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Crear usuario con Admin API - YA CONFIRMADO
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ← Usuario confirmado al instante
      user_metadata: {
        nombre,
        apellido,
        whatsapp: whatsapp || '',
        origen: origen || 'otros',
        origen_detalle: origenDetalle || null,
        tipo_usuario: 'free'
      }
    })

    if (createError) {
      console.error('Error creando usuario:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // El trigger on_auth_user_created_free creará el perfil en usuarios_free

    // Crear sesión usando Admin API (evita el error "Email signups are disabled")
    // Usamos admin.createSession() que funciona incluso con signups deshabilitados
    const { data, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: userData.user.id
    })

    if (sessionError || !data?.session) {
      console.error('Error creando sesión:', sessionError)
      // Usuario creado exitosamente, pero no pudimos hacer auto-login
      // El usuario puede loguearse manualmente
      return new Response(
        JSON.stringify({
          user: userData.user,
          session: null,
          message: 'Cuenta creada exitosamente. Por favor inicia sesión manualmente.',
          needsManualLogin: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        user: userData.user,
        session: data.session,
        message: 'Cuenta creada exitosamente',
        needsManualLogin: false
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error general:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
