# DronMontaña

Primera maqueta web móvil para planificar vuelos de drones en montaña. Ámbito inicial: Navarra.

## Estado de esta versión

- Mapa Leaflet con OpenStreetMap.
- Selección de punto tocando el mapa.
- Búsqueda por topónimo o coordenadas.
- Geolocalización del navegador.
- Enlaces a fuentes oficiales de ENAIRE, Navarra y AESA.
- Estado deliberadamente conservador: **NO CONFIRMADO**.

## Importante

Esta versión NO contiene todavía capas geográficas oficiales integradas. No puede determinar si un vuelo está permitido ni sustituye la consulta de ENAIRE Drones, autorizaciones ambientales o normativa aplicable. No debe utilizarse como autorización para volar.

## Ejecutar

Abrir `index.html` mediante un servidor web estático. Para probar localmente, por ejemplo:

```bash
python -m http.server 8000
```

y visitar `http://localhost:8000`.

## Fuentes oficiales enlazadas

- ENAIRE Drones: https://drones.enaire.es/
- Datos UAS de ENAIRE / AIP España: https://aip.enaire.es/aip/UAS-es.html
- Autorizaciones en espacios protegidos de Navarra: https://www.navarra.es/es/medio-ambiente/autorizaciones-en-espacios-protegidos
- Registro de operador UAS (AESA): https://www.seguridadaerea.gob.es/es/ambitos/drones/registro-de-operador-de-drones-uas

## Siguientes pasos

1. Incorporar conjuntos de datos UAS oficiales (formato ED-318) con fecha y ciclo AIRAC.
2. Identificar capas ambientales oficiales de Navarra y su normativa específica.
3. Implementar intersección espacial y calendario de restricciones temporales.
4. Añadir trazabilidad por fuente y resultado de cada comprobación.
5. Ampliar cobertura territorial solo cuando cada fuente tenga cobertura y actualización verificables.
