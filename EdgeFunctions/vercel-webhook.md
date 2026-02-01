# Edge Function: vercel-webhook

## Propósito
Recibe webhooks de Vercel cuando un deploy falla y guarda el error en la tabla `error_logs` para visualizarlo en el Panel de Errores de Dev Tools.

## URL
```
https://nhwiezngaprzoqcvutbx.supabase.co/functions/v1/vercel-webhook
```

## Método
`POST`

## Autenticación
No requiere autenticación (es llamado por Vercel).

## Payload (enviado por Vercel)
```json
{
  "type": "deployment.error",
  "payload": {
    "deployment": {
      "id": "dpl_xxx",
      "url": "my-app.vercel.app",
      "state": "ERROR",
      "errorMessage": "Build failed...",
      "meta": {
        "githubCommitRef": "main",
        "githubCommitSha": "abc123",
        "githubCommitMessage": "fix: something",
        "githubCommitAuthorName": "Agustin"
      }
    },
    "project": {
      "id": "prj_xxx",
      "name": "monotributistapp"
    }
  }
}
```

## Respuesta Exitosa
```json
{
  "success": true,
  "message": "Error de deploy registrado",
  "error_id": "uuid-del-error"
}
```

## Campos guardados en error_logs
| Campo | Valor |
|-------|-------|
| tipo | `deploy` |
| severidad | `fatal` |
| modulo | `deploy` |
| navegador | `Vercel CI/CD` |
| mensaje | Error message de Vercel |
| contexto | Info completa del deploy (branch, commit, autor, etc.) |

## Configuración en Vercel

1. Ir a tu proyecto en Vercel
2. Settings → Webhooks
3. Click "Add Webhook"
4. Configurar:
   - **Name:** Deploy Errors to Supabase
   - **URL:** `https://nhwiezngaprzoqcvutbx.supabase.co/functions/v1/vercel-webhook`
   - **Events:** Seleccionar:
     - `deployment.error`
     - `deployment.failed` (si está disponible)
5. Save

## Desplegar la función

```bash
supabase functions deploy vercel-webhook --no-verify-jwt
```

Nota: `--no-verify-jwt` es necesario porque Vercel no envía JWT de Supabase.

## Última actualización
2026-02-01 - Creación inicial
