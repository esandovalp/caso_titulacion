# Explorador de la brecha — violencia familiar, CDMX

Aplicación funcional del caso de titulación (**D5** de la rúbrica). Es un mapa
de los 2,431 AGEB de la Ciudad de México con geometría, coloreados por la
**brecha** entre llamadas al 911 y carpetas de investigación de la FGJ por
violencia familiar, con los supuestos del análisis puestos como controles que
se mueven en vivo y una dispersión ligada que dibuja la recta de H2.

No es un visor genérico al que se le cargaron unos datos: cada control
corresponde a un supuesto declarado del caso, y moverlo enseña **cuánto
depende el mapa de ese supuesto**.

---

## Cómo abrirla

Hay dos caminos y los dos funcionan sin internet. El primero es el que se usa
en la demo.

**1. Doble clic** sobre `app/index.html`. No hace falta servidor, ni Python, ni
red: D3 va vendido en `app/vendor/` y los datos van empaquetados en
`app/data/bundle.js`, que es lo que deja que la página se abra con `file://`
(los navegadores bloquean `fetch()` sobre ese esquema).

**2. Servida por HTTP**, desde la raíz del repositorio:

```bash
python3 -m http.server 8000      # no necesita dependencias
# luego: http://localhost:8000/app/index.html
```

Servida así, `app.js` lee los dos JSON con `fetch()` y el paquete deja de hacer
falta. Es el camino útil cuando se está editando `app/data/`.

**Requisitos:** un navegador con soporte de `ResizeObserver` y `color-mix()`
—Chrome/Brave/Edge 111+, Firefox 113+, Safari 16.2+—. Nada más. Para
*regenerar* los datos sí hacen falta Python y las fuentes: ver abajo.

### Tamaño de ventana

La app reparte el alto en un orden explícito: el cuerpo —mapa y columna
lateral— se queda primero con su mínimo legible; el encabezado, los controles y
el pie se comprimen a su versión corta en pantallas bajas; y si aun así no
cabe, **la página hace scroll** en vez de recortar o encimar nada.

Medido en Brave 155 headless, DPR 1, en los 18 estados de los controles:

| Ventana | Scroll vertical |
|---|---|
| 1920 × 1080 · 1440 × 900 · 1280 × 800 · 998 × 859 | ninguno |
| 1024 × 768 | 62 px |
| 1280 × 720 | 78 px |
| 390 de ancho (teléfono) | la página entera hace scroll, sin desbordes a lo ancho |

A ninguno de esos tamaños se dibuja nada fuera de su caja. **Para un proyector
de 1024 × 768 o 1280 × 720, un <kbd>⌘</kbd><kbd>−</kbd> (o <kbd>Ctrl</kbd><kbd>−</kbd>)
deja la vista completa sin scroll.**

---

## Qué hay en pantalla

**El mapa.** Escala divergente centrada en la brecha del AGEB promedio, la
misma del deck y del escrito. Rueda para acercar, clic para fijar un AGEB,
<kbd>Esc</kbd> para soltarlo. El panel de la derecha dibuja el **IC 95%** de la
brecha del AGEB fijado, por ventana.

**Los controles de supuestos**, con atajos para la demo:

| Tecla | Control | Qué manipula |
|---|---|---|
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Ventana | las dos · ene–dic 2019 · jul 2021 – abr 2022 |
| <kbd>S</kbd> | Supuesto S1 | 0% o 19% de robo descontado |
| <kbd>C</kbd> | AGEB de conteo bajo | mostrar · hachurar · ocultar |
| <kbd>X</kbd> | Covariable de la dispersión | escolaridad · derechohabiencia · hacinamiento |
| <kbd>B</kbd> | Pincel | lo suelta |

**La dispersión ligada.** Brecha contra covariable, con la recta de H2 y pincel
en los dos sentidos: arrastrar sobre la nube resalta esos AGEB en el mapa, y
pasar el cursor por el mapa marca el punto. El eje vertical es fijo —±2.5·DE(m),
la misma regla de forma de la figura 2 del experimento 3.2— y **no se reajusta
al mover ningún control**: si se reajustara, una nube que se ensanchó al
descontar robo se vería igual de ancha y el control mentiría.

**El pie** dice lo que el mapa **no** dice: los tres límites que son argumentos
(S6, S5, tiempo) y, dibujado con su IC 95% y su banda, el acotamiento de nivel
de la ENDIREH.

---

## Regla: aquí no se calcula nada

Toda cifra en pantalla —la escala, los cortes, los conteos, el IC, la β de H2,
la paleta, el pie de límites— sale del bloque `meta` de `brecha.json`, que a su
vez se leyó de `resultados/`. En el navegador **no se estima nada**: las únicas
dos operaciones que la app hace sobre los datos son **contar** filas que ya
traen su bandera (`sensible_s1`, `cambia_clasif_s1`, `universo.conteo_alto`) y
**seleccionar** filas con el pincel. Filtrar no es estimar; seleccionar
tampoco.

El candado es `verifica()`, que al arrancar exige que las cuentas vivas
reproduzcan **17 cifras congeladas** de `meta` y lo grita en la consola si no.
Cualquier control nuevo cuenta o selecciona por ese camino, o no entra.

Lo único que la app sí decide en el navegador es **reparto de píxeles**: cuánto
mide la rampa de la leyenda y cuánto el lienzo de la nube, dentro de rangos
declarados en el código (`RAMPA`, `DISP`). La tipografía no se escala con
ellos, porque es lo que hay que leer proyectado.

