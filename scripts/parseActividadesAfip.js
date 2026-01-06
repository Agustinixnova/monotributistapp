/**
 * Script para convertir el archivo TXT de actividades AFIP a JSON
 *
 * Uso: node scripts/parseActividadesAfip.js
 *
 * Cuando AFIP actualice el archivo, solo hay que:
 * 1. Reemplazar src/utils/ACTIVIDADES_ECONOMICAS_F883.txt
 * 2. Ejecutar: node scripts/parseActividadesAfip.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INPUT_PATH = path.join(__dirname, '../src/utils/ACTIVIDADES_ECONOMICAS_F883.txt')
const OUTPUT_PATH = path.join(__dirname, '../src/utils/actividadesAfip.json')

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-z0-9\s]/g, ' ')    // Solo letras, numeros y espacios
    .replace(/\s+/g, ' ')            // Multiples espacios a uno
    .trim()
}

function parseFile() {
  console.log('Leyendo archivo:', INPUT_PATH)

  const content = fs.readFileSync(INPUT_PATH, 'utf-8')
  const lines = content.split('\n')

  const actividades = []
  let skipped = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Saltar linea vacia o header
    if (!line || line.startsWith('COD_ACTIVIDAD')) {
      skipped++
      continue
    }

    const parts = line.split(';')

    if (parts.length >= 2) {
      const codigo = parts[0].trim()
      const descripcionCorta = parts[1].trim()
      const descripcionLarga = parts[2]?.trim() || descripcionCorta

      // Validar que el codigo sea numerico
      if (!/^\d+$/.test(codigo)) {
        skipped++
        continue
      }

      actividades.push({
        codigo,
        descripcion: descripcionCorta,
        descripcionLarga,
        // Texto normalizado para busqueda
        busqueda: normalizeText(descripcionCorta + ' ' + descripcionLarga)
      })
    }
  }

  // Ordenar por codigo
  actividades.sort((a, b) => a.codigo.localeCompare(b.codigo))

  console.log(`Procesadas ${actividades.length} actividades (${skipped} lineas omitidas)`)

  // Guardar JSON
  const output = {
    version: new Date().toISOString().split('T')[0],
    total: actividades.length,
    actividades
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log('Archivo generado:', OUTPUT_PATH)

  // Mostrar algunas actividades de ejemplo
  console.log('\nEjemplos:')
  console.log('- ', actividades[0].codigo, actividades[0].descripcion)
  console.log('- ', actividades[100]?.codigo, actividades[100]?.descripcion)
  console.log('- ', actividades[500]?.codigo, actividades[500]?.descripcion)
}

parseFile()
