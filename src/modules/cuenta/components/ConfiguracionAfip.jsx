/**
 * Componente de Configuración AFIP
 *
 * Permite configurar la facturación electrónica de forma simple:
 * - CUIT y razón social
 * - Punto de venta
 * - Certificados (.crt y .key)
 * - Ambiente (testing/producción)
 */

import { useState, useEffect } from 'react'
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Info,
  Shield,
  Key,
  Download,
  Copy,
  Image,
  Trash2
} from 'lucide-react'
import * as forge from 'node-forge'
import { supabase } from '../../../lib/supabase'
import {
  getConfiguracionAfip,
  guardarConfiguracionAfip,
  verificarConexionAfip
} from '../../agenda-turnos/services/afipService'
import ModalRecortarLogo from './ModalRecortarLogo'

export default function ConfiguracionAfip() {
  const [duenioId, setDuenioId] = useState(null)
  const [config, setConfig] = useState({
    cuit: '',
    razon_social: '',
    domicilio_fiscal: '',
    punto_venta: '',
    ambiente: 'testing',
    certificado_crt: '',
    clave_privada_key: '',
    logo_url: ''
  })
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const [mostrarRecortador, setMostrarRecortador] = useState(false)
  const [imagenParaRecortar, setImagenParaRecortar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [estadoConexion, setEstadoConexion] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [csrGenerado, setCsrGenerado] = useState('')

  // Obtener usuario y cargar configuración
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setDuenioId(user.id)
      }
    }
    init()
  }, [])

  // Cargar configuración cuando tenemos el duenioId
  useEffect(() => {
    if (duenioId) {
      cargarConfiguracion()
    }
  }, [duenioId])

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      const data = await getConfiguracionAfip(duenioId)
      if (data) {
        setConfig({
          cuit: data.cuit || '',
          razon_social: data.razon_social || '',
          domicilio_fiscal: data.domicilio_fiscal || '',
          punto_venta: data.punto_venta?.toString() || '',
          ambiente: data.ambiente || 'testing',
          certificado_crt: data.certificado_crt || '',
          clave_privada_key: data.clave_privada_key || '',
          logo_url: data.logo_url || ''
        })
        // Si hay config, verificar conexión
        if (data.certificado_crt && data.clave_privada_key) {
          verificarConexion()
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar la configuración' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (campo, valor) => {
    setConfig(prev => ({ ...prev, [campo]: valor }))
    setMensaje(null)
  }

  const handleFileUpload = async (campo, file) => {
    try {
      const contenido = await file.text()
      handleChange(campo, contenido)
      setMensaje({ tipo: 'success', texto: `Archivo ${campo === 'certificado_crt' ? 'certificado' : 'clave privada'} cargado` })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al leer el archivo' })
    }
  }

  // Generar clave privada y CSR
  const generarCertificados = async () => {
    if (!config.cuit || config.cuit.length !== 11) {
      setMensaje({ tipo: 'error', texto: 'Primero ingresá tu CUIT (11 dígitos)' })
      return
    }
    if (!config.razon_social) {
      setMensaje({ tipo: 'error', texto: 'Primero ingresá tu razón social' })
      return
    }

    try {
      setGenerando(true)
      setMensaje(null)

      // Generar par de claves RSA (2048 bits)
      const keys = forge.pki.rsa.generateKeyPair(2048)

      // Crear CSR
      const csr = forge.pki.createCertificationRequest()
      csr.publicKey = keys.publicKey

      // Configurar atributos del CSR para AFIP
      csr.setSubject([
        { name: 'countryName', value: 'AR' },
        { name: 'organizationName', value: config.razon_social },
        { name: 'commonName', value: 'mimonotributo' },
        { shortName: 'serialNumber', value: `CUIT ${config.cuit}` }
      ])

      // Firmar el CSR
      csr.sign(keys.privateKey, forge.md.sha256.create())

      // Convertir a PEM
      const csrPem = forge.pki.certificationRequestToPem(csr)
      const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey)

      // Guardar clave privada en el estado
      handleChange('clave_privada_key', privateKeyPem)
      setCsrGenerado(csrPem)

      setMensaje({
        tipo: 'success',
        texto: 'Clave privada y CSR generados. Ahora descargá el CSR y subilo a AFIP.'
      })
    } catch (error) {
      console.error('Error generando certificados:', error)
      setMensaje({ tipo: 'error', texto: 'Error al generar los certificados: ' + error.message })
    } finally {
      setGenerando(false)
    }
  }

  // Descargar CSR como archivo
  const descargarCSR = () => {
    const blob = new Blob([csrGenerado], { type: 'application/pkcs10' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solicitud_${config.cuit}.csr`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copiar CSR al portapapeles
  const copiarCSR = async () => {
    try {
      await navigator.clipboard.writeText(csrGenerado)
      setMensaje({ tipo: 'success', texto: 'CSR copiado al portapapeles' })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al copiar' })
    }
  }

  // Manejar selección de archivo de logo - abre el recortador
  const handleLogoSelect = (file) => {
    if (!file) return

    // Validar tipo de archivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!tiposPermitidos.includes(file.type)) {
      setMensaje({ tipo: 'error', texto: 'Solo se permiten imágenes JPG, PNG, WebP o SVG' })
      return
    }

    // Validar tamaño (5MB máximo para la imagen original)
    if (file.size > 5 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'La imagen no puede superar 5MB' })
      return
    }

    // Convertir a URL para el recortador
    const reader = new FileReader()
    reader.onload = () => {
      setImagenParaRecortar(reader.result)
      setMostrarRecortador(true)
    }
    reader.readAsDataURL(file)
  }

  // Subir logo recortado a Supabase Storage
  const handleLogoRecortado = async (fileRecortado) => {
    setMostrarRecortador(false)
    setImagenParaRecortar(null)

    try {
      setSubiendoLogo(true)
      setMensaje(null)

      // Generar nombre único
      const nombreArchivo = `${duenioId}/logo_${Date.now()}.png`

      // Si ya hay un logo, eliminarlo primero
      if (config.logo_url) {
        const urlAnterior = config.logo_url
        const pathAnterior = urlAnterior.split('/logos-facturacion/')[1]
        if (pathAnterior) {
          await supabase.storage.from('logos-facturacion').remove([pathAnterior])
        }
      }

      // Subir nuevo logo
      const { data, error } = await supabase.storage
        .from('logos-facturacion')
        .upload(nombreArchivo, fileRecortado, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('logos-facturacion')
        .getPublicUrl(nombreArchivo)

      handleChange('logo_url', urlData.publicUrl)
      setMensaje({ tipo: 'success', texto: 'Logo subido correctamente' })
    } catch (error) {
      console.error('Error subiendo logo:', error)
      setMensaje({ tipo: 'error', texto: 'Error al subir el logo: ' + error.message })
    } finally {
      setSubiendoLogo(false)
    }
  }

  // Cerrar modal de recorte
  const cerrarRecortador = () => {
    setMostrarRecortador(false)
    setImagenParaRecortar(null)
  }

  // Eliminar logo
  const eliminarLogo = async () => {
    if (!config.logo_url) return

    try {
      setSubiendoLogo(true)
      const pathAnterior = config.logo_url.split('/logos-facturacion/')[1]
      if (pathAnterior) {
        await supabase.storage.from('logos-facturacion').remove([pathAnterior])
      }
      handleChange('logo_url', '')
      setMensaje({ tipo: 'success', texto: 'Logo eliminado' })
    } catch (error) {
      console.error('Error eliminando logo:', error)
      setMensaje({ tipo: 'error', texto: 'Error al eliminar el logo' })
    } finally {
      setSubiendoLogo(false)
    }
  }

  const guardar = async () => {
    // Validaciones
    if (!config.cuit || config.cuit.length !== 11) {
      setMensaje({ tipo: 'error', texto: 'El CUIT debe tener 11 dígitos' })
      return
    }
    if (!config.razon_social) {
      setMensaje({ tipo: 'error', texto: 'Ingresá la razón social' })
      return
    }
    if (!config.punto_venta || parseInt(config.punto_venta) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresá un punto de venta válido' })
      return
    }

    try {
      setSaving(true)
      await guardarConfiguracionAfip(duenioId, {
        cuit: config.cuit,
        razon_social: config.razon_social,
        domicilio_fiscal: config.domicilio_fiscal,
        punto_venta: parseInt(config.punto_venta),
        ambiente: config.ambiente,
        certificado_crt: config.certificado_crt,
        clave_privada_key: config.clave_privada_key,
        logo_url: config.logo_url,
        activo: true
      })
      setMensaje({ tipo: 'success', texto: 'Configuración guardada correctamente' })

      // Verificar conexión si hay certificados
      if (config.certificado_crt && config.clave_privada_key) {
        setTimeout(() => verificarConexion(), 500)
      }
    } catch (error) {
      console.error('Error guardando:', error)
      setMensaje({ tipo: 'error', texto: 'Error al guardar: ' + error.message })
    } finally {
      setSaving(false)
    }
  }

  const verificarConexion = async () => {
    try {
      setVerificando(true)
      setEstadoConexion(null)
      const resultado = await verificarConexionAfip(duenioId)
      setEstadoConexion(resultado)
    } catch (error) {
      setEstadoConexion({ ok: false, error: error.message })
    } finally {
      setVerificando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <FileText className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-gray-900">Facturación Electrónica</h3>
          <p className="text-sm text-gray-500">Configurá AFIP para emitir Facturas C, NC y ND</p>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-700' :
          mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' :
          'bg-yellow-50 text-yellow-700'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle className="w-5 h-5" /> :
           mensaje.tipo === 'error' ? <XCircle className="w-5 h-5" /> :
           <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm">{mensaje.texto}</span>
        </div>
      )}

      {/* Estado de conexión */}
      {estadoConexion && (
        <div className={`p-4 rounded-lg border ${
          estadoConexion.ok
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {estadoConexion.ok ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-700">Conexión exitosa con AFIP</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-700">Error de conexión</span>
              </>
            )}
          </div>
          {estadoConexion.ok ? (
            <p className="text-sm text-green-600 mt-1">
              Último comprobante: #{estadoConexion.ultimoComprobante || 0} •
              Ambiente: {estadoConexion.ambiente === 'produccion' ? 'Producción' : 'Testing'}
            </p>
          ) : (
            <p className="text-sm text-red-600 mt-1">{estadoConexion.error}</p>
          )}
        </div>
      )}

      {/* Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CUIT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CUIT <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={config.cuit}
            onChange={(e) => handleChange('cuit', e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="20123456789"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            maxLength={11}
          />
          <p className="text-xs text-gray-500 mt-1">11 dígitos, sin guiones</p>
        </div>

        {/* Punto de Venta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Punto de Venta <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={config.punto_venta}
            onChange={(e) => handleChange('punto_venta', e.target.value)}
            placeholder="1"
            min="1"
            max="99999"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">El que configuraste en AFIP para Web Services</p>
        </div>

        {/* Razón Social */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Razón Social / Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={config.razon_social}
            onChange={(e) => handleChange('razon_social', e.target.value)}
            placeholder="Juan Pérez"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Domicilio Fiscal */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Domicilio Fiscal
          </label>
          <input
            type="text"
            value={config.domicilio_fiscal}
            onChange={(e) => handleChange('domicilio_fiscal', e.target.value)}
            placeholder="Av. Corrientes 1234, CABA"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Logo para facturas */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Logo para Facturas
            </div>
          </label>
          <div className="flex items-start gap-4">
            {/* Preview del logo */}
            {config.logo_url ? (
              <div className="relative">
                <img
                  src={config.logo_url}
                  alt="Logo"
                  className="w-24 h-24 object-contain border rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={eliminarLogo}
                  disabled={subiendoLogo}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
                  title="Eliminar logo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
                <Image className="w-8 h-8 text-gray-300" />
              </div>
            )}

            {/* Botón de subir */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={(e) => e.target.files[0] && handleLogoSelect(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={subiendoLogo}
                />
                <button
                  type="button"
                  disabled={subiendoLogo}
                  className="w-full px-4 py-2 border-2 border-dashed rounded-lg text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {subiendoLogo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {config.logo_url ? 'Cambiar logo' : 'Subir logo'}
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG o WebP. Tamaño final: <strong>400x200 px</strong> (ratio 2:1). Se mostrará en tus facturas.
              </p>
            </div>
          </div>
        </div>

        {/* Ambiente */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ambiente <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ambiente"
                value="testing"
                checked={config.ambiente === 'testing'}
                onChange={(e) => handleChange('ambiente', e.target.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm">
                <span className="font-medium">Testing</span>
                <span className="text-gray-500 ml-1">(Homologación)</span>
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ambiente"
                value="produccion"
                checked={config.ambiente === 'produccion'}
                onChange={(e) => handleChange('ambiente', e.target.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm">
                <span className="font-medium">Producción</span>
                <span className="text-gray-500 ml-1">(Facturas reales)</span>
              </span>
            </label>
          </div>
          {config.ambiente === 'produccion' && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700">
                En producción las facturas son reales y tienen validez fiscal
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Certificados */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-600" />
          Certificados AFIP
        </h4>

        {/* Generador de certificados */}
        {!config.clave_privada_key && (
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Key className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 mb-1">Generar certificados automáticamente</h5>
                <p className="text-sm text-gray-600 mb-3">
                  Generamos tu clave privada y el archivo CSR para subir a AFIP
                </p>
                <button
                  onClick={generarCertificados}
                  disabled={generando || !config.cuit || !config.razon_social}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Generar Clave y CSR
                    </>
                  )}
                </button>
                {(!config.cuit || !config.razon_social) && (
                  <p className="text-xs text-amber-600 mt-2">
                    Primero completá tu CUIT y razón social arriba
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSR generado - mostrar para descargar */}
        {csrGenerado && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h5 className="font-medium text-green-800 mb-2">CSR generado correctamente</h5>
                <p className="text-sm text-green-700 mb-3">
                  Descargá el archivo CSR y subilo a AFIP para obtener tu certificado .crt
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={descargarCSR}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar CSR
                  </button>
                  <button
                    onClick={copiarCSR}
                    className="bg-white text-green-700 border border-green-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </button>
                </div>
                <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Pasos en AFIP:</p>
                  <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                    <li>Ir a "Administración de Certificados Digitales"</li>
                    <li>Click en "Agregar alias" → nombre: <strong>mimonotributo</strong></li>
                    <li>Click en "Crear certificado" → subir el archivo CSR</li>
                    <li>Descargar el .crt y subirlo abajo</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Certificado .crt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificado (.crt) - de AFIP
            </label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary-400 transition-colors relative">
              {config.certificado_crt ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Certificado cargado</span>
                </div>
              ) : (
                <div className="text-gray-500">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Subir certificado de AFIP</p>
                </div>
              )}
              <input
                type="file"
                accept=".crt,.pem,.cer"
                onChange={(e) => e.target.files[0] && handleFileUpload('certificado_crt', e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Clave privada .key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clave Privada (.key)
            </label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary-400 transition-colors relative">
              {config.clave_privada_key ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Clave cargada</span>
                </div>
              ) : (
                <div className="text-gray-500">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Subir clave privada</p>
                </div>
              )}
              <input
                type="file"
                accept=".key,.pem"
                onChange={(e) => e.target.files[0] && handleFileUpload('clave_privada_key', e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            {config.clave_privada_key && !csrGenerado && (
              <p className="text-xs text-gray-500 mt-1">
                Clave generada o cargada manualmente
              </p>
            )}
          </div>
        </div>

        {/* Botón regenerar certificados */}
        {config.clave_privada_key && (
          <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm text-gray-600">
              <span className="font-medium">¿Necesitás nuevos certificados?</span>
              <p className="text-xs text-gray-500">Si perdiste la clave o querés cambiarla</p>
            </div>
            <button
              onClick={() => {
                handleChange('clave_privada_key', '')
                handleChange('certificado_crt', '')
                setCsrGenerado('')
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
            >
              Regenerar
            </button>
          </div>
        )}

        {/* Info sobre certificados - solo si no tiene nada */}
        {!config.clave_privada_key && !csrGenerado && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">¿Primera vez?</p>
                <p className="text-blue-600">
                  Usá el botón "Generar Clave y CSR" de arriba. Es más fácil y seguro.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <button
          onClick={guardar}
          disabled={saving}
          className="flex-1 bg-primary-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Guardar Configuración
            </>
          )}
        </button>

        {config.certificado_crt && config.clave_privada_key && (
          <button
            onClick={verificarConexion}
            disabled={verificando}
            className="sm:w-auto bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {verificando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Verificar Conexión
              </>
            )}
          </button>
        )}
      </div>

      {/* Modal de recorte de logo */}
      {mostrarRecortador && imagenParaRecortar && (
        <ModalRecortarLogo
          imagenOriginal={imagenParaRecortar}
          onGuardar={handleLogoRecortado}
          onCerrar={cerrarRecortador}
        />
      )}
    </div>
  )
}
