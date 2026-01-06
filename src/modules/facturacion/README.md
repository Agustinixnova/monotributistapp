# Módulo Facturación

Sistema de registro y seguimiento de facturación mensual de clientes monotributistas.

## Funcionalidades

### Para Contadora (admin, contadora_principal, desarrollo, comunicadora)
- Ver resumen de facturación de todos los clientes
- Cargar facturación mensual (total o detallada)
- Revisar y aprobar facturación cargada por clientes
- Ver alertas de recategorización/exclusión
- Cerrar meses

### Para Cliente Autónomo (gestion_facturacion = 'autonomo')
- Ver su situación vs tope de categoría
- Cargar total facturado mensual
- Adjuntar comprobantes
- Ver historial

### Para Cliente Dependiente (gestion_facturacion = 'contadora')
- Ver su situación vs tope (solo lectura)
- Ver historial de facturación

## Estructura

```
facturacion/
├── components/         # Componentes React
├── hooks/              # Custom hooks
├── services/           # Llamadas a Supabase
└── utils/              # Funciones auxiliares
```

## Tablas Supabase

- `client_facturacion_mensual`: Registro mensual
- `client_facturas_detalle`: Detalle individual (opcional)

## Storage

- Bucket: `facturas`
- Path: `<userId>/<anio>/<mes>/<filename>`
