/* ===========================================================================
   Explorador de la brecha — violencia familiar, CDMX
   Tareas 4.2, 4.3 y 4.4 (PLAN_31_OCT.md §4.4): mapa, escala, hover, clic y
   detalle de AGEB (4.2) · controles de supuestos y contador de sensibilidad
   (4.3) · dispersión ligada con pincel y panel de límites (4.4).

   Regla de esta capa, igual que la del 4.1: AQUÍ NO SE CALCULA NADA.
   Todo número que aparece en pantalla —escala, cortes, conteos, IC, β de H2,
   el acotamiento de la ENDIREH— se lee de `app/data/brecha.json`, que a su vez
   lo copió de `resultados/` con un assert por agregado. No hay una sola cifra
   tecleada en este archivo ni en index.html: lo único que se escribe a mano es
   prosa. Lo mismo vale para la paleta, que se inyecta en las variables CSS
   desde `meta.paleta.tokens` (§1) en lugar de repetirse en la hoja de estilo.

   Lo único que el 4.3 agrega a esa regla es CONTAR filas que ya traen su
   bandera (`sensible_s1`, `cambia_clasif_s1`, `universo.conteo_alto`): filtrar
   no es estimar, y para que no se vuelva otra cosa, `verifica()` (§10) exige al
   arranque que esas cuentas reproduzcan exactamente las de `meta`.

   El 4.4 agrega una segunda operación del mismo tipo: SELECCIONAR filas con un
   rectángulo sobre la dispersión (§11). La recta de H2 que esa dispersión
   dibuja no se ajusta aquí: es la pendiente β de `16_` puesta en unidades de la
   covariable con la media y la DE que el 3.1 usó para estandarizar, las tres
   leídas de `meta.h2` (bloque `estandarizacion`, que el 4.1 verificó contra el
   notebook congelado). El pincel cuenta y resalta; no estima.

   El estado de la vista vive en `estado` (§0) y los controles del 4.3 y del 4.4
   solo lo escriben y llaman `aplica()`: ninguna función de dibujo lee la
   ventana, la variante de S1, el filtro de conteo ni el pincel de otro lado.
   =========================================================================== */
(function () {
'use strict';

// ---------------------------------------------------------------- §0 estado
const estado = {
  variante: 's0',   // 's0' | 's19'                   ← control de S1 (4.3)
  vista: 'prom',    // 'prom' | '2019' | '2021-22'    ← control de ventana (4.3)
  conteo: 'mostrar',// 'mostrar' | 'hachurar' | 'ocultar'  ← control de conteo bajo (4.3)
  cov: null,        // covariable de la dispersión (4.4); se fija de meta al arrancar
  pincel: null,     // {x:[x0,x1], y:[y0,y1]} en coordenadas de dato, o null (4.4)
  sel: null,        // clave del AGEB fijado con clic
  hover: null       // clave del AGEB bajo el cursor
};

let meta, porClave, rasgos, porRasgo, alcaldias, bbox;   // datos
let ancho = 0, alto = 0, dpr = 1;           // lienzo
let rejilla = null;                         // índice espacial para el hover
let tr = d3.zoomIdentity;                   // transformación de zoom vigente
let zoom = null;                            // comportamiento de d3.zoom
let arrastro = false;                       // ¿el último gesto fue un paneo?
let color = null;                           // escala divergente
let C = null;                               // cuentas del estado vigente (§10)
let D = null;                               // estado de la dispersión del 4.4 (§11)

const $ = (s) => document.querySelector(s);
const lienzo = $('#lienzo'), ctx = lienzo.getContext('2d');
const capa = d3.select('#capa');
const tip = $('#tip');

// --------------------------------------------------------------- formateo
const dec = (n) => {
  const f = new Intl.NumberFormat('es-MX', { minimumFractionDigits: n, maximumFractionDigits: n });
  return (v) => f.format(v);
};
const nf0 = dec(0), nf1 = dec(1), nf2 = dec(2);
const num = nf0;
const raz = (v) => '×' + nf2(v);
const pct0 = (v) => nf0(v * 100) + '%';
const pct1 = (v) => nf1(v * 100) + '%';
// El calibrador de la ENDIREH es 0.9655, es decir 96.55%: justo el empate que
// una decimal no puede resolver sin contradecir al pie, que lo publica como
// 96.5% (el mismo valor redondeado del otro lado por el flotante de Python).
// Se imprime con dos decimales para no inventar una regla de redondeo.
const pct2 = (v) => nf2(v * 100) + '%';
// Los tintes semitransparentes salen del token, no de un rgba() tecleado: la
// paleta tiene que seguir teniendo una sola fuente (meta.paleta.tokens).
const alfa = (hex, a) =>
  'rgba(' + [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',') + ',' + a + ')';
// Las llamadas son enteras sin descontar robo y fraccionarias al descontarlo:
// "17 llamadas" y "13.8 llamadas", nunca "17.0".
const cuenta = (v) => (Number.isInteger(v) ? nf0(v) : nf1(v));
const plural = (v, sing, plu) => '<b>' + cuenta(v) + '</b> ' + (v === 1 ? sing : plu);
// Dos decimales abajo de 10, uno hasta 100, entero arriba: los IC de los AGEB
// con pocos casos llegan a ×829 y "829.00" no dice nada que "829" no diga.
const brev = (v) => (v >= 100 ? nf0(v) : v >= 10 ? nf1(v) : nf2(v));

// ========================================================== §1 carga y arranque
async function carga() {
  if (window.__DATOS__) return window.__DATOS__;          // paquete para file://
  const base = (u) => fetch(u).then((r) => {
    if (!r.ok) throw new Error(u + ' → HTTP ' + r.status);
    return r.json();
  });
  const [topo, brecha] = await Promise.all([
    base('data/ageb.topo.json'), base('data/brecha.json')
  ]);
  return { topo, brecha };
}

carga().then(arranca).catch(falla);

function falla(err) {
  console.error(err);
  document.querySelector('main').innerHTML =
    '<div id="error"><h2>No se pudieron cargar los datos</h2>' +
    '<p>El navegador bloquea la lectura de archivos locales cuando la página se abre ' +
    'con <code>file://</code> y no existe <code>app/data/bundle.js</code>.</p>' +
    '<p>Genera el paquete con <code>uv run python app/build_bundle.py</code> y vuelve a ' +
    'abrir <code>index.html</code>, o sirve la carpeta con ' +
    '<code>python3 -m http.server</code> desde la raíz del repositorio.</p>' +
    '<p style="color:var(--tinta2)">' + String(err) + '</p></div>';
}

function arranca(datos) {
  meta = datos.brecha.meta;

  // La paleta de la hoja de estilo se reescribe desde el dato: una sola fuente.
  const raiz = document.documentElement;
  for (const [k, v] of Object.entries(meta.paleta.tokens)) raiz.style.setProperty('--' + k, v);

  porClave = new Map(datos.brecha.agebs.map((d) => [d.ageb, d]));

  const lim = meta.escala.lim_2sigma_log;
  color = d3.scaleLinear()
    .domain(d3.range(meta.paleta.divergente.length)
      .map((i) => -lim + 2 * lim * i / (meta.paleta.divergente.length - 1)))
    .range(meta.paleta.divergente)
    .interpolate(d3.interpolateRgb)
    .clamp(true);

  bbox = datos.topo.bbox;
  rasgos = decodifica(datos.topo, 'ageb');
  alcaldias = decodifica(datos.topo, 'alcaldia');
  porRasgo = new Map(rasgos.map((f) => [f.id, f]));

  // El TopoJSON y la tabla tienen que coincidir: si no, el mapa pintaría
  // geometrías sin dato en silencio. El 4.1 dejó la unión al 100%.
  const huerfanos = rasgos.filter((f) => !porClave.has(f.id));
  if (huerfanos.length) console.error('AGEB del mapa sin fila en brecha.json:', huerfanos.length);

  estado.cov = meta.h2.coeficientes[0].covariable;   // la única que acepta: GRAPROES

  recuenta();
  verifica();          // las cuentas vivas tienen que dar las de meta (§10)
  construyeMandos();   // controles de supuestos (§9)
  construyeDisp();     // dispersión ligada (§11)
  textoFijo();
  textoVivo();
  dibujaEscala();
  pintaDetalle(null);

  zoom = d3.zoom().scaleExtent([1, 40])
    .on('start', () => { arrastro = false; })
    .on('zoom', (ev) => {
      if (ev.sourceEvent && ev.sourceEvent.type === 'mousemove') arrastro = true;
      tr = ev.transform; repinta();
    });
  capa.call(zoom);

  capa.on('mousemove', alMover).on('mouseleave', alSalir).on('click', alClic);
  $('#reset').addEventListener('click', () =>
    capa.transition().duration(450).call(zoom.transform, d3.zoomIdentity));
  // Teclado: los controles son botones (y por eso responden a Tab y Enter),
  // pero la demo en vivo se maneja mejor sin buscar el cursor.
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Esc suelta las dos selecciones: el AGEB fijado y el pincel del 4.4.
    if (e.key === 'Escape') {
      estado.sel = null; pintaDetalle(null); resalta();
      if (estado.pincel) sueltaPincel();
      return;
    }
    const k = e.key.toLowerCase();
    const vistas = ['prom'].concat(meta.ventanas);
    const i = ['1', '2', '3'].indexOf(k);
    if (i >= 0 && i < vistas.length) aplica('vista', vistas[i]);
    else if (k === 's') cicla('variante');
    else if (k === 'c') cicla('conteo');
    else if (k === 'x') ciclaCov();
    else if (k === 'b' && estado.pincel) sueltaPincel();
  });

  new ResizeObserver(redimensiona).observe($('#mapa-cont'));
  // Se observa la columna, no la sección: desde el 4.5 el alto de la nube es
  // lo que esta función decide, así que observar `#dispersion` se realimentaría.
  new ResizeObserver(redimensionaDisp).observe($('#lado'));
  redimensiona();
}

