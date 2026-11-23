(() => {
  'use strict';

  const SERVICE = 'https://servais.enaire.es/insigniads/rest/services/NSF_SRV/SRV_UAS_ZG_data_V2/FeatureServer';
  const LAYERS = [
    {id:2, name:'Zonas geográficas UAS de origen aeronáutico'},
    {id:0, name:'Zonas UAS por infraestructuras'},
    {id:3, name:'Zonas UAS en entornos urbanos'}
  ];
  const overall = document.getElementById('overallStatus');
  const results = document.getElementById('layerResults');
  const checkedAt = document.getElementById('checkedAt');
  let requestNumber = 0;

  const style = document.createElement('style');
  style.textContent = `
    .layer-group{display:grid;gap:8px}.layer-group>h3{font-size:14px;margin:4px 0 2px}
    .zone-card{border:1px solid #dfe5df;border-left:4px solid #87968d;border-radius:11px;padding:12px;background:#fff}
    .zone-card h4{font-size:14px;margin:0}.zone-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap}
    .zone-tag{font-size:11px;font-weight:700;border-radius:20px;padding:4px 8px;background:#edf1ee;color:#43564b}
    .zone-warning{border-left-color:#c58a2b}.zone-warning .zone-tag{background:#fff3dd;color:#85570f}
    .zone-danger{border-left-color:#b9443b}.zone-danger .zone-tag{background:#ffedeb;color:#96362f}
    .zone-card>p{font-size:13px;margin:8px 0 0}.zone-meta{color:#52645a}.zone-description{color:#68756f}
    .technical-details{margin-top:10px;border-top:1px solid #dfe5df;padding-top:8px;font-size:12px}
    .technical-details summary{cursor:pointer;color:#315b43;font-weight:700}
    .technical-details dl{display:grid;grid-template-columns:minmax(110px,.7fr) 1.3fr;gap:5px 10px;margin:10px 0 0;overflow-wrap:anywhere}
    .technical-details dt{font-weight:700;color:#52645a}.technical-details dd{margin:0;color:#37453d}
    @media(max-width:560px){.technical-details dl{grid-template-columns:1fr;gap:2px}.technical-details dd{margin-bottom:7px}}
  `;
  document.head.appendChild(style);

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }
  function norm(value) { return String(value || '').replace(/[^a-z0-9]/gi,'').toLowerCase(); }
  function attr(attrs, names) {
    const keys = names.map(norm);
    for (const [key, value] of Object.entries(attrs)) {
      if (keys.includes(norm(key)) && value !== null && value !== '') return value;
    }
    return null;
  }
  function clean(value) {
    if (value == null) return '';
    return String(value).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&')
      .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"')
      .replace(/&#39;|&apos;/gi,"'").replace(/<br\s*\/?>/gi,' · ')
      .replace(/<\/(p|div|li|h[1-6])\s*>/gi,' · ').replace(/<[^>]*>/g,' ')
      .replace(/\s+/g,' ').trim();
  }
  function translate(value) {
    const code = String(value ?? '').trim().toUpperCase();
    const map = {
      REQ_AUTHORIZATION:'Requiere autorización o coordinación previa',
      PROHIBITED:'Prohibido', PROHIBITED_AREA:'Zona prohibida',
      AIR_TRAFFIC:'Tráfico aéreo', POPULATION:'Entorno urbano o población',
      INFRASTRUCTURE:'Infraestructura', AGL:'Altura sobre el terreno (AGL)',
      AMSL:'Altitud sobre el nivel medio del mar (AMSL)',
      YES:'Sí', NO:'No', TRUE:'Sí', FALSE:'No'
    };
    return map[code] || String(value ?? '');
  }
  function limits(attrs) {
    const low = attr(attrs,['lower','lowerLimit','lowerValue']);
    const high = attr(attrs,['upper','upperLimit','upperValue']);
    const ref = attr(attrs,['lowerReference','lowerRef','upperReference','upperRef']);
    const unit = attr(attrs,['uom','unit','measurementUnit']) || 'm';
    if (low == null && high == null) return '';
    return (low == null ? 'sin límite inferior indicado' : low+' '+unit) +
      ' – ' + (high == null ? 'sin límite superior indicado' : high+' '+unit) +
      (ref ? ' · '+translate(ref) : '');
  }
  function interpretation(attrs) {
    const reason = attr(attrs,['reason','reasons','reasonType']);
    const type = attr(attrs,['type','zoneType','category']);
    const code = String(reason || type || '').toUpperCase();
    if (code.includes('PROHIBITED')) return {
      title:'Zona prohibida', level:'danger',
      text:'La operación puede estar prohibida en esta zona. No planifiques el vuelo sin confirmar la excepción o autorización legal que pudiera resultar aplicable.'
    };
    if (code.includes('REQ_AUTHORIZATION')) return {
      title:'Requiere autorización o coordinación', level:'warning',
      text:'La zona establece un requisito adicional. No significa necesariamente una prohibición absoluta, pero debes comprobar qué autorización, coordinación o condiciones exige antes de despegar.'
    };
    if (code.includes('AIR_TRAFFIC')) return {
      title:'Restricción relacionada con el tráfico aéreo', level:'warning',
      text:'Puede afectar a la seguridad de las operaciones de aeronaves tripuladas. Comprueba el procedimiento específico y los límites verticales de la zona.'
    };
    if (code.includes('POPULATION')) return {
      title:'Entorno urbano o zona de población', level:'warning',
      text:'Se ha detectado una zona asociada a entorno urbano/población. Comprueba las condiciones de operación y las obligaciones de comunicación que correspondan.'
    };
    if (code.includes('INFRASTRUCTURE')) return {
      title:'Zona vinculada a una infraestructura', level:'warning',
      text:'La zona está asociada a una infraestructura. Consulta las restricciones y el procedimiento indicado en la ficha oficial.'
    };
    return {
      title:'Zona geográfica UAS', level:'info',
      text:'ENAIRE devuelve una zona que debe revisarse en su ficha oficial y en la normativa aplicable.'
    };
  }
  const LABELS = {
    name:'Nombre',identifier:'Identificador',type:'Tipo de zona',reason:'Motivo',
    reasons:'Motivos',otherreasoninfo:'Información adicional',
    regulationexemption:'Exención reglamentaria',lower:'Límite inferior',
    upper:'Límite superior',lowerreference:'Referencia inferior',
    upperreference:'Referencia superior',uom:'Unidad',description:'Descripción',
    remarks:'Observaciones',startdatetime:'Inicio',enddatetime:'Fin'
  };
  function details(attrs) {
    const rows = Object.entries(attrs).filter(([,v]) => v !== null && v !== '');
    if (!rows.length) return '';
    return '<details class="technical-details"><summary>Ver datos técnicos originales</summary><dl>' +
      rows.map(([key,value]) => {
        const label = LABELS[norm(key)] || key;
        const display = ['description','remarks','otherreasoninfo'].includes(norm(key))
          ? clean(value) : translate(value);
        return '<dt>'+esc(label)+'</dt><dd>'+esc(display)+'</dd>';
      }).join('') + '</dl></details>';
  }
  function card(attrs, index) {
    const info = interpretation(attrs);
    const name = attr(attrs,['name','identifier','title']) || 'Zona '+(index+1);
    const reason = attr(attrs,['reason','reasons','reasonType']);
    const type = attr(attrs,['type','zoneType','category']);
    const desc = clean(attr(attrs,['description','remarks','otherReasonInfo']));
    const exemption = attr(attrs,['regulationExemption']);
    const extra = exemption == null ? '' : ' Exención reglamentaria: '+translate(exemption)+'.';
    return '<article class="zone-card zone-'+info.level+'"><div class="zone-heading"><h4>'+esc(name)+'</h4><span class="zone-tag">'+esc(info.title)+'</span></div>'+
      '<p>'+esc(info.text+extra)+'</p>'+
      (limits(attrs) ? '<p class="zone-meta"><b>Límites publicados:</b> '+esc(limits(attrs))+'</p>' : '')+
      (type || reason ? '<p class="zone-meta">'+esc([type,reason].filter(Boolean).map(translate).join(' · '))+'</p>' : '')+
      (desc ? '<p class="zone-description">'+esc(desc)+'</p>' : '')+details(attrs)+'</article>';
  }
  function status(kind,title,message) {
    overall.className = 'status '+kind;
    overall.innerHTML = '<span class="status-dot"></span><div><strong>'+esc(title)+'</strong><p>'+esc(message)+'</p></div>';
  }
  async function query(layer,lat,lon) {
    const params = new URLSearchParams({
      f:'json',where:'1=1',geometry:lon+','+lat,geometryType:'esriGeometryPoint',
      inSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'*',returnGeometry:'false'
    });
    const response = await fetch(SERVICE+'/'+layer.id+'/query?'+params.toString(),{headers:{Accept:'application/json'}});
    if (!response.ok) throw new Error('HTTP '+response.status);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Error del servicio ArcGIS');
    if (!Array.isArray(data.features)) throw new Error('Respuesta inesperada del servicio');
    return data.features;
  }
  async function checkPoint({lat,lon}) {
    const current = ++requestNumber;
    status('status-unknown','CONSULTANDO ENAIRE','Consultando las capas UAS para las coordenadas seleccionadas…');
    results.innerHTML = '<p class="muted">Conectando con el servicio oficial de ENAIRE…</p>';
    checkedAt.textContent = 'Consultando…';
    const settled = await Promise.allSettled(LAYERS.map(layer => query(layer,lat,lon)));
    if (current !== requestNumber) return;
    let count = 0, failures = 0;
    const html = settled.map((item,index) => {
      const layer = LAYERS[index];
      if (item.status === 'rejected') {
        failures++;
        return '<article class="layer-card"><h3>'+esc(layer.name)+'</h3><p>No se ha podido consultar esta capa: '+esc(item.reason?.message || 'error de conexión')+'.</p></article>';
      }
      count += item.value.length;
      if (!item.value.length) return '<article class="layer-card"><h3>'+esc(layer.name)+'</h3><p>Sin coincidencias en esta consulta puntual.</p></article>';
      return '<section class="layer-group"><h3>'+esc(layer.name)+' · '+item.value.length+' coincidencia(s)</h3>'+
        item.value.slice(0,15).map((f,i)=>card(f.attributes || {},i)).join('')+
        (item.value.length>15?'<p class="muted">Se muestran 15 de '+item.value.length+' coincidencias.</p>':'')+'</section>';
    });
    results.innerHTML = html.join('');
    checkedAt.textContent = 'Consulta: '+new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
    if (failures === LAYERS.length) {
      status('status-unknown','CONSULTA NO DISPONIBLE','No se ha podido consultar ninguna capa de ENAIRE. Repite la consulta y comprueba ENAIRE Drones directamente.');
    } else if (count && failures) {
      status('status-alert','COINCIDENCIAS · CONSULTA PARCIAL','Se han encontrado '+count+' coincidencia(s), pero '+failures+' capa(s) han fallado. La comprobación está incompleta.');
    } else if (count) {
      status('status-alert','ZONAS QUE DEBES REVISAR','ENAIRE ha devuelto '+count+' coincidencia(s). Lee la explicación de cada zona: puede exigir autorización, coordinación o condiciones específicas. No todas las coincidencias implican una prohibición total.');
    } else if (failures) {
      status('status-unknown','COMPROBACIÓN INCOMPLETA','No hay coincidencias en las capas que respondieron, pero '+failures+' capa(s) fallaron. No se puede sacar una conclusión.');
    } else {
      status('status-clear','SIN COINCIDENCIAS EN LAS CAPAS CONSULTADAS','No se han encontrado zonas en estas tres capas para el punto seleccionado. Esto no confirma que puedas volar: faltan NOTAM, avisos, comprobaciones ambientales y la revisión de las condiciones de tu operación.');
    }
  }
  window.addEventListener('dronmontana:point-selected',event=>checkPoint(event.detail));
  window.addEventListener('dronmontana:point-cleared',()=>{
    requestNumber++;
    status('status-unknown','NO COMPROBADO','Selecciona un punto para consultar las capas aeronáuticas.');
    results.innerHTML='<p class="muted">Se consultarán las capas aeronáuticas, infraestructuras y entornos urbanos.</p>';
    checkedAt.textContent='Pendiente';
  });
})();