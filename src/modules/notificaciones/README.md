# Módulo Notificaciones

Sistema de notificaciones y alertas para usuarios.

## Tipos de notificaciones

- `riesgo_exclusion`: Cliente cerca del límite máximo
- `cerca_recategorizacion`: Cliente debe considerar recategorizar
- `vencimiento_cuota`: Próximo vencimiento de cuota
- `cuota_vencida`: Cuota no pagada
- `recategorizacion_periodica`: Período de recategorización
- `facturacion_pendiente`: Cliente no cargó facturación
- `mensaje_nuevo`: Mensaje del chat
- `documento_nuevo`: Documento compartido
- `sistema`: Notificaciones generales

## Funciones SQL

- `crear_notificacion()`: Solo callable desde service_role
- `marcar_notificacion_leida()`: Usuario marca como leída
- `marcar_todas_notificaciones_leidas()`: Marcar todas