// ===================================== §2 TopoJSON decodificado a mano
// Arcos delta + transform cuantizado, sin topojson-client: es la misma
// decodificación con la que el 4.1 verificó el archivo por fuera de la
// librería que lo escribió (PLAN_31_OCT.md §4.5).
function decodifica(topo, nombre) {
  const [sx, sy] = topo.transform.scale;
  const [ox, oy] = topo.transform.translate;

  const arcos = topo.arcs.map((arco) => {
    let x = 0, y = 0;
    const salida = new Array(arco.length);
    for (let i = 0; i < arco.length; i++) {
      x += arco[i][0]; y += arco[i][1];
      salida[i] = [x * sx + ox, y * sy + oy];
    }
    return salida;
  });

  // Cada arco repite como primer punto el último del arco anterior del anillo.
  const anillo = (indices) => {
    const pts = [];
    for (const i of indices) {
      const a = i < 0 ? arcos[~i].slice().reverse() : arcos[i];
      for (let k = pts.length ? 1 : 0; k < a.length; k++) pts.push(a[k]);
    }
    return pts;
  };

  return topo.objects[nombre].geometries.map((g) => ({
    id: g.id,
    // Polygon y MultiPolygon se aplanan a una lista de anillos; el relleno y
    // el point-in-polygon usan regla par-impar, que no depende de la
    // orientación y resuelve los huecos sin conocer la jerarquía.
    anillos: g.type === 'Polygon' ? g.arcs.map(anillo)
                                  : g.arcs.flatMap((poli) => poli.map(anillo))
  }));
}

// ======================================== §3 ajuste a la ventana y hover
function redimensiona() {
  const caja = $('#mapa-cont').getBoundingClientRect();
  ancho = Math.max(1, Math.round(caja.width));
  alto = Math.max(1, Math.round(caja.height));
  dpr = window.devicePixelRatio || 1;

  lienzo.width = Math.round(ancho * dpr);
  lienzo.height = Math.round(alto * dpr);
  capa.attr('viewBox', `0 0 ${ancho} ${alto}`);

  if (zoom) zoom.translateExtent([[0, 0], [ancho, alto]]);
  proyecta();
  indexa();
  // La leyenda depende del alto del mapa desde el 4.5, así que se vuelve a
  // dibujar aquí y no solo al arrancar o al mover un control.
  if (meta) dibujaEscala();
  repinta();
}

// Pasa las coordenadas EPSG:6372 a píxeles de la vista completa (k = 1).
// El eje y se invierte: en la proyección crece al norte y en el lienzo al sur.
function proyecta() {
  const [x0, y0, x1, y1] = bbox;
  const k = Math.min(ancho / (x1 - x0), alto / (y1 - y0)) * 0.96;
  const mx = (ancho - (x1 - x0) * k) / 2;
  const my = (alto - (y1 - y0) * k) / 2;

  for (const col of [rasgos, alcaldias]) {
    for (const f of col) {
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      f.px = f.anillos.map((r) => r.map(([x, y]) => {
        const px = (x - x0) * k + mx, py = (y1 - y) * k + my;
        if (px < bx0) bx0 = px; if (px > bx1) bx1 = px;
        if (py < by0) by0 = py; if (py > by1) by1 = py;
        return [px, py];
      }));
      f.bb = [bx0, by0, bx1, by1];
    }
  }
}

// Rejilla uniforme sobre el lienzo: el hover prueba solo los AGEB cuya caja
// toca la celda del cursor, no los 2,431. Exacto, sin lienzo de selección ni
// los falsos positivos que el antialiasing introduce en esa técnica.
function indexa() {
  const cel = 16, nx = Math.ceil(ancho / cel), ny = Math.ceil(alto / cel);
  const celdas = new Array(nx * ny);
  rasgos.forEach((f, i) => {
    const cx0 = Math.max(0, Math.floor(f.bb[0] / cel)), cx1 = Math.min(nx - 1, Math.floor(f.bb[2] / cel));
    const cy0 = Math.max(0, Math.floor(f.bb[1] / cel)), cy1 = Math.min(ny - 1, Math.floor(f.bb[3] / cel));
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const k = cy * nx + cx;
        (celdas[k] || (celdas[k] = [])).push(i);
      }
    }
  });
  rejilla = { cel, nx, ny, celdas };
}

function dentro(f, x, y) {
  if (x < f.bb[0] || x > f.bb[2] || y < f.bb[1] || y > f.bb[3]) return false;
  let impar = false;
  for (const r of f.px) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) impar = !impar;
    }
  }
  return impar;
}

function localiza(x, y) {
  if (!rejilla) return null;
  const cx = Math.floor(x / rejilla.cel), cy = Math.floor(y / rejilla.cel);
  if (cx < 0 || cy < 0 || cx >= rejilla.nx || cy >= rejilla.ny) return null;
  const cand = rejilla.celdas[cy * rejilla.nx + cx];
  if (!cand) return null;
  for (const i of cand) if (dentro(rasgos[i], x, y)) return rasgos[i];
  return null;
}

// ================================================================ §4 dibujo
// Valor crudo de la tabla para el estado vigente…
const valorM = (d) => (d ? d.m[estado.variante][estado.vista] : null);
// …y el que el mapa colorea, que es null también cuando el filtro lo esconde:
// un AGEB oculto se pinta como territorio sin dato, no desaparece del mapa.
const pinta = (d) => (oculto(d, estado) ? null : valorM(d));

function repinta() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, ancho, alto);
  ctx.setTransform(dpr * tr.k, 0, 0, dpr * tr.k, dpr * tr.x, dpr * tr.y);

  const t = meta.paleta.tokens;
  // Con el pincel puesto, el AGEB que queda fuera de la selección se pinta con
  // su mismo color atenuado y no en gris: el gris ya significa "sin dato", y
  // reusarlo diría que la selección borró el dato en vez de solo no elegirlo.
  for (const f of rasgos) {
    const d = porClave.get(f.id);
    const m = pinta(d);
    ctx.globalAlpha = estado.pincel && !enPincel(d, estado) ? 0.16 : 1;
    ctx.fillStyle = m === null || m === undefined ? t.gris : color(m);
    traza(ctx, f);
    ctx.fill('evenodd');
  }
  ctx.globalAlpha = 1;

  if (estado.conteo === 'hachurar') hachura();

  // Los AGEB solo se separan cuando el acercamiento los hace legibles; a la
  // vista completa el retículo taparía el mosaico, que es el hallazgo.
  if (tr.k > 3) {
    ctx.lineWidth = 0.35 / tr.k;
    ctx.strokeStyle = alfa(t.tinta, 0.35);
    for (const f of rasgos) { traza(ctx, f); ctx.stroke(); }
  }

  // Alcaldías: línea blanca con filo de tinta, igual que el mapa hero del 2.6.
  ctx.lineJoin = ctx.lineCap = 'round';
  for (const [grosor, tinte] of [[1.6, t.fondo], [0.4, alfa(t.tinta, 0.55)]]) {
    ctx.lineWidth = grosor / tr.k;
    ctx.strokeStyle = tinte;
    for (const f of alcaldias) { traza(ctx, f); ctx.stroke(); }
  }

  resalta();
  $('#reset').hidden = tr.k === 1 && tr.x === 0 && tr.y === 0;
}

// Hachurado de los AGEB de conteo bajo: el color se conserva —el AGEB sigue
// teniendo su valor— y encima va la trama que dice "este número es ruidoso".
// Va en una sola pasada: se recorta con la unión de esos AGEB y se rayan
// líneas rectas sobre todo el lienzo. El recorte queda fijado en píxeles de
// dispositivo, así que las rayas se dibujan sin la transformación de zoom y su
// separación en pantalla no cambia al acercar: la trama marca al AGEB sin
// pretender medir nada dentro de él. La raya va doble, claro bajo oscuro, igual
// que la frontera de alcaldía, porque tiene que leerse sobre los dos extremos
// de la paleta y sobre el neutro del centro.
function hachura() {
  const t = meta.paleta.tokens;
  ctx.save();
  ctx.beginPath();
  let n = 0;
  for (const f of rasgos) {
    if (!esBajo(porClave.get(f.id), estado)) continue;
    n++;
    for (const r of f.px) {
      ctx.moveTo(r[0][0], r[0][1]);
      for (let i = 1; i < r.length; i++) ctx.lineTo(r[i][0], r[i][1]);
      ctx.closePath();
    }
  }
  if (!n) { ctx.restore(); return; }
  ctx.clip('evenodd');

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const paso = 7;
  for (const [grosor, tinte] of [[2, t.fondo], [0.8, alfa(t.tinta, 0.7)]]) {
    ctx.lineWidth = grosor;
    ctx.strokeStyle = tinte;
    ctx.beginPath();
    for (let o = -alto; o < ancho + paso; o += paso) { ctx.moveTo(o, 0); ctx.lineTo(o + alto, alto); }
    ctx.stroke();
  }
  ctx.restore();
}

function traza(c, f) {
  c.beginPath();
  for (const r of f.px) {
    c.moveTo(r[0][0], r[0][1]);
    for (let i = 1; i < r.length; i++) c.lineTo(r[i][0], r[i][1]);
    c.closePath();
  }
}

