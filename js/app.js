const map = L.map('map', {zoomControl:true}).setView([42.695, -1.676], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let marker = null;
const info = document.getElementById('pointInfo');
const placeInput = document.getElementById('place');

function setPoint(lat, lon, label='Punto seleccionado') {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    info.textContent = 'Coordenadas no válidas. Usa latitud, longitud en grados decimales.';
    return;
  }
  if (marker) map.removeLayer(marker);
  marker = L.marker([lat, lon]).addTo(map).bindPopup(label).openPopup();
  map.setView([lat, lon], 14);
  info.textContent = `${label} · ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  placeInput.value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  window.dispatchEvent(new CustomEvent('dronmontana:point-selected', {detail:{lat, lon, label}}));
}

map.on('click', e => setPoint(e.latlng.lat, e.latlng.lng));

document.getElementById('searchBtn').addEventListener('click', async () => {
  const q = placeInput.value.trim();
  if (!q) return;
  const coords = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (coords) {
    setPoint(Number(coords[1]), Number(coords[2]), 'Coordenadas');
    return;
  }
  info.textContent = 'Buscando ubicación…';
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {headers:{'Accept':'application/json'}});
    if (!response.ok) throw new Error('No se pudo consultar el servicio de búsqueda.');
    const results = await response.json();
    if (!results.length) { info.textContent = 'No se ha encontrado esa ubicación. Prueba con coordenadas.'; return; }
    setPoint(Number(results[0].lat), Number(results[0].lon), results[0].display_name.split(',').slice(0,2).join(','));
  } catch (err) {
    info.textContent = 'No se pudo completar la búsqueda. Puedes seleccionar el punto directamente en el mapa.';
  }
});

placeInput.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('searchBtn').click(); });
document.getElementById('gpsBtn').addEventListener('click', () => {
  if (!navigator.geolocation) { info.textContent = 'Este navegador no ofrece geolocalización.'; return; }
  info.textContent = 'Obteniendo ubicación GPS…';
  navigator.geolocation.getCurrentPosition(
    p => setPoint(p.coords.latitude, p.coords.longitude, 'Mi ubicación'),
    e => { info.textContent = `No se pudo obtener la ubicación: ${e.message}`; },
    {enableHighAccuracy:true, timeout:15000, maximumAge:30000}
  );
});
document.getElementById('clearBtn').addEventListener('click', () => {
  if (marker) map.removeLayer(marker);
  marker = null;
  placeInput.value = '';
  info.textContent = 'Selecciona un punto en el mapa o busca una ubicación.';
  map.setView([42.695, -1.676], 8);
  window.dispatchEvent(new CustomEvent('dronmontana:point-cleared'));
});
