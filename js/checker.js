(() => {
  'use strict';

  const SERVICE = 'https://servais.enaire.es/insigniads/rest/services/NSF_SRV/SRV_UAS_ZG_data_V2/FeatureServer';
  const LAYERS = [
    {id:2, name:'Zonas geográficas UAS de origen aeronáutico', short:'Aeronáuticas'},
    {id:0, name:'Zonas UAS por infraestructuras', short:'Infraestructuras'},
    {id:3, name:'Zonas UAS en entornos urbanos', short:'Entornos urbanos'}
  ];

  const overall = document.getElementById('overallStatus');
  const results = document.getElementById('layerResults');
  const checkedAt = document.getElementById('checkedAt');
  let requestNumber = 0;

  function safeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function fieldSummary(attributes) {
    const preferred = [
      'name','identifier','type','reasons','reason','otherReasonInfo',
      'regulationExemption','lower','upper','lowerReference','upperReference',
      'uom','country','description','remarks','startDateTime','endDateTime'
    ];
    const entries = [];
    for (const key of preferred) {
      if (attributes[key] !== undefined && attributes[key] !== null && attributes[key] !== '') {
        entries.push([key, attributes[key]]);
      }
    }
    if (!entries.length) {
      for (const [key, value] of Object.entries(attributes).slice(0, 8)) {
        if (value !== null && value !== '') entries.push([key, value]);
      }
    }
    return entries.map(([k,v]) => `<li><b>${safeText(k)}:</b> ${safeText(v)}</li>`).join('');
  }

  function setOverall(kind, title, message) {
    overall.className = `status ${kind}`;
    overall.innerHTML = `<span class="status-dot"></span><div><strong>${safeText(title)}</strong><p>${safeText(message)}</p></div>`;
  }

  async function queryLayer(layer, lat, lon) {
    const params = new URLSearchParams({
      f:'json',
      where:'1=1',
      geometry:`${lon},${lat}`,
      geometryType:'esriGeometryPoint',
      inSR:'4326',
      spatialRel:'esriSpatialRelIntersects',
      outFields:'*',
      returnGeometry:'false'
    });
    const url = `${SERVICE}/${layer.id}/query?${params.toString()}`;
    const response = await fetch(url, {headers:{'Accept':'application/json'}});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Error del servicio ArcGIS');
    if (!Array.isArray(data.features)) throw new Error('Respuesta inesperada del servicio');
    return data.features;
  }

  async function checkPoint({lat, lon}) {
    const thisRequest = ++requestNumber;
    setOverall('status-unknown', 'CONSULTANDO ENAIRE', 'Consultando las capas UAS para las coordenadas seleccionadas…');
    results.innerHTML = '<p class="muted">Conectando con el servicio oficial de ENAIRE…</p>';
    checkedAt.textContent = 'Consultando…';

    const settled = await Promise.allSettled(LAYERS.map(layer => queryLayer(layer, lat, lon)));
    if (thisRequest !== requestNumber) return;

    let totalMatches = 0;
    let failures = 0;
    const cards = [];

    settled.forEach((item, index) => {
      const layer = LAYERS[index];
      if (item.status === 'rejected') {
        failures++;
        cards.push(`<article class="layer-card"><h3>${safeText(layer.name)}</h3><p>No se ha podido consultar esta capa: ${safeText(item.reason?.message || 'error de conexión')}.</p></article>`);
        return;
      }
      const features = item.value;
      totalMatches += features.length;
      if (!features.length) {
        cards.push(`<article class="layer-card"><h3>${safeText(layer.name)}</h3><p>Sin coincidencias en esta consulta puntual.</p></article>`);
        return;
      }
      const featureHtml = features.slice(0, 12).map((feature, i) => {
        const attrs = feature.attributes || {};
        return `<li><b>Zona ${i+1}</b><ul>${fieldSummary(attrs)}</ul></li>`;
      }).join('');
      const extra = features.length > 12 ? `<p>Se muestran 12 de ${features.length} coincidencias.</p>` : '';
      cards.push(`<article class="layer-card"><h3>${safeText(layer.name)} · ${features.length} coincidencia(s)</h3><ul>${featureHtml}</ul>${extra}</article>`);
    });

    results.innerHTML = cards.join('');
    checkedAt.textContent = `Consulta: ${new Date().toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}`;

    if (failures === LAYERS.length) {
      setOverall('status-unknown', 'CONSULTA NO DISPONIBLE', 'No se ha podido consultar ninguna capa de ENAIRE. Repite la consulta y comprueba ENAIRE Drones directamente.');
    } else if (totalMatches > 0 && failures > 0) {
      setOverall('status-alert', 'COINCIDENCIAS · CONSULTA PARCIAL', `Se han encontrado ${totalMatches} coincidencia(s), pero ${failures} capa(s) no han podido consultarse. Revisa cada zona en ENAIRE Drones.`);
    } else if (totalMatches > 0) {
      setOverall('status-alert', 'HAY COINCIDENCIAS ENAIRE', `Se han encontrado ${totalMatches} coincidencia(s) en las capas consultadas. Debes revisar sus condiciones y autorizaciones en ENAIRE Drones.`);
    } else if (failures > 0) {
      setOverall('status-unknown', 'COMPROBACIÓN INCOMPLETA', `No hay coincidencias en las capas que respondieron, pero ${failures} capa(s) fallaron. No se puede sacar una conclusión.`);
    } else {
      setOverall('status-clear', 'SIN COINCIDENCIAS EN LAS CAPAS CONSULTADAS', 'La consulta puntual no ha devuelto polígonos en estas tres capas. Esto NO significa que el vuelo esté permitido: faltan NOTAM, avisos y comprobaciones ambientales.');
    }
  }

  window.addEventListener('dronmontana:point-selected', event => checkPoint(event.detail));
  window.addEventListener('dronmontana:point-cleared', () => {
    requestNumber++;
    setOverall('status-unknown', 'NO COMPROBADO', 'Selecciona un punto para consultar las capas aeronáuticas.');
    results.innerHTML = '<p class="muted">Se consultarán las capas aeronáuticas, infraestructuras y entornos urbanos.</p>';
    checkedAt.textContent = 'Pendiente';
  });
})();