const ruta = (f) => f.px.map((r) =>
  'M' + r.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z').join('');

// El contorno del AGEB señalado va en SVG y no en el lienzo: así el hover no
// obliga a redibujar los 2,431 polígonos en cada movimiento del cursor.
function resalta() {
  const g = capa.selectAll('g.res').data([0]).join('g').attr('class', 'res');
  g.attr('transform', `translate(${tr.x},${tr.y}) scale(${tr.k})`);

  const capas = [];
  const fSel = estado.sel && porRasgo.get(estado.sel);
  const fHov = estado.hover && estado.hover !== estado.sel && porRasgo.get(estado.hover);
  if (fHov) capas.push({ d: ruta(fHov), w: 1.4, c: meta.paleta.tokens.tinta2 });
  if (fSel) capas.push(
    { d: ruta(fSel), w: 4.5, c: meta.paleta.tokens.fondo },
    { d: ruta(fSel), w: 2.2, c: meta.paleta.tokens.tinta });

  g.selectAll('path').data(capas).join('path')
    .attr('d', (p) => p.d)
    .attr('fill', 'none')
    .attr('stroke', (p) => p.c)
    .attr('stroke-width', (p) => p.w)
    .attr('stroke-linejoin', 'round')
    .attr('vector-effect', 'non-scaling-stroke');

  // El AGEB señalado se marca en las dos vistas desde el mismo lugar: así el
  // mapa y la dispersión no pueden quedar señalando AGEB distintos.
  resaltaPunto();
}

// ========================================================= §5 interacción
function alMover(ev) {
  const [ex, ey] = d3.pointer(ev, capa.node());
  const [mx, my] = tr.invert([ex, ey]);
  const f = localiza(mx, my);
  const clave = f ? f.id : null;
  if (clave !== estado.hover) { estado.hover = clave; resalta(); }
  if (!f) { tip.style.opacity = 0; return; }
  muestraTip(porClave.get(f.id), ex, ey);
}

function alSalir() {
  estado.hover = null; tip.style.opacity = 0; resalta();
}

function alClic(ev) {
  if (arrastro) { arrastro = false; return; }   // fue un paneo, no una selección
  const [ex, ey] = d3.pointer(ev, capa.node());
  const [mx, my] = tr.invert([ex, ey]);
  const f = localiza(mx, my);
  estado.sel = f ? f.id : null;
  pintaDetalle(f ? porClave.get(f.id) : null);
  resalta();
}

function muestraTip(d, ex, ey) {
  const m = valorM(d);
  // Si el filtro lo esconde, el tooltip no da el valor: enseñarlo igual haría
  // del control un adorno. Lo que sí dice es por qué está fuera, y el clic
  // sigue abriendo el panel con su IC, que es el argumento de la exclusión.
  const cuerpo = oculto(d, estado)
    ? '<div class="t-val">conteo bajo</div><div class="t-glosa">' +
      meta.conteos_glosa.conteo_bajo + ': fuera del universo que el mapa colorea</div>'
    : m === null
    ? '<div class="t-val">sin dato</div><div class="t-glosa">sin carpetas en una de las dos ventanas</div>'
    : '<div class="t-val">' + raz(Math.exp(m)) + '</div><div class="t-glosa">' +
      (m >= 0 ? 'más llamadas al 911 por carpeta' : 'más carpetas que llamadas') +
      ' que el AGEB promedio</div>';

  tip.innerHTML =
    '<div class="t-clave">AGEB ' + d.ageb + ' · ' + d.alc + '</div>' + cuerpo +
    '<div class="t-pie">clic para ver el detalle</div>';

  tip.style.opacity = 1;
  const caja = tip.getBoundingClientRect();
  const dx = ex + 16 + caja.width > ancho ? ex - 16 - caja.width : ex + 16;
  const dy = Math.min(Math.max(8, ey - caja.height / 2), alto - caja.height - 8);
  tip.style.transform = `translate(${dx}px,${dy}px)`;
}

// ====================================================== §6 panel de detalle
function pintaDetalle(d) {
  const p = $('#detalle');
  if (!d) { p.innerHTML = panelVacio(); return; }

  const m = valorM(d);
  const bp = estado.vista === 'prom' ? d.m[estado.variante].brecha_prom
                                     : d.ventanas[estado.vista][estado.variante].brecha;

  let h = '<h2>' + d.alc + '</h2><p class="clave">AGEB ' + d.ageb + '</p>';

  if (m === null) {
    h += '<p class="cifra-grande">—</p>' +
         '<p class="cifra-glosa">Sin carpetas de violencia familiar en una de las dos ' +
         'ventanas: queda fuera del universo que el mapa colorea.</p>';
  } else {
    h += '<p class="cifra-grande">' + raz(Math.exp(m)) + '</p>' +
         '<p class="cifra-glosa">contra el AGEB promedio' +
         (estado.vista === 'prom' ? ', promediando las dos ventanas' : '') + '</p>' +
         '<p class="cifra-glosa">en bruto, ' + nf2(bp) + ' llamadas al 911 por carpeta' +
         (estado.vista === 'prom' ? ' (media geométrica de las dos ventanas)' : '') + '</p>';
  }

  h += marcas(d);

  h += '<p class="rotulo">Por ventana</p>';
  if (m !== null) {
    h += '<p class="nota nota-eje">Las barras son el IC 95% de la brecha ' +
         'en escala logarítmica, de ' + raz(EJE_LO) + ' a ' + raz(EJE_HI) +
         '; la punta marca un extremo fuera de ese rango.</p>';
  }
  for (const w of meta.ventanas) h += tarjetaVentana(d, w);

  h += '<p class="rotulo">Contexto del AGEB</p>' + tablaContexto(d);

  p.innerHTML = h;
}

// Las cuentas de este panel son las del estado vigente, no las de `meta`: si
// los controles mueven el universo, el recuadro tiene que moverse con él.
function panelVacio() {
  return '<h2>Ningún AGEB seleccionado</h2>' +
    '<div class="vacio" style="margin-top:12px">' +
    '<p>Pasa el cursor sobre el mapa para leer la brecha de un AGEB; haz clic para fijarlo ' +
    'y ver sus conteos, su intervalo de confianza y sus covariables.</p>' +
    '<table class="ctx">' +
    fila('AGEB coloreados', num(C.coloreados)) +
    fila('en gris, sin dato', num(meta.conteos.sin_dato)) +
    (C.ocultos ? fila('de conteo bajo, ocultos', num(C.ocultos)) : '') +
    fila('que saturan la escala', num(C.saturados)) +
    '</table>' +
    '<p class="nota">' + meta.conteos_glosa.universo_primario + '.</p>' +
    '</div>';
}

function marcas(d) {
  const ms = [];
  if (meta.ventanas.some((w) => d.ventanas[w].conteo_bajo)) {
    ms.push(['aviso', 'conteo bajo', meta.conteos_glosa.conteo_bajo]);
  }
  if (oculto(d, estado)) ms.push(['aviso', 'oculto en el mapa por el filtro']);
  if (d.sensible_s1) ms.push(['aviso', 'cambia de clase con S1']);
  if (d.excluido_h2) ms.push(['aviso', 'fuera de la estimación de H2']);
  if (!d.poligono) ms.push(['aviso', 'sin polígono en el shapefile']);
  if (!ms.length) return '';
  return '<div class="marcas">' +
    ms.map(([c, t, tit]) => '<span class="chip ' + c + '"' +
      (tit ? ' title="' + tit + '"' : '') + '>' + t + '</span>').join('') + '</div>';
}

function tarjetaVentana(d, w) {
  const v = d.ventanas[w];
  const a = v[estado.variante];
  const otra = estado.variante === 's0' ? 's19' : 's0';
  const llam = estado.variante === 's0' ? v.llamadas : v.s19.llamadas;

  let h = '<div class="ventana' + (estado.vista === w ? ' activa' : '') +
          '"><p class="v-nom">' + meta.ventanas_etiqueta[w] +
          (estado.vista === w ? ' · en el mapa' : '') + '</p>';
  h += '<p class="v-cuenta">' + plural(llam, 'llamada', 'llamadas') + ' · ' +
       plural(v.carpetas, 'carpeta', 'carpetas') +
       (v.conteo_bajo ? ' · <span class="chip aviso">conteo bajo</span>' : '') + '</p>';

  if (a.brecha === null) {
    h += '<p class="v-s1">Sin carpetas en esta ventana: la brecha no está definida.</p></div>';
    return h;
  }

  h += barraIC(a, w) +
       '<p class="v-s1">' + (estado.variante === 's0' ? 'Con el 19% de robo descontado' :
         'Sin descontar robo') + ': ' +
       (v[otra].brecha === null ? 'sin brecha' : raz(v[otra].brecha)) + ' · ' + v[otra].clasificacion +
       (v.cambia_clasif_s1 ? ' <span class="chip aviso">cambia</span>' : '') + '</p></div>';
  return h;
}

// El intervalo se dibuja, no se cita: a conteos bajos el IC abarca un orden de
// magnitud y la clasificación "indistinguible" deja de ser una palabra. El eje
// es fijo y simétrico en log alrededor de 1 para que las barras de dos AGEB se
// puedan comparar entre sí; con este rango, 18% de los pares AGEB × ventana
// tienen al menos un extremo fuera, y esos llevan punta.
const EJE_LO = 0.02, EJE_HI = 50;
function barraIC(a, w) {
  const W = 300, H = 40, y = 15, R = 11;
  const x = d3.scaleLog().domain([EJE_LO, EJE_HI]).range([R, W - R]).clamp(true);
  const ciudad = meta.s1.brecha_ciudad[estado.variante][w];
  const clase = a.clasificacion === 'alta' ? meta.paleta.tokens.rojo
              : a.clasificacion === 'baja' ? meta.paleta.tokens.azul
              : meta.paleta.tokens.tinta2;
  const t2 = meta.paleta.tokens.tinta2, gr = meta.paleta.tokens.gris;

  const lo = a.ic95[0] === null ? 0 : a.ic95[0];
  const hi = a.ic95[1] === null ? Infinity : a.ic95[1];

  // Un extremo fuera del eje se dibuja como punta, no como tope: un tope en el
  // borde haría ver acotado un intervalo que no lo está.
  const remate = (v, fuera, dir) => {
    const px = x(v);
    return fuera
      ? `<polygon points="${px},${y - 5} ${px},${y + 5} ${px + dir * 8},${y}" fill="${clase}"/>`
      : `<line x1="${px}" x2="${px}" y1="${y - 4}" y2="${y + 4}" stroke="${clase}" stroke-width="1.5"/>`;
  };

  return `<svg width="${W}" height="${H}" role="img" aria-label="IC 95% de la brecha">
    <line x1="${R}" x2="${W - R}" y1="${y + 11}" y2="${y + 11}" stroke="${gr}" stroke-width="1"/>
    <line x1="${x(ciudad)}" x2="${x(ciudad)}" y1="2" y2="${y + 7}"
          stroke="${t2}" stroke-width="1" stroke-dasharray="3 2"/>
    <text x="${x(ciudad) + 4}" y="8" font-size="9.5" fill="${t2}">ciudad ${raz(ciudad)}</text>
    <line x1="${x(lo)}" x2="${x(hi)}" y1="${y}" y2="${y}" stroke="${clase}" stroke-width="2.5"/>
    ${remate(lo, lo <= EJE_LO, -1)}
    ${remate(hi, hi >= EJE_HI, +1)}
    <circle cx="${x(a.brecha)}" cy="${y}" r="4" fill="${clase}"
            stroke="${meta.paleta.tokens.fondo}" stroke-width="1.2"/>
    <text x="0" y="${H - 2}" font-size="10" fill="${t2}">${raz(a.brecha)} · ${a.clasificacion}</text>
    <text x="${W}" y="${H - 2}" font-size="10" fill="${t2}" text-anchor="end">IC 95% ${brev(lo)} – ${brev(hi)}</text>
  </svg>`;
}

function fila(k, v) { return '<tr><td>' + k + '</td><td>' + v + '</td></tr>'; }

// Unidad de cada covariable, en un solo lugar: la usan la tabla del panel de
// detalle y el eje x de la dispersión (§11). `eje` es la versión corta, para
// que las marcas del eje no se amontonen.
const UNIDAD = {
  GRAPROES: { larga: (v) => nf1(v) + ' grados', eje: (v) => nf0(v), nombre: 'grados' },
  pct_der_ss: { larga: (v) => pct1(v), eje: (v) => pct0(v), nombre: 'puntos' },
  PRO_OCUP_C: { larga: (v) => nf2(v) + ' ocup./cuarto', eje: (v) => nf1(v), nombre: 'ocupantes por cuarto' }
};
// "escolaridad (grados promedio)" -> "Escolaridad": el nombre corto sale de la
// etiqueta de `meta`, no se vuelve a teclear.
const corto = (c) => {
  const s = c.etiqueta.replace(/\s*\(.*\)$/, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function tablaContexto(d) {
  const viv = d.viv_protegido ? 'protegido por INEGI' : num(d.viviendas);
  let h = '<table class="ctx">' + fila('Viviendas particulares habitadas', viv);

  for (const c of meta.h2.coeficientes) {
    const v = d.cov[c.covariable];
    h += fila(c.etiqueta.replace(/\s*\(.*\)$/, ''), v === null ? '—' : UNIDAD[c.covariable].larga(v));
  }
  h += '</table>';

  if (d.cov.GRAPROES === null) {
    h += '<p class="nota">' + (d.universo.primario
      ? 'INEGI protegió estas variables por confidencialidad en este AGEB, que por eso ' +
        'queda fuera de la estimación de H2.'
      : 'Las covariables solo se cargaron para los AGEB del universo principal.') + '</p>';
  }
  return h;
}

// ============================================================== §7 escala
// Alto de la rampa (tarea 4.5). La leyenda mide 418 px con la rampa larga y el
// mapa no siempre los tiene: en un proyector de 768 px el cuerpo se queda con
// ~300 y la leyenda se dibujaba encima del pie. La rampa se encoge dentro de
// este rango declarado y **la tipografía no se toca**, que es lo que hay que
// leer proyectado. Es reparto, no cifra: las cinco marcas siguen siendo los
// cortes de `meta.escala`, puestos sobre una rampa más corta.
const RAMPA = { max: 196, min: 96 };

function dibujaEscala() {
  const e = meta.escala, lim = e.lim_2sigma_log, r = e.cortes_razon_redondeados;
  const W = 150, X0 = 6, BW = 19, Y0 = 78, cap = 9;
  // Todo lo que no es rampa: el encabezado de la leyenda y el bloque de claves
  // de abajo, que crece cuando el filtro de conteo bajo está puesto.
  const FIJO = Y0 + (estado.conteo === 'mostrar' ? 144 : 181);
  const hueco = (alto > 1 ? alto : RAMPA.max + FIJO + 18) - 18;   // 10 arriba + 8 abajo
  const BH = Math.round(Math.max(RAMPA.min, Math.min(RAMPA.max, hueco - FIJO)));
  const y = (v) => Y0 + (lim - v) / (2 * lim) * BH;
  const t = meta.paleta.tokens;

  // La entrada del filtro de conteo bajo solo existe cuando el filtro está
  // puesto: una leyenda con una clave que el mapa no usa es una leyenda falsa.
  const B = Y0 + BH + 150;
  const bajo = estado.conteo === 'mostrar' ? '' : `
  <rect x="${X0}" y="${B}" width="18" height="11"
        fill="${estado.conteo === 'hachurar' ? 'url(#trama)' : t.gris}"/>
  <text x="${X0 + 24}" y="${B + 9}" font-size="11" fill="${t.tinta2}">conteo bajo,</text>
  <text x="${X0 + 24}" y="${B + 22}" font-size="11" fill="${t.tinta2}">${
        estado.conteo === 'ocultar' ? 'oculto' : 'señalado'} (${num(C.bajos)})</text>`;
  const HT = FIJO + BH;                        // última línea + descendente

  // Las paradas van en offset ascendente (el SVG lo exige); quien invierte el
  // sentido es el vector del gradiente, que sube de y1 = 1 a y2 = 0. Con las
  // dos inversiones la rampa salía de un solo color.
  const paradas = meta.paleta.divergente.map((c, i, a) =>
    `<stop offset="${(100 * i / (a.length - 1)).toFixed(1)}%" stop-color="${c}"/>`).join('');

  const marcas = [
    [lim, r.mas2sigma], [lim / 2, r.mas1sigma], [0, 1], [-lim / 2, r.menos1sigma], [-lim, r.menos2sigma]
  ].map(([v, et]) => `
    <line x1="${X0 + BW}" x2="${X0 + BW + 4}" y1="${y(v)}" y2="${y(v)}" stroke="${t.tinta}" stroke-width="1"/>
    <text x="${X0 + BW + 7}" y="${y(v) + 4}" font-size="12.5" fill="${t.tinta}">×${nf2(et)}</text>`).join('');

  $('#escala').innerHTML = `
<svg width="${W}" height="${HT}" font-family="inherit">
  <rect x="0" y="0" width="${W}" height="${HT}" fill="${t.fondo}" opacity="0.82"/>
  <text x="${X0}" y="14" font-size="12.5" font-weight="700" fill="${t.tinta}">Brecha del AGEB ÷</text>
  <text x="${X0}" y="29" font-size="12.5" font-weight="700" fill="${t.tinta}">la del AGEB promedio</text>

  <text x="${X0}" y="52" font-size="11" fill="${t.tinta2}">más llamadas</text>
  <text x="${X0}" y="65" font-size="11" fill="${t.tinta2}">al 911 por carpeta</text>

  <defs>
    <linearGradient id="rampa" x1="0" y1="1" x2="0" y2="0">${paradas}</linearGradient>
    <pattern id="trama" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="5" height="5" fill="${t.neutro}"/>
      <line x1="0" y1="0" x2="0" y2="5" stroke="${alfa(t.tinta, 0.7)}" stroke-width="0.9"/>
    </pattern>
  </defs>
  <polygon points="${X0},${Y0} ${X0 + BW},${Y0} ${X0 + BW / 2},${Y0 - cap}" fill="${meta.paleta.divergente.at(-1)}"/>
  <rect x="${X0}" y="${Y0}" width="${BW}" height="${BH}" fill="url(#rampa)"/>
  <polygon points="${X0},${Y0 + BH} ${X0 + BW},${Y0 + BH} ${X0 + BW / 2},${Y0 + BH + cap}" fill="${meta.paleta.divergente[0]}"/>
  ${marcas}
  <line x1="${X0 - 2}" x2="${X0 + BW + 2}" y1="${y(e.centro_ciudad_log)}" y2="${y(e.centro_ciudad_log)}"
        stroke="${t.tinta}" stroke-width="1.6" stroke-dasharray="4 3"/>

  <text x="${X0}" y="${Y0 + BH + 32}" font-size="11" fill="${t.tinta2}">más carpetas</text>
  <text x="${X0}" y="${Y0 + BH + 45}" font-size="11" fill="${t.tinta2}">que llamadas</text>

  <line x1="${X0}" x2="${X0 + 18}" y1="${Y0 + BH + 68}" y2="${Y0 + BH + 68}"
        stroke="${t.tinta}" stroke-width="1.6" stroke-dasharray="4 3"/>
  <text x="${X0 + 24}" y="${Y0 + BH + 72}" font-size="11" fill="${t.tinta2}">brecha de la</text>
  <text x="${X0 + 24}" y="${Y0 + BH + 85}" font-size="11" fill="${t.tinta2}">ciudad (${raz(e.centro_ciudad_razon)})</text>

  <rect x="${X0}" y="${Y0 + BH + 100}" width="18" height="11" fill="${t.gris}"/>
  <text x="${X0 + 24}" y="${Y0 + BH + 109}" font-size="11" fill="${t.tinta2}">sin carpetas en</text>
  <text x="${X0 + 24}" y="${Y0 + BH + 122}" font-size="11" fill="${t.tinta2}">una ventana</text>
  <text x="${X0 + 24}" y="${Y0 + BH + 135}" font-size="11" fill="${t.tinta2}">(${num(meta.conteos.sin_dato)} de ${num(meta.conteos.ageb_total)} AGEB)</text>
  ${bajo}
</svg>`;
}

// ============================================ §8 encabezado y pie, desde meta
function textoFijo() {
  const h1 = meta.h1;

  $('#anotacion').innerHTML =
    'La brecha varía <b>' + nf1(h1.razon_unidad_alcaldia) + '×</b> más entre AGEB que entre alcaldías ' +
    '(IC 95% ' + nf1(h1.razon_ic95[0]) + '–' + nf1(h1.razon_ic95[1]) + '): solo el <b>' +
    nf0(h1.icc_alcaldia * 100) + '%</b> de la varianza es de alcaldía.';

  // Los cuatro límites de `meta` siguen todos en pantalla, pero el de nivel va
  // dibujado al lado (§12) en vez de citado aquí: tenerlo en los dos lugares
  // ponía la misma cifra dos veces, con dos redondeos, y eso es exactamente la
  // clase de doble número que un sinodal pregunta.
  $('#limites').innerHTML = meta.limites
    .filter((l) => l.clave !== 'nivel')
    .map((l) => '<li><b>' + l.clave + '</b> · ' + l.texto + '</li>').join('');

  dibujaNivel();       // el acotamiento de la ENDIREH, dibujado (§12)

  $('#fuente').textContent =
    'Llamadas al 911 del C5 y carpetas de investigación de la FGJ-CDMX, agregadas por AGEB ' +
    'del Censo 2020 (' + meta.crs.nombre + '). ' + meta.congelamiento + '.';
}

// Lo que sí cambia con los controles: el universo del subtítulo, el contador de
// sensibilidad y el supuesto de la escala. Las tres frases son prosa escrita a
// mano con las cifras leídas de `C` (cuentas del estado) o de `meta`.
function textoVivo() {
  const s1 = meta.s1, v = s1.variantes, e = meta.escala;
  const etqs = meta.ventanas.map((w) => meta.ventanas_etiqueta[w]);

  $('#subtitular').textContent =
    'Brecha = llamadas al 911 ÷ carpetas de investigación de la FGJ, comparada con la del AGEB promedio · ' +
    num(C.coloreados) + ' AGEB coloreados' +
    (C.ocultos ? ' de los ' + num(meta.conteos.universo_primario) : '') +
    ' con carpeta en las dos ventanas · ' +
    (estado.vista === 'prom' ? 'promedio de ' + etqs.join(' y ')
                             : 'solo ' + meta.ventanas_etiqueta[estado.vista]) +
    ' · ' + num(meta.conteos.sin_dato) + ' sin dato en gris' +
    (C.ocultos ? ' · ' + num(C.ocultos) + ' de conteo bajo, ocultos' : '') + '.';

  // El contador de sensibilidad (§4.3 del plan). Va dirigido: dice qué pasa al
  // apretar el otro botón, no cuántos se movieron ya. El número es el mismo en
  // los dos sentidos, pero así se lee como la consecuencia del control. La
  // lectura de que ninguno se invierte no la decide la app: viene de `meta`.
  const aqui = v.find((x) => x.id === estado.variante), alla = v.find((x) => x.id !== estado.variante);
  $('#sensibilidad').innerHTML =
    'Al pasar de ' + pct0(aqui.pct) + ' a ' + pct0(alla.pct) + ' de robo descontado, <b>' +
    num(C.sensibles) + '</b> de los <b>' + num(C.coloreados) +
    '</b> AGEB a la vista cambian de clasificación y ' + s1.cambian_clasificacion.lectura + '.';

  const r = e.cortes_razon_redondeados;
  $('#supuesto-ctrl').textContent =
    'Supuesto: la escala no se reajusta al mover los controles — sigue anclada a ±2σ de la ' +
    'variante publicada (' + raz(r.mas2sigma) + ' a ' + raz(r.menos2sigma) + '). Si se reajustara, ' +
    'un mapa que se movió se vería igual de intenso y el control mentiría' +
    (estado.variante === 's19'
      ? '; bajo esta variante σ sube a ' + nf2(e.sigma_ageb_s1_referencia) +
        ' desde ' + nf2(e.sigma_ageb) + ', y la escala sigue siendo la de la principal.'
      : '.');
  $('#supuesto-ctrl').title = e.escala_fija_bajo_s1;
}

// ===================================== §9 controles de supuestos (tarea 4.3)
// Un solo lugar declara los tres grupos; los botones, sus etiquetas y sus
// títulos salen de `meta`. El 19% de S1 no está tecleado: es `variantes[1].pct`.
function grupos() {
  return [
    { campo: 'vista', rotulo: 'Ventana', tecla: '1 2 3',
      ops: [{ id: 'prom', et: 'Las dos', tit: meta.campos['m.<v>.prom'] }].concat(
        meta.ventanas.map((w) => ({ id: w, et: meta.ventanas_etiqueta[w],
          tit: 'solo esta ventana; el universo sigue siendo el de las dos' }))) },
    { campo: 'variante', rotulo: 'S1 · robo descontado', tecla: 'S',
      ops: meta.s1.variantes.map((x) => ({ id: x.id, et: pct0(x.pct), tit: x.etiqueta })) },
    { campo: 'conteo', rotulo: 'AGEB de conteo bajo', tecla: 'C', cuenta: true,
      ops: [
        { id: 'mostrar', et: 'Mostrar', tit: 'los pinta como cualquier otro' },
        { id: 'hachurar', et: 'Hachurar', tit: 'conserva su color y les pone trama' },
        { id: 'ocultar', et: 'Ocultar', tit: 'los deja en gris: el mapa queda con los de conteo alto' }
      ] }
  ];
}

function construyeMandos() {
  const cont = $('#mandos');
  cont.innerHTML = grupos().map((g) => {
    const bot = g.ops.map((o) =>
      '<button type="button" data-campo="' + g.campo + '" data-id="' + o.id +
      '" aria-pressed="false" title="' + o.tit + '">' + o.et + '</button>').join('');
    return '<div class="ctrl"><p class="c-rotulo" id="rot-' + g.campo + '">' + g.rotulo +
      (g.cuenta ? ' · <span class="c-n"></span>' : '') +
      ' <kbd>' + g.tecla + '</kbd></p>' +
      '<div class="seg" role="group" aria-label="' + g.rotulo + '">' + bot + '</div></div>';
  }).join('');

  cont.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-campo]');
    if (b) aplica(b.dataset.campo, b.dataset.id);
  });
  marcaMandos();
}