---

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | la estructura y toda la hoja de estilo. Los colores se reescriben al cargar desde `meta.paleta.tokens`: lo que está en el CSS es el valor de primer pintado, no una segunda fuente de verdad |
| `app.js` | la aplicación entera, sin *build step* y sin una sola petición de red. El TopoJSON se decodifica a mano (sin `topojson-client`) |
| `vendor/d3.v7.9.0.min.js` | D3 v7.9.0, vendido en el repositorio para que la app abra sin internet |
| `data/ageb.topo.json` | geometría de los 2,431 AGEB, pre-proyectada a EPSG:6372 y simplificada a 5 m (0.570 MB) |
| `data/brecha.json` | la tabla por AGEB × ventana con las dos variantes de S1, más el bloque `meta` (2.596 MB) |
| `data/bundle.js` | los dos JSON envueltos en `window.__DATOS__` para poder abrir con `file://` (3.166 MB) |
| `build_app_data.py` | el pipeline: `resultados/` + shapefile → los dos JSON |
| `build_bundle.py` | empaquetado: los dos JSON → `bundle.js` |

---

## Regenerar los datos

Solo hace falta si cambia algo en `resultados/`. Desde la raíz del repositorio,
con el entorno instalado (`uv sync`) y el shapefile de AGEB colocado en
`AGEB/` como describe el `README.md` de la raíz:

```bash
uv run python app/build_app_data.py      # resultados/ + shapefile → app/data/*.json  (~1 min)
uv run python app/build_bundle.py        # los dos JSON → app/data/bundle.js
```

**Hay que volver a correr `build_bundle.py` cada vez que cambien los JSON**, o
el doble clic seguirá abriendo los datos viejos.

`build_app_data.py` no calcula nada: no corre especificaciones ni re-deriva la
brecha, los conteos ni las clasificaciones. Reorganiza en JSON y simplifica
geometría, con un `assert` por agregado contra la tabla de origen, y al cerrar
verifica con MD5 que las 6 tablas y las 9 figuras congeladas el 18 de octubre
siguen byte a byte idénticas (una excepción registrada: `3.2_coeficientes_h2.png`
se regeneró el 27 de octubre para corregir su glosa de unidades, sin que cambiara
ningún coeficiente, y su hash en la tabla `CONGELADOS` lleva el porqué anotado). `build_bundle.py` concatena el **texto** de los
dos JSON sin reserializarlos y comprueba byte a byte que los bloques embebidos
son sus orígenes.

---

## Verificar la app

Dos arneses, los dos fuera del repositorio (se arman en un directorio temporal
cuando hacen falta):

**Funcionamiento — `jsdom`.** Ejecuta `app.js` con un `<canvas>` que graba los
polígonos en vez de pintarlos. Cubre el arranque, la geometría y los colores
del mapa, el hover y el clic, los 18 estados de los controles contra cifras
calculadas por fuera de la app, la recta de H2 reconstruida desde el SVG y el
pincel en los dos sentidos. En el cierre del 4.4: 156 comprobaciones, 0 fallas.
Dos trampas del arnés: `Intl.NumberFormat('es-MX')` usa **punto** decimal, y
d3-brush deja puesto un bloqueador del clic que sigue a un arrastre y lo quita
en el *tick* siguiente, así que hay que ceder el bucle de eventos entre un
arrastre y el clic que venga después.

**Composición — Brave headless.** `jsdom` no hace *layout*, así que el reparto
del alto se mide en un navegador de verdad:

```bash
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  --headless=new --disable-gpu --no-sandbox --virtual-time-budget=8000 \
  --window-size=1024,849 --force-device-scale-factor=1 --hide-scrollbars \
  --screenshot=/tmp/app.png --dump-dom http://127.0.0.1:8000/app/index.html
```

Tres trampas que costaron una hora el 26 de octubre:

1. **Con `--user-data-dir` fuera del *home* el proceso se cuelga** sin dibujar
   nada. Hay que usar el perfil por omisión, y entonces las corridas tienen que
   ir **en serie**.
2. **Sin `--virtual-time-budget`, `--dump-dom` no termina nunca.**
3. Brave **no lee `file://` bajo `/private/tmp`**, de ahí que la página se
   sirva por HTTP; y en macOS **la ventana mínima es de 500 px de ancho**, así
   que el ancho de teléfono se mide dentro de un `<iframe>` de 390 px, que sí
   es un *viewport* propio para las *media queries*.

Un script de medición inyectado antes de `app.js` —antes, o `verifica()` ya
corrió cuando se cambia `console.*`— escribe en el DOM las cajas de cada
sección y el arnés revisa que la leyenda y la nube no se salgan de la suya, que
no haya scroll horizontal y que `verifica()` reporte sus 17 cuentas. En el
cierre del 4.5: **72 combinaciones** (18 estados × 4 tamaños de ventana), cero
desbordes y cero errores de consola.

Lo que ningún arnés cubre es el juicio tipográfico: eso se ve abriendo
`app/index.html`.

---

## Lo que esta app no dice

Lo mismo que advierte su pie, y conviene repetirlo aquí: la brecha **no es el
subregistro**. Mezcla la propensión a llamar al 911 con la propensión a
denunciar (S6), es una asociación territorial y no individual —nada de esto
dice algo sobre hogares (S5)—, y los datos son de 2019 y de jul 2021 – abr
2022, no del presente: el C5 no publica llamadas después de abril de 2022.
Multiplicar las carpetas de un AGEB por un factor derivado del 96.5% de la
ENDIREH sería inválido, por S2 y por S6.
