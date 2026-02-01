import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Edge Function para recibir webhooks de Vercel
 * Captura errores de deploy y los guarda en error_logs
 *
 * Configurar en Vercel:
 * Settings → Webhooks → Add → URL: https://nhwiezngaprzoqcvutbx.supabase.co/functions/v1/vercel-webhook
 * Events: deployment.error, deployment.failed
 */

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

    // Parsear el payload del webhook de Vercel
    const payload = await req.json()

    console.log('Webhook recibido de Vercel:', JSON.stringify(payload, null, 2))

    // Vercel envía diferentes tipos de eventos
    const eventType = payload.type || 'unknown'
    const deployment = payload.payload?.deployment || payload.deployment || {}
    const project = payload.payload?.project || payload.project || {}

    // Solo nos interesan los errores/fallos
    const isError = eventType.includes('error') ||
                    eventType.includes('failed') ||
                    deployment.state === 'ERROR' ||
                    deployment.readyState === 'ERROR'

    if (!isError) {
      console.log('Evento no es error, ignorando:', eventType)
      return new Response(
        JSON.stringify({ success: true, message: 'Evento ignorado (no es error)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Extraer información del error
    const errorMessage = deployment.errorMessage ||
                        deployment.error?.message ||
                        `Deploy fallido: ${eventType}`

    const errorHash = `vercel_${project.name || 'unknown'}_${deployment.id || Date.now()}`

    // Construir contexto detallado
    const contexto = {
      deployment_id: deployment.id || null,
      deployment_url: deployment.url || null,
      project_name: project.name || null,
      project_id: project.id || null,
      git_branch: deployment.meta?.githubCommitRef || deployment.gitSource?.ref || null,
      git_commit: deployment.meta?.githubCommitSha || deployment.gitSource?.sha || null,
      git_message: deployment.meta?.githubCommitMessage || null,
      git_author: deployment.meta?.githubCommitAuthorName || null,
      created_at: deployment.createdAt || null,
      build_error: deployment.errorMessage || null,
      event_type: eventType,
      full_payload: payload
    }

    // Guardar en error_logs
    const { data, error } = await supabaseAdmin
      .from('error_logs')
      .insert({
        error_hash: errorHash,
        mensaje: errorMessage.substring(0, 500), // Limitar longitud
        stack_trace: JSON.stringify(deployment.error || {}, null, 2),
        url: deployment.url || `https://vercel.com/${project.name}`,
        navegador: 'Vercel CI/CD',
        viewport: 'N/A',
        modulo: 'deploy',
        severidad: 'fatal',
        tipo: 'deploy',
        accion_previa: `Git push a ${contexto.git_branch || 'unknown branch'}`,
        contexto: contexto,
        version_app: contexto.git_commit?.substring(0, 7) || null
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error guardando en error_logs:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Error de deploy guardado con ID:', data.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Error de deploy registrado',
        error_id: data.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error procesando webhook:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