function marcaMandos() {
  for (const b of $('#mandos').querySelectorAll('button[data-campo]')) {
    b.setAttribute('aria-pressed', String(estado[b.dataset.campo] === b.dataset.id));
  }
  // Las pestañas de covariable del 4.4 son el cuarto control y se marcan igual:
  // si no, la tecla X movería la nube sin que nada en pantalla diga cuál está.
  for (const b of $('#disp-tabs').querySelectorAll('button[data-id]')) {
    b.setAttribute('aria-pressed', String(estado.cov === b.dataset.id));
  }
  const n = $('#rot-conteo .c-n');
  if (n) n.textContent = num(C.bajos);
}

// Un cambio de control vuelve a contar y repinta todo lo que depende del
// estado: mapa, leyenda, subtítulo, contador y el panel del AGEB fijado.
function aplica(campo, id) {
  if (estado[campo] === id) return;
  estado[campo] = id;
  // Cambiar de covariable suelta el pincel: el rectángulo estaba dibujado sobre
  // un eje x que ya no existe, y conservar sus límites seleccionaría otra cosa
  // sin que el usuario lo haya pedido.
  if (campo === 'cov') estado.pincel = null;
  recuenta();
  marcaMandos();
  textoVivo();

  // `textoVivo` puede cambiar el alto del encabezado —la frase de sensibilidad
  // pasa de dos renglones a tres al poner el filtro— y con él el del cuerpo.
  // Desde el 4.5 la leyenda y la nube dependen de ese alto, así que se vuelve
  // a medir aquí en vez de esperar al ResizeObserver: medido con el arnés, sin
  // esto la leyenda se dibujaba 13 px por fuera del mapa durante un cuadro.
  const h = Math.round($('#mapa-cont').getBoundingClientRect().height);
  if (h > 1 && h !== alto) redimensiona(); else dibujaEscala();
  redimensionaDisp();

  pintaDetalle(estado.sel ? porClave.get(estado.sel) : null);
  dibujaDisp();
  repinta();
}

function cicla(campo) {
  const g = grupos().find((x) => x.campo === campo);
  const i = g.ops.findIndex((o) => o.id === estado[campo]);
  aplica(campo, g.ops[(i + 1) % g.ops.length].id);
}

// ======================================= §10 cuentas del estado y su control
// Las tres preguntas que los controles hacen sobre un AGEB. Reciben el estado
// como argumento (y no leen `estado`) para que `verifica()` pueda evaluarlas
// en estados que la vista no tiene puestos.
const esBajo = (d, st) => !!d && d.universo.primario &&
  (st.vista === 'prom' ? !d.universo.conteo_alto : d.ventanas[st.vista].conteo_bajo);
const oculto = (d, st) => st.conteo === 'ocultar' && esBajo(d, st);
const cambiaS1 = (d, st) =>
  st.vista === 'prom' ? d.sensible_s1 : d.ventanas[st.vista].cambia_clasif_s1;

// La cuarta pregunta, la del 4.4: ¿este AGEB cae dentro del rectángulo que el
// usuario dibujó sobre la dispersión? Sin pincel, todos cuentan. Un AGEB sin la
// covariable a la vista no está en la nube, así que tampoco puede estar dentro.
function enPincel(d, st) {
  if (!st.pincel) return true;
  if (!d || !d.universo.primario) return false;
  const x = d.cov[st.cov], y = d.m[st.variante][st.vista];
  if (x === null || y === null) return false;
  const p = st.pincel;
  return x >= p.x[0] && x <= p.x[1] && y >= p.y[0] && y <= p.y[1];
}

// Una sola pasada sobre las 2,433 filas. `coloreados` y `ocultos` son lo que el
// mapa pinta; `sensibles` y `saturados` se cuentan solo sobre lo visible,
// porque el contador habla de lo que el usuario está viendo.
function cuentas(st) {
  const lim = meta.escala.lim_2sigma_log;
  const c = { coloreados: 0, bajos: 0, ocultos: 0, sensibles: 0, saturados: 0,
              dibujados: 0, pincelados: 0, borde: 0 };
  const limY = D ? D.limY : null;          // dominio del eje y de la dispersión (§11)
  for (const d of porClave.values()) {
    if (!d.universo.primario) continue;
    if (esBajo(d, st)) c.bajos++;
    if (oculto(d, st)) { c.ocultos++; continue; }
    c.coloreados++;
    if (cambiaS1(d, st)) c.sensibles++;
    const m = d.m[st.variante][st.vista];
    if (m !== null && Math.abs(m) > lim) c.saturados++;
    // Las tres del 4.4: los que la nube dibuja, los que el pincel selecciona y
    // los que quedan pegados al borde del eje y.
    if (m !== null && d.cov[st.cov] !== null) {
      c.dibujados++;
      if (enPincel(d, st)) c.pincelados++;
      if (limY !== null && Math.abs(m) > limY) c.borde++;
    }
  }
  return c;
}

function recuenta() { C = cuentas(estado); }

// El control de que contar no se volvió estimar: con los controles en su
// posición de arranque, y con el filtro de conteo bajo puesto, las cuentas
// vivas tienen que dar exactamente las cifras congeladas de `meta`. Si una no
// da, el problema está en el código de arriba, no en el dato.
function verifica() {
  const k = meta.conteos, s = meta.s1.cambian_clasificacion;
  const base = { variante: 's0', vista: 'prom', conteo: 'mostrar', cov: estado.cov, pincel: null };
  const a = cuentas(base), b = cuentas(Object.assign({}, base, { conteo: 'ocultar' }));

  const pares = [
    ['AGEB coloreados', a.coloreados, k.universo_primario],
    ['AGEB de conteo bajo', a.bajos, k.conteo_bajo],
    ['AGEB que saturan la escala', a.saturados, k.saturados_2sigma],
    ['sensibles a S1 en el universo', a.sensibles, s.en_universo],
    ['AGEB de conteo alto', b.coloreados, k.conteo_alto],
    ['sensibles a S1 de conteo alto', b.sensibles, s.no_conteo_bajo]
  ];
  // Las de `por_ventana` están contadas sobre las 2,433 filas, no sobre el
  // universo, así que se verifican aparte y sobre la tabla completa.
  for (const w of meta.ventanas) {
    let n = 0;
    for (const d of porClave.values()) if (d.ventanas[w].cambia_clasif_s1) n++;
    pares.push(['cambios de clase con S1 en ' + w, n, s.por_ventana[w]]);
  }

  // Lo mismo para el 4.4, covariable por covariable: lo que la nube dibuja, lo
  // que INEGI protegió y —la que importa— que un pincel abierto sobre todo el
  // dominio seleccione exactamente a los dibujados. Si esa última no diera,
  // seleccionar habría dejado de ser filtrar.
  const TODO = { x: [-Infinity, Infinity], y: [-Infinity, Infinity] };
  for (const c of meta.h2.coeficientes) {
    const n = c.n_dispersion;
    const e = Object.assign({}, base, { cov: c.covariable });
    const u = cuentas(e), t = cuentas(Object.assign({}, e, { pincel: TODO }));
    pares.push(
      ['AGEB dibujables de ' + c.covariable, u.dibujados, n.dibujables],
      ['AGEB sin ' + c.covariable, k.universo_primario - u.dibujados, n.sin_covariable],
      ['AGEB en un pincel abierto de ' + c.covariable, t.pincelados, n.dibujables]);
  }

  const malas = pares.filter(([, vivo, fijo]) => vivo !== fijo);
  for (const [q, vivo, fijo] of malas) {
    console.error('4.3/4.4: la cuenta viva de ' + q + ' da ' + vivo + ' y meta dice ' + fijo);
  }
  if (!malas.length) console.info('4.3/4.4: las ' + pares.length + ' cuentas vivas coinciden con meta');
  return malas;
}

// ====================================== §11 dispersión ligada (tarea 4.4)
// Brecha contra covariable, con la recta de H2 y pincel en los dos sentidos.
// Dos capas, igual que el mapa: los puntos en <canvas> —son hasta 2,286 y el
// hover no puede obligar a redibujarlos— y los ejes, la recta, el pincel y las
// marcas de selección en <svg> encima.
//
// REGLA DEL EJE VERTICAL, declarada antes de medir (PLAN_31_OCT.md §4.8): el
// dominio es ±K_EJE · DE(m), con DE(m) = √(meta.escala.var_m_observada), la
// dispersión observada de la cantidad que pinta el mapa, publicada en `meta`.
// Es la misma regla de forma del panel A de la figura 2 del 3.2 (±2.5 DE) y NO
// se reajusta al mover ningún control: si se reajustara, una nube que se
// ensanchó al descontar robo se vería igual de ancha y el control mentiría. Lo
// que cuesta: los AGEB de fuera se dibujan pegados al borde con punta, y el pie
// dice cuántos son en el estado vigente.
const K_EJE = 2.5;
const MARG = { l: 41, r: 10, t: 10, b: 31 };
// Alto del lienzo de la nube (tarea 4.5). Mismo criterio que la rampa de la
// leyenda: se encoge dentro de un rango declarado para que el panel de detalle
// conserve siempre una franja legible, y la tipografía de los ejes no se toca.
// El dominio vertical NO cambia —sigue siendo ±2.5·DE(m)—, así que encoger el
// lienzo no reajusta la escala de la nube: solo la dibuja más apretada.
const DISP = { max: 234, min: 120 };
const DETALLE_MIN = 80;
const nf4 = dec(4);
const coefDe = (c) => meta.h2.coeficientes.find((x) => x.covariable === c);

function construyeDisp() {
  D = {
    limY: K_EJE * Math.sqrt(meta.escala.var_m_observada),
    W: 0, H: DISP.max, X: null, Y: null, pts: [], dom: {},
    lienzo: $('#disp-lienzo'), capa: d3.select('#disp-capa'), tip: $('#disp-tip')
  };
  D.ctx = D.lienzo.getContext('2d');

  // Extensión de cada covariable sobre el universo del mapa. No depende de
  // ningún control —son niveles del Censo 2020—, así que se mide una vez: el
  // eje x tampoco se mueve al filtrar, al cambiar de ventana ni al mover S1.
  // No se recorta por percentiles: los AGEB con escolaridad 0 son reales
  // (institucionales o casi sin población) y esconderlos sería elegir la nube.
  for (const c of meta.h2.coeficientes) {
    let lo = Infinity, hi = -Infinity;
    for (const d of porClave.values()) {
      if (!d.universo.primario) continue;
      const v = d.cov[c.covariable];
      if (v === null) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    D.dom[c.covariable] = [lo, hi];
  }

  $('#disp-rotulo').innerHTML = 'La brecha y una covariable <kbd>X</kbd>';
  const tabs = $('#disp-tabs');
  tabs.innerHTML = meta.h2.coeficientes.map((c) =>
    '<button type="button" data-id="' + c.covariable + '" aria-pressed="false" title="' +
    c.etiqueta + ' · ' + c.veredicto + ': ' + c.motivo + '">' + corto(c) + '</button>').join('');
  tabs.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-id]');
    if (b) aplica('cov', b.dataset.id);
  });
  $('#disp-pie').addEventListener('click', (ev) => {
    if (ev.target.id === 'suelta') sueltaPincel();
  });
  marcaMandos();       // las pestañas no existían cuando corrió construyeMandos

  // Orden de las capas del SVG: ejes, recta, marcas y el pincel al final, que
  // es el que tiene que recibir el arrastre. Su rectángulo no pinta nada, así
  // que las marcas de abajo se siguen viendo.
  D.capa.html('<defs><clipPath id="disp-rec"><rect id="disp-clip"/></clipPath></defs>');
  D.gEjes = D.capa.append('g');
  D.gRecta = D.capa.append('g').attr('clip-path', 'url(#disp-rec)');
  D.gMarcas = D.capa.append('g');
  D.pincel = d3.brush().on('end', alPincel);
  D.gPincel = D.capa.append('g').attr('class', 'pincel');

  D.capa.on('mousemove', sobrePunto).on('mouseleave', fueraPunto).on('click', clicPunto);
  redimensionaDisp();
}

function redimensionaDisp() {
  if (!D) return;
  const caja = $('#disp-caja').getBoundingClientRect();
  const w = Math.max(230, Math.round(caja.width));
  const r = window.devicePixelRatio || 1;

  // Lo que la columna lateral puede darle a la nube: su alto, menos lo que la
  // sección ocupa fuera del lienzo (rótulo, pestañas, glosa y pie) y menos la
  // franja que el panel de detalle conserva. Con el alto sin medir —el arnés
  // de jsdom no hace layout— se queda con el máximo del rango.
  const altoLado = $('#lado').getBoundingClientRect().height;
  const fuera = $('#dispersion').getBoundingClientRect().height - D.H;
  const h = altoLado > 1
    ? Math.round(Math.max(DISP.min, Math.min(DISP.max, altoLado - fuera - DETALLE_MIN)))
    : DISP.max;

  if (w === D.W && r === D.r && h === D.H) return;
  D.W = w; D.r = r; D.H = h;

  D.lienzo.width = Math.round(w * r);
  D.lienzo.height = Math.round(D.H * r);
  D.lienzo.style.height = D.H + 'px';
  D.capa.attr('viewBox', `0 0 ${w} ${D.H}`);
  d3.select('#disp-clip')
    .attr('x', MARG.l).attr('y', MARG.t)
    .attr('width', w - MARG.l - MARG.r).attr('height', D.H - MARG.t - MARG.b);

  // Al cambiar de tamaño el rectángulo del pincel ya no cubre lo mismo, así que
  // se suelta en vez de reinterpretarse: un pincel que se mueve solo miente.
  D.pincel.extent([[MARG.l, MARG.t], [w - MARG.r, D.H - MARG.b]]);
  D.gPincel.call(D.pincel);
  if (estado.pincel) { estado.pincel = null; repinta(); }
  // Hasta aquí `D.limY` no existía, así que la cuenta de los que quedan en el
  // borde del eje se hizo con el eje apagado: hay que recontar antes de dibujar.
  recuenta();
  dibujaDisp();
}

function dibujaDisp() {
  if (!D || !D.W) return;
  const t = meta.paleta.tokens, c = coefDe(estado.cov), u = UNIDAD[estado.cov];
  const est = c.estandarizacion, n = c.n_dispersion;

  D.X = d3.scaleLinear().domain(D.dom[estado.cov]).nice().range([MARG.l, D.W - MARG.r]);
  D.Y = d3.scaleLinear().domain([-D.limY, D.limY]).range([D.H - MARG.b, MARG.t]);
  const cl = (m) => Math.max(-D.limY, Math.min(D.limY, m));

  // --- los puntos: una pasada, con las mismas banderas que usa el mapa -------
  D.pts = [];
  for (const d of porClave.values()) {
    if (!d.universo.primario) continue;
    const vx = d.cov[estado.cov], m = d.m[estado.variante][estado.vista];
    if (vx === null || m === null) continue;
    // El filtro de conteo bajo del 4.3 también manda aquí, con una diferencia:
    // en el mapa un AGEB oculto se queda en gris porque el territorio sigue
    // ahí, y en la nube se va. Una marca gris entre los puntos no diría "sin
    // dato": diría un valor que el filtro acaba de declarar no utilizable.
    if (oculto(d, estado)) continue;
    D.pts.push({ d, px: D.X(vx), py: D.Y(cl(m)), m, vx,
                 fuera: Math.abs(m) > D.limY, dentro: enPincel(d, estado),
                 bajo: esBajo(d, estado) });
  }

  const g = D.ctx;
  g.setTransform(D.r, 0, 0, D.r, 0, 0);
  g.clearRect(0, 0, D.W, D.H);
  // Dos pasadas: primero lo que el pincel no eligió, para que lo elegido quede
  // encima. Sin pincel la primera pasada está vacía.
  for (const paso of [false, true]) {
    for (const p of D.pts) {
      if (p.dentro !== paso) continue;
      g.globalAlpha = p.dentro ? 0.6 : 0.13;
      const col = color(p.m);
      if (p.fuera) {
        // Punta en el borde, igual que los extremos del IC del panel: un punto
        // redondo en el borde haría ver acotado un valor que no lo está.
        const s = p.m > 0 ? 1 : -1;
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(p.px - 3, p.py + s * 3.4);
        g.lineTo(p.px + 3, p.py + s * 3.4);
        g.lineTo(p.px, p.py - s * 1.6);
        g.closePath();
        g.fill();
      } else if (estado.conteo === 'hachurar' && p.bajo) {
        // El equivalente de la trama del mapa: el punto conserva su color y se
        // queda hueco, que es lo que se lee a este tamaño.
        g.strokeStyle = col; g.lineWidth = 1.1;
        g.beginPath(); g.arc(p.px, p.py, 2.3, 0, 6.2832); g.stroke();
      } else {
        g.fillStyle = col;
        g.beginPath(); g.arc(p.px, p.py, 2.1, 0, 6.2832); g.fill();
      }
    }
  }
  g.globalAlpha = 1;

  // --- ejes, recta de H2 y anclaje -----------------------------------------
  const x0 = D.X.range()[0], x1 = D.X.range()[1];
  let h = '';
  for (const v of [-1.5, -1, -0.5, 0, 0.5, 1, 1.5]) {
    if (Math.abs(v) > D.limY) continue;
    const y = D.Y(v), cero = v === 0;
    h += `<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="${cero ? t.tinta2 : t.gris}"
            stroke-width="${cero ? 0.9 : 0.5}"${cero ? '' : ' opacity="0.7"'}/>
          <text x="${x0 - 4}" y="${y + 3.5}" font-size="9.5" fill="${t.tinta2}" text-anchor="end">×${nf2(Math.exp(v))}</text>`;
  }
  for (const v of D.X.ticks(5)) {
    h += `<line x1="${D.X(v)}" x2="${D.X(v)}" y1="${D.H - MARG.b}" y2="${D.H - MARG.b + 3}" stroke="${t.tinta2}" stroke-width="0.8"/>
          <text x="${D.X(v)}" y="${D.H - MARG.b + 13}" font-size="9.5" fill="${t.tinta2}" text-anchor="middle">${u.eje(v)}</text>`;
  }
  h += `<text x="${(x0 + x1) / 2}" y="${D.H - 2}" font-size="10" fill="${t.tinta}" text-anchor="middle">${c.etiqueta}</text>
        <text x="${x0 + 3}" y="${MARG.t + 9}" font-size="9" fill="${t.tinta2}">↑ más llamadas por carpeta</text>
        <text x="${x0 + 3}" y="${D.H - MARG.b - 4}" font-size="9" fill="${t.tinta2}">↓ más carpetas</text>`;
  // El anclaje de la recta es visible a propósito: pasa por (media, 0), y eso
  // es forma, no estimación (meta.h2.recta_app).
  h += `<line x1="${D.X(est.media)}" x2="${D.X(est.media)}" y1="${MARG.t}" y2="${D.H - MARG.b}"
          stroke="${t.tinta2}" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.8"/>
        <text x="${D.X(est.media) + 3}" y="${D.H - MARG.b - 4}" font-size="9" fill="${t.tinta2}">media</text>`;

  // La recta: la pendiente es β de 16_ puesta en unidades de la covariable con
  // la media y la DE con que el 3.1 estandarizó. No se ajusta nada aquí.
  const recta = (x) => c.beta * (x - est.media) / est.de;
  const xa = D.X.domain()[0], xb = D.X.domain()[1];
  D.gRecta.html(
    `<line x1="${D.X(xa)}" y1="${D.Y(recta(xa))}" x2="${D.X(xb)}" y2="${D.Y(recta(xb))}"
       stroke="${t.azul}" stroke-width="2.6" stroke-linecap="round"/>`);
  // El rótulo de la recta va en la capa sin recorte y con la altura acotada al
  // panel, para que no desaparezca si alguna vez la pendiente sale del eje.
  const yr = Math.min(Math.max(D.Y(recta(xb)) + (c.beta < 0 ? 14 : -7), MARG.t + 10), D.H - MARG.b - 5);
  h += `<text x="${x1 - 2}" y="${yr}" font-size="10" font-weight="700"
          fill="${t.azul}" text-anchor="end">${raz(c.razon_multiplicativa)} por DE</text>`;
  D.gEjes.html(h);

  resaltaPunto();

  // --- las dos frases, con las cifras de `meta` y las cuentas vivas ---------
  $('#disp-sub').innerHTML =
    '1 DE más (' + u.larga(est.de) + ') → brecha <b>' + raz(c.razon_multiplicativa) +
    '</b> · IC 95% ' + raz(c.ic95_razon[0]) + '–' + raz(c.ic95_razon[1]) +
    ' · R² parcial ' + nf4(c.r2_parcial) + ' · <b>' + c.veredicto + '</b>';
  $('#disp-sub').title = c.veredicto + ': ' + c.motivo + ' · ' + meta.h2.especificacion;

  $('#disp-pie').innerHTML =
    '<b>' + num(C.dibujados) + '</b> AGEB dibujados' +
    (C.ocultos ? ' · ' + num(C.ocultos) + ' ocultos por el filtro' : '') +
    ' · ' + num(n.sin_covariable) + ' sin la covariable (INEGI la protegió)' +
    ' · ' + num(n.fuera_h2) + ' fuera de la estimación de H2' +
    (C.borde ? ' · ' + num(C.borde) + ' en el borde del eje, con punta' : '') +
    (estado.pincel
      ? ' · <b>' + num(C.pincelados) + '</b> en el pincel, resaltados en el mapa' +
        ' <button type="button" id="suelta">soltar <kbd>B</kbd></button>'
      : ' · arrastra para pincelar y resaltarlos en el mapa');
}

