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

  // Version: 2.0 - Using admin.createSession()
  console.log('Edge Function Version 2.0 - admin.createSession')

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
    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { email, password, nombre, apellido, whatsapp, origen, origen_detalle, role_name } = requestBody

    // Log para debugging
    console.log('Received request:', { email, nombre, apellido, role_name, hasPassword: !!password })

    // Validaciones básicas
    if (!email || !password || !nombre || !apellido) {
      console.error('Missing required fields:', { email: !!email, password: !!password, nombre: !!nombre, apellido: !!apellido })
      return new Response(
        JSON.stringify({
          error: 'Faltan campos requeridos',
          details: {
            email: !email ? 'requerido' : 'ok',
            password: !password ? 'requerido' : 'ok',
            nombre: !nombre ? 'requerido' : 'ok',
            apellido: !apellido ? 'requerido' : 'ok'
          }
        }),
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
        origen_detalle: origen_detalle || null,
        tipo_usuario: 'free',
        role_name: role_name || 'operador_gastos' // Rol por defecto o especificado
      }
    })

    if (createError) {
      console.error('Error creando usuario:', createError)

      // Mensaje específico para email duplicado
      const errorMessage = createError.message?.includes('already been registered') || createError.code === 'email_exists'
        ? 'Este email ya está registrado. Por favor inicia sesión o usa otro email.'
        : createError.message || 'Error al crear el usuario'

      return new Response(
        JSON.stringify({
          error: errorMessage,
          code: createError.code
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // El trigger on_auth_user_created_free creará el perfil en usuarios_free
    console.log('Usuario creado exitosamente:', userData.user.id)

    // Usuario creado con éxito - el usuario debe hacer login manualmente
    // (auto-login no es posible con signups deshabilitados)
    return new Response(
      JSON.stringify({
        user: userData.user,
        userId: userData.user.id, // Para uso en creación de empleados
        session: null,
        message: 'Cuenta creada exitosamente. Por favor inicia sesión.',
        needsManualLogin: true
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
