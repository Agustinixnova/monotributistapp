# Modulo Buzon de Mensajes

## Descripcion
Sistema de mensajeria interna entre clientes y contadoras. Permite a los clientes contactar a su contadora desde diferentes partes de la app.

## Componentes
- `BuzonPage.jsx` - Pagina principal con lista de conversaciones y chat
- `ModalEnviarMensaje.jsx` - Modal reutilizable para enviar nuevos mensajes

## Services
- `buzonService.js` - CRUD de conversaciones y mensajes

## Uso del Modal Reutilizable

```jsx
import { ModalEnviarMensaje } from '../modules/buzon/components/ModalEnviarMensaje'

// Uso basico
<ModalEnviarMensaje
  onClose={() => setShowModal(false)}
  onSuccess={(conversacionId) => console.log('Enviado:', conversacionId)}
/>

// Con asunto predefinido (no editable)
<ModalEnviarMensaje
  asunto="Riesgo de Exclusion"
  asuntoEditable={false}
  origen="exclusion"
  origenReferencia={{ clientId: '...', mes: 1, anio: 2026 }}
  onClose={() => setShowModal(false)}
  onSuccess={(conversacionId) => console.log('Enviado:', conversacionId)}
/>
```

## Props del Modal
| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| asunto | string | '' | Asunto predefinido |
| asuntoEditable | boolean | true | Si el usuario puede editar el asunto |
| origen | string | 'general' | Contexto de origen (facturacion, exclusion, etc.) |
| origenReferencia | object | null | Datos adicionales del contexto |
| onClose | function | required | Funcion para cerrar el modal |
| onSuccess | function | - | Callback al enviar exitosamente |

## Flujo de Mensajes

### Cliente envia mensaje:
1. Cliente envia mensaje
2. Se crea conversacion y se agregan participantes automaticamente:
   - El cliente
   - admin, contadora_principal, desarrollo, comunicadora
   - contador_secundario asignado (si tiene)
3. Participantes ven la conversacion en su buzon
4. Pueden responder y el hilo se actualiza
5. Contadoras pueden cerrar conversaciones resueltas

### Contadora envia mensaje:
1. Contadora abre modal "Nuevo mensaje"
2. Selecciona destinatarios:
   - **Individual**: Buscar y seleccionar clientes especificos
   - **Grupo**: Todos los clientes, Solo Monotributistas, Solo Resp. Inscriptos
3. Escribe asunto y mensaje
4. Se crea conversacion con los destinatarios seleccionados

### Roles que pueden seleccionar destinatarios:
- `admin`
- `contadora_principal`
- `desarrollo`
- `comunicadora`

## Tabla SQL
- `SQL_tables/27_buzon_mensajes.sql` - Tablas base
- `SQL_tables/27b_buzon_mensajes_contadora.sql` - Funciones para envio a destinatarios

## Ultima actualizacion
12-01-2026 - Agregada funcionalidad de envio a usuarios/grupos para contadoras