// El AGEB señalado, marcado en la nube. Vive aparte del dibujo de los puntos
// para que el hover no obligue a repintar los 2,286.
function resaltaPunto() {
  if (!D || !D.W) return;
  const t = meta.paleta.tokens;
  const busca = (clave) => (clave ? D.pts.find((p) => p.d.ageb === clave) : null);
  const ps = busca(estado.sel);
  const ph = estado.hover && estado.hover !== estado.sel ? busca(estado.hover) : null;

  let h = '';
  if (ph) h += `<circle cx="${ph.px}" cy="${ph.py}" r="4.6" fill="none" stroke="${t.tinta2}" stroke-width="1.4"/>`;
  if (ps) {
    h += `<line x1="${MARG.l}" x2="${ps.px}" y1="${ps.py}" y2="${ps.py}" stroke="${t.tinta}" stroke-width="0.8" stroke-dasharray="2 2"/>
          <line x1="${ps.px}" x2="${ps.px}" y1="${ps.py}" y2="${D.H - MARG.b}" stroke="${t.tinta}" stroke-width="0.8" stroke-dasharray="2 2"/>
          <circle cx="${ps.px}" cy="${ps.py}" r="5.4" fill="none" stroke="${t.fondo}" stroke-width="3"/>
          <circle cx="${ps.px}" cy="${ps.py}" r="5.4" fill="none" stroke="${t.tinta}" stroke-width="1.8"/>`;
  } else if (estado.sel && porClave.has(estado.sel)) {
    // Decirlo es parte del punto: el AGEB fijado puede no estar en la nube
    // —sin covariable, o escondido por el filtro— y callarlo haría buscar un
    // punto que no existe.
    h += `<text x="${D.W - MARG.r}" y="${MARG.t + 9}" font-size="9.5" fill="${t.tinta2}" text-anchor="end">el AGEB fijado no está en esta nube</text>`;
  }
  D.gMarcas.html(h);
}

// Un punto se encuentra por cercanía sobre las 2,286 marcas: a este tamaño el
// cursor cae a menos de 8 px de a lo más un puñado, y recorrerlas cuesta menos
// que mantener un índice que hay que rehacer en cada cambio de control.
function localizaPunto(px, py) {
  let mejor = null, dm = 64;                 // 8 px al cuadrado
  for (const p of D.pts) {
    const d2 = (p.px - px) ** 2 + (p.py - py) ** 2;
    if (d2 < dm) { dm = d2; mejor = p; }
  }
  return mejor;
}

function sobrePunto(ev) {
  const [px, py] = d3.pointer(ev, D.capa.node());
  const p = localizaPunto(px, py);
  const clave = p ? p.d.ageb : null;
  if (clave !== estado.hover) { estado.hover = clave; resalta(); }   // también marca el mapa
  if (!p) { D.tip.style.opacity = 0; return; }

  const c = coefDe(estado.cov), u = UNIDAD[estado.cov];
  D.tip.innerHTML =
    '<div class="t-clave">AGEB ' + p.d.ageb + ' · ' + p.d.alc + '</div>' +
    corto(c) + ': <b>' + u.larga(p.vx) + '</b><br>brecha ' + raz(Math.exp(p.m)) +
    ' contra el AGEB promedio' + (p.fuera ? ' · fuera del eje' : '');
  D.tip.style.opacity = 1;
  const caja = D.tip.getBoundingClientRect();
  const dx = Math.min(Math.max(2, px + 12), D.W - caja.width - 2);
  const dy = Math.min(Math.max(2, py - caja.height - 8), D.H - caja.height - 2);
  D.tip.style.transform = `translate(${dx}px,${dy}px)`;
}

function fueraPunto() {
  D.tip.style.opacity = 0;
  if (estado.hover) { estado.hover = null; resalta(); }
}

// Clic en la nube: fija el AGEB, igual que el clic en el mapa. El clic también
// suelta el pincel, porque d3-brush ya borró su rectángulo: dejar el estado
// puesto con el rectángulo borrado sería mentir sobre qué está seleccionado.
function clicPunto(ev) {
  const [px, py] = d3.pointer(ev, D.capa.node());
  const p = localizaPunto(px, py);
  if (!p) return;
  estado.sel = p.d.ageb;
  pintaDetalle(p.d);
  resalta();
}

function alPincel(ev) {
  if (!ev.selection) {
    if (estado.pincel) { estado.pincel = null; trasPincel(); }
    return;
  }
  const [[a, b], [c, e]] = ev.selection;
  estado.pincel = { x: [D.X.invert(a), D.X.invert(c)], y: [D.Y.invert(e), D.Y.invert(b)] };
  trasPincel();
}

// El pincel no mueve el universo del mapa ni la escala: solo resalta. Por eso
// recuenta y repinta, pero no toca la leyenda ni el contador de sensibilidad.
function trasPincel() {
  recuenta();
  dibujaDisp();
  repinta();
}

function sueltaPincel() {
  estado.pincel = null;
  D.gPincel.call(D.pincel.move, null);     // el 'end' que esto dispara ya no encuentra pincel
  trasPincel();
}

function ciclaCov() {
  const cs = meta.h2.coeficientes.map((c) => c.covariable);
  aplica('cov', cs[(cs.indexOf(estado.cov) + 1) % cs.length]);
}

// ================= §12 el acotamiento de la ENDIREH, dibujado (tarea 4.4)
// La única cifra de nivel que el caso puede dar no sale del mapa, y por eso no
// va en el mapa: va al pie, al lado de los límites, con su intervalo y su banda
// dibujados. Las cinco cifras salen de `meta.calibrador_endireh`, que el 4.1
// copió de `14_` con su assert.
function dibujaNivel() {
  const c = meta.calibrador_endireh, t = meta.paleta.tokens;
  // El eje va de 90% a 100%: la banda completa cabe con margen y el 100% deja
  // la referencia de "nadie denuncia" a la vista. Es forma, no dato.
  // El alto deja sitio al renglón de rótulos (su línea base cae en Y + 24) y el
  // eje arranca en 14 y no en 2 para que el "90%", que va centrado en el primer
  // corte, no quede cortado por la orilla izquierda del SVG.
  const W = 318, H = 58, Y = 30, DOM = [0.9, 1];
  const x = d3.scaleLinear().domain(DOM).range([14, W - 44]);

  $('#nivel-rot').textContent = 'El nivel lo acota la encuesta, no el mapa';
  $('#endireh').innerHTML = `
<svg width="${W}" height="${H}" font-family="inherit" role="img"
     aria-label="ENDIREH 2021: ${pct1(c.valor)} sin denuncia, IC 95% ${pct1(c.ic95[0])} a ${pct1(c.ic95[1])}">
  <line x1="${x(DOM[0])}" x2="${x(DOM[1])}" y1="${Y + 11}" y2="${Y + 11}" stroke="${t.gris}" stroke-width="1"/>
  ${DOM.concat(0.95).map((v) => `
  <line x1="${x(v)}" x2="${x(v)}" y1="${Y + 8}" y2="${Y + 14}" stroke="${t.gris}" stroke-width="1"/>
  <text x="${x(v)}" y="${Y + 24}" font-size="9.5" fill="${t.tinta2}" text-anchor="middle">${pct0(v)}</text>`).join('')}
  <rect x="${x(c.banda[0])}" y="${Y - 7}" width="${x(c.banda[1]) - x(c.banda[0])}" height="14"
        fill="${alfa(t.tinta, 0.1)}"/>
  <line x1="${x(c.ic95[0])}" x2="${x(c.ic95[1])}" y1="${Y}" y2="${Y}" stroke="${t.tinta}" stroke-width="2.6"/>
  ${[c.ic95[0], c.ic95[1]].map((v) => `
  <line x1="${x(v)}" x2="${x(v)}" y1="${Y - 4}" y2="${Y + 4}" stroke="${t.tinta}" stroke-width="1.5"/>`).join('')}
  <circle cx="${x(c.valor)}" cy="${Y}" r="4" fill="${t.rojo}" stroke="${t.fondo}" stroke-width="1.2"/>
  <text x="${x(c.valor)}" y="${Y - 11}" font-size="12.5" font-weight="700" fill="${t.tinta}" text-anchor="middle">${pct2(c.valor)}</text>
  <text x="${W - 40}" y="${Y - 7}" font-size="9.5" fill="${t.tinta2}">no se</text>
  <text x="${W - 40}" y="${Y + 4}" font-size="9.5" fill="${t.tinta2}">denuncia</text>
</svg>
<p style="margin:2px 0 0">IC 95% ${pct1(c.ic95[0])}–${pct1(c.ic95[1])} · ${num(c.numerador)} de ${num(c.n_muestral)} mujeres ·
   CV ${pct1(c.cv)}. La banda clara (${pct1(c.banda[0])}–${pct1(c.banda[1])}) es el rango según cómo se
   acote el periodo de la queja de pareja. ${c.descripcion}.</p>`;
}

})();
