# DronMontaña · versión 0.2

Segunda versión experimental del planificador web móvil para vuelos de dron en montaña. Ámbito inicial: Navarra.

## Novedades de v0.2
- Mantiene el mapa Leaflet/OpenStreetMap, búsqueda por topónimo o coordenadas y GPS.
- Consulta en directo el servicio público ArcGIS FeatureServer V2 de ENAIRE.
- Comprueba el punto seleccionado frente a tres capas: zonas UAS aeronáuticas, infraestructuras y entornos urbanos.
- Muestra las coincidencias y atributos disponibles devueltos por el servicio.
- Diferencia entre coincidencias, ausencia de coincidencias y fallos de consulta.
- Incluye enlaces directos a ENAIRE Drones, IDENA y autorizaciones ambientales de Navarra.

## Limitaciones importantes
- **No es una autorización para volar.**
- La consulta es puntual: comprueba el punto seleccionado, no el volumen completo de vuelo, la trayectoria ni el área de operación.
- No incorpora NOTAM, avisos temporales ni la consulta guiada completa de ENAIRE Drones.
- La comprobación ambiental con geometrías de IDENA todavía no está integrada. Se ofrecen enlaces a las fuentes oficiales.
- No se deben interpretar “sin coincidencias” como “permitido”.
- La respuesta depende de la disponibilidad del servicio remoto y de que el navegador pueda acceder a él (CORS/conectividad).

## Fuente aeronáutica
Servicio ENAIRE servAIS, FeatureServer V2:
https://servais.enaire.es/insigniads/rest/services/NSF_SRV/SRV_UAS_ZG_data_V2/FeatureServer

Documentación y datos UAS:
https://aip.enaire.es/aip/UAS-es.html

ENAIRE indica en su portal la fecha de actualización junto a los enlaces de descarga. Consulta esa página para comprobar la vigencia del conjunto de datos antes de cada vuelo.

## Fuentes ambientales
- IDENA visor: https://idena.navarra.es/navegar/
- Catálogo/descargas IDENA: https://geoportal.navarra.es/es/idena/descargar
- Espacios naturales protegidos de Navarra: https://www.navarra.es/es/medio-ambiente/espacios-naturales-protegidos
- Autorizaciones ambientales: https://www.navarra.es/es/medio-ambiente/autorizaciones-en-espacios-protegidos

IDENA publica capas vectoriales de espacios protegidos y Red Natura 2000. La integración requiere comprobar la geometría, los atributos y la normativa aplicable a cada figura de protección; la mera coincidencia espacial no equivale por sí sola a una prohibición automática.

## Ejecutar
Abrir `index.html` desde GitHub Pages o desde un servidor estático. Para probar localmente:

```bash
python -m http.server 8000
```

Después visitar `http://localhost:8000`.

## Publicar en GitHub Pages
Sustituye los archivos de la versión anterior por los de esta carpeta, manteniendo la estructura:
- `index.html`
- `css/styles.css`
- `js/app.js`
- `js/checker.js`
- `README.md`

No es necesario compilar ni instalar dependencias. Leaflet se carga desde CDN.

## Atribución
Los datos ambientales y cartográficos de IDENA están sujetos a sus condiciones de reutilización; cuando se integren, debe indicarse la procedencia como “Servicio proporcionado por el Gobierno de Navarra”.
