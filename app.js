import { CONFIG } from './config.js';

const $ = (s, el=document)=>el.querySelector(s);
const $$ = (s, el=document)=>Array.from(el.querySelectorAll(s));

/* LINKS (WA / MAPS) */
(function buildLinks(){
  const waBtn = $('#btn-wa');
  const mapsBtn = $('#btn-maps');
  if (waBtn){
    const phone = CONFIG.whatsapp.replace(/\D/g,'');
    const msg = encodeURIComponent('Hola! Quiero hacer una consulta sobre Encuentros.');
    waBtn.href = `https://wa.me/54${phone}?text=${msg}`;
  }
  if (mapsBtn){
    mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.direccion)}`;
  }
})();

/* REVEAL al scrollear */
const obs = new IntersectionObserver((entries)=>{
  for (const e of entries){ if (e.isIntersecting) e.target.classList.add('visible'); }
},{ threshold:.15 });
$$('.revelar').forEach(el=>obs.observe(el));

/* LIGHTBOX */
const lightbox = $('.lightbox');
if (lightbox){
  $$('.galeria .tarjeta').forEach(card => {
    card.addEventListener('click', ()=>{
      const img = card.querySelector('img');
      const cap = card.dataset.caption || card.querySelector('figcaption')?.textContent || '';
      lightbox.querySelector('img').src = img.src;
      lightbox.querySelector('.lightbox__caption').textContent = cap;
      lightbox.classList.add('abierto');
    });
  });
  lightbox.addEventListener('click', e=>{ if(e.target===lightbox) lightbox.classList.remove('abierto'); });
}

/* DISPONIBILIDAD (Airtable CSV o JSON local) */
async function cargarDisponibilidad(){
  // Intenta Airtable primero; si falla, usa JSON local.
  if (CONFIG.fuentes.airtable.activo && CONFIG.fuentes.airtable.csvUrl && CONFIG.fuentes.airtable.csvUrl.startsWith('http')){
    try{
      const r = await fetch(CONFIG.fuentes.airtable.csvUrl);
      if (!r.ok) throw new Error('CSV Airtable no accesible');
      const text = await r.text();

      // Parse CSV simple (soporta comas en campos si vienen entre comillas dobles)
      const rows = parseCSV(text);
      const headers = rows.shift().map(h=>h.trim().toLowerCase());
      const idx = (k)=> headers.indexOf(k.toLowerCase());

      const items = rows.map(cols=> ({
        fecha: cols[idx('fecha')]?.trim() || '',
        hora: cols[idx('hora')]?.trim() || '',
        cupos: Number(cols[idx('cupos')] || 0),
        precio_por_persona: Number(cols[idx('precio_por_persona')] || CONFIG.precioDefault),
        activo: (cols[idx('activo')]||'').toLowerCase()
      }));

      const tieneActivo = headers.includes('activo');
      return items.filter(i=> (tieneActivo? ['si','true','1','yes'].includes(i.activo):true) && i.cupos>0 && i.fecha && i.hora);
    }catch(err){
      console.warn('Fallo Airtable, uso JSON local. Motivo:', err);
    }
  }

  // Fallback JSON local
  if (CONFIG.fuentes.jsonLocal.activo){
    const r = await fetch(CONFIG.fuentes.jsonLocal.url);
    if (!r.ok) throw new Error('No pude leer disponibilidad.json');
    const items = await r.json();
    return items.filter(i=> i.cupos>0 && i.fecha && i.hora);
  }

  return [];
}

// CSV parser básico compatible con comillas dobles
function parseCSV(str){
  const rows = [];
  let row = [], cur = '', inQuotes = false;
  for (let i=0;i<str.length;i++){
    const c = str[i], n = str[i+1];
    if (c === '"'){
      if (inQuotes && n === '"'){ cur += '"'; i++; } // escape ""
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes){
      row.push(cur); cur = '';
    } else if ((c === '\n' || c === '\r') && !inQuotes){
      if (cur || row.length){ row.push(cur); rows.push(row); row = []; cur = ''; }
    } else {
      cur += c;
    }
  }
  if (cur || row.length) row.push(cur), rows.push(row);
  return rows;
}

/* Helpers */
function uniq(arr){ return [...new Set(arr)]; }
function parseFecha(str){
  // acepta yyyy-mm-dd o dd-mm-yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str+'T00:00:00');
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)){ const [d,m,y]=str.split('-').map(Number); return new Date(y, m-1, d); }
  return new Date(str);
}
function fechaHumana(str){
  const d = parseFecha(str);
  return d.toLocaleDateString('es-AR',{weekday:'long', day:'2-digit', month:'long'});
}
function actualizarPrecio(precio){
  const qty = parseInt($('#inp-cantidad').value||'1',10);
  const total = (precio||CONFIG.precioDefault) * qty;
  $('#precio-total').textContent = `$ ${total.toLocaleString('es-AR')}`;
}

/* RESERVAS */
let DATA = [];

async function initReservas(){
  const seccion = $('#reservas'); if (!seccion) return;
  DATA = await cargarDisponibilidad();

  const fechas = uniq(DATA.map(i=>i.fecha)).sort((a,b)=>parseFecha(a)-parseFecha(b));
  const selFecha = $('#sel-fecha'), selHora = $('#sel-hora');

  selFecha.innerHTML = ''; selHora.innerHTML='';
  fechas.forEach(f=>{
    const o = document.createElement('option');
    o.value = f; o.textContent = fechaHumana(f);
    selFecha.appendChild(o);
  });

  function updateHoras(){
    selHora.innerHTML='';
    const f = selFecha.value;
    const horas = DATA.filter(i=>i.fecha===f);
    horas.forEach(h=>{
      const o = document.createElement('option');
      o.value = h.hora;
      o.textContent = `${h.hora} (cupos: ${h.cupos})`;
      o.dataset.cupos = String(h.cupos);
      o.dataset.precio = String(h.precio_por_persona || CONFIG.precioDefault);
      selHora.appendChild(o);
    });
    const first = selHora.options[0];
    if (first){
      $('#cupo-restante').textContent = first.dataset.cupos;
      actualizarPrecio(parseInt(first.dataset.precio,10));
    }else{
      $('#cupo-restante').textContent = '—';
      actualizarPrecio(CONFIG.precioDefault);
    }
  }

  selFecha.addEventListener('change', updateHoras);
  selHora.addEventListener('change', (e)=>{
    const opt = e.target.selectedOptions[0];
    if (opt){
      $('#cupo-restante').textContent = opt.dataset.cupos || '—';
      actualizarPrecio(parseInt(opt.dataset.precio||CONFIG.precioDefault,10));
    }
  });
  $('#inp-cantidad').addEventListener('input', ()=>{
    const opt = selHora.selectedOptions[0];
    const p = opt ? parseInt(opt.dataset.precio,10) : CONFIG.precioDefault;
    actualizarPrecio(p);
  });

  updateHoras();

  // Submit
  $('#form-reserva').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const qty = parseInt($('#inp-cantidad').value||'1',10);
    const opt = selHora.selectedOptions[0];
    const cupos = opt ? parseInt(opt.dataset.cupos,10) : 0;
    if (qty > cupos){ alert('No hay cupos suficientes para esa fecha/hora.'); return; }
    const price = opt ? parseInt(opt.dataset.precio,10) : CONFIG.precioDefault;
    const total = price * qty;

    // 1) Mercado Pago (alias)
    window.open(CONFIG.mercadopago, '_blank');

    // 2) Notificación Make (opcional)
    if (CONFIG.makeWebhook && CONFIG.makeWebhook.startsWith('http')){
      try{
        await fetch(CONFIG.makeWebhook, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            evento: 'reserva_iniciada',
            nombre: $('#inp-nombre').value,
            email: $('#inp-email').value,
            telefono: $('#inp-telefono').value,
            fecha: $('#sel-fecha').value,
            hora: $('#sel-hora').value,
            cantidad: qty,
            preferencias: $('#inp-preferencias').value,
            total
          })
        });
      }catch(err){ console.warn('Webhook Make falló', err); }
    }

    // 3) WhatsApp al dueño
    const tel = CONFIG.whatsapp.replace(/\D/g,'');
    const texto = encodeURIComponent(
      `Nueva reserva%0A`+
      `Nombre: ${$('#inp-nombre').value}%0A`+
      `Fecha: ${$('#sel-fecha').value} ${$('#sel-hora').value}%0A`+
      `Cantidad: ${qty}%0A`+
      `Preferencias: ${$('#inp-preferencias').value}%0A`+
      `Total: $${total.toLocaleString('es-AR')}`
    );
    window.open(`https://wa.me/54${tel}?text=${texto}`, '_blank');

    alert('Abrimos Mercado Pago y enviamos la notificación. Recordá ajustar cupos manualmente / en Airtable.');
  });
}

document.addEventListener('DOMContentLoaded', initReservas);

// Aviso si file://
if (location && location.protocol === 'file:'){
  console.warn('Abrí el proyecto con un servidor (Live Server, Vercel, GitHub Pages) para evitar problemas de módulos/Fetch.');
}
