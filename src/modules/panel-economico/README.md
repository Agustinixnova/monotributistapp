# Modulo: Panel Economico

## Descripcion
Panel de indicadores economicos de Argentina en tiempo real. Muestra cotizaciones, inflacion, UVA, riesgo pais, tasas y feriados usando APIs publicas gratuitas.

## APIs Utilizadas
- **DolarApi.com** - Cotizaciones de dolar y otras monedas
- **ArgentinaDatos.com** - Inflacion, UVA, riesgo pais, tasas, feriados

## Componentes

| Componente | Descripcion |
|------------|-------------|
| `PanelEconomicoPage.jsx` | Pagina principal que ensambla todo |
| `SeccionCotizaciones.jsx` | Grid de cotizaciones de monedas |
| `CardCotizacion.jsx` | Card individual de cotizacion |
| `SeccionIndicadores.jsx` | Indicadores economicos (inflacion, UVA, etc) |
| `CalculadoraIPC.jsx` | Calculadora de ajuste por inflacion (feature principal) |
| `ConversorMonedas.jsx` | Conversor USD/EUR/BRL a ARS |
| `ProximosFeriados.jsx` | Lista de proximos feriados con aviso de vencimientos |
| `GraficoHistoricoDolar.jsx` | Grafico de evolucion del dolar con Recharts |

## Hooks

| Hook | Descripcion |
|------|-------------|
| `useCotizaciones` | Obtiene cotizaciones de DolarApi con cache |
| `useInflacion` | Obtiene datos de inflacion mensual e interanual |
| `useIndicadores` | Obtiene UVA, riesgo pais y tasas |
| `useFeriados` | Obtiene feriados del año |
| `useHistoricoDolar` | Obtiene historico de cotizaciones para graficos |

## Services

| Service | Descripcion |
|---------|-------------|
| `dolarApiService.js` | Llamadas a DolarApi.com |
| `argentinaDatosService.js` | Llamadas a ArgentinaDatos.com |
| `cacheService.js` | Cache en localStorage con TTL |

## Utils

| Util | Descripcion |
|------|-------------|
| `calculosIPC.js` | Calculos de inflacion acumulada y ajuste de precios |
| `formatters.js` | Formateo de moneda, porcentajes y fechas |
| `coloresCotizaciones.js` | Configuracion de colores e iconos por tipo de cotizacion |
| `feriadosUtils.js` | Utilidades para feriados y dias habiles |

## Feature Principal: Calculadora IPC

Permite a los clientes calcular cuanto deberian cobrar hoy por un servicio:
1. Ingresa el monto que cobraba
2. Selecciona desde cuando cobraba ese monto
3. Calcula la inflacion acumulada
4. Muestra el monto actualizado

## Cache

Todas las APIs estan cacheadas en localStorage:
- Cotizaciones: 5 minutos
- Inflacion: 1 hora
- UVA/Riesgo Pais: 30-60 minutos
- Feriados: 24 horas
- Historico: 30 minutos

## Dependencias
- `recharts` - Para graficos
- `lucide-react` - Para iconos

## Ultima actualizacion
2026-01-17 - Creacion del modulo
