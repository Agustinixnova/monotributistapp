# Actualizar Configuración Bucket buzon-adjuntos

## 🎯 Objetivo
Permitir archivos más grandes (videos hasta 100MB) y nuevos tipos de archivo (Word, videos)

## 📋 Instrucciones

### 1. Ir al Dashboard de Supabase
```
https://supabase.com/dashboard/project/nhwiezngaprzoqcvutbx/storage/buckets
```

### 2. Editar bucket `buzon-adjuntos`
- Clic en los 3 puntos al lado de "buzon-adjuntos"
- Clic en "Edit bucket"

### 3. Actualizar configuración

**File size limit:**
- Cambiar de `10 MB` a `100 MB`

**Allowed MIME types:**
```
application/pdf
application/msword
application/vnd.openxmlformats-officedocument.wordprocessingml.document
image/jpeg
image/png
image/jpg
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
application/vnd.ms-excel
video/mp4
video/quicktime
video/x-msvideo
video/webm
video/x-matroska
```

**O más simple (recomendado):**
Seleccionar:
- ✅ Documents (incluye PDF, Word)
- ✅ Images (incluye JPEG, PNG)
- ✅ Spreadsheets (incluye Excel)
- ✅ Videos (incluye todos los formatos)

### 4. Guardar cambios
Clic en "Save" o "Update bucket"

## ✅ Verificación

Una vez actualizado el bucket:

1. Ir al módulo Buzón en la app
2. Crear nuevo mensaje
3. Intentar adjuntar un video (MP4) de más de 10MB
4. Verificar que se sube correctamente

## 📝 Cambios realizados en el código

- `src/modules/buzon/services/adjuntosService.js`: Límite aumentado a 100MB y nuevos tipos MIME
- `src/modules/buzon/components/ModalNuevoMensaje.jsx`: Accept attribute actualizado con Word y videos
- Iconos actualizados: FileText para documentos, Video para videos

## ⚠️ IMPORTANTE

Si no actualizas el bucket, los usuarios podrán seleccionar archivos Word y videos, pero la subida fallará al exceder los límites del bucket.
