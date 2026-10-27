# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Caso de titulación (ITAM, Ciencia de Datos Aplicada) sobre **subregistro delictivo en la CDMX**. No es una aplicación: es un repositorio de análisis exploratorio cuyo producto son tablas, gráficas y argumentos para defender un encuadre ante sinodales. El código existe para sustentar decisiones de alcance, no para producir un sistema.

**`CONTEXTO_CONVERSACION.md` es el documento maestro**: inventario de fuentes, hallazgos del EDA con cifras, retroalimentación de los sinodales (14 sep 2026), la propuesta de reencuadre vigente y los próximos pasos. Léelo antes de cualquier trabajo sustantivo y actualízalo cuando cambien hallazgos o alcance.

Todo el material escrito (notebook, reportes, comentarios de análisis) va **en español**.

## Rúbrica del caso (referencia obligatoria — `informacion-caso/Rúbrica.docx`)

El contexto lo entrega el profesor (`informacion-caso/Caso 2.docx`); **el problema lo define el alumno**. Toda decisión de alcance, análisis o redacción debe poder mapearse a una dimensión de esta rúbrica.

| # | Dimensión | Peso | Qué se evalúa |
|---|---|---|---|
| D1 | Definición del problema | 15% | Pregunta original y valiosa, alcance delimitado, supuestos del planteamiento, contextualización vs. soluciones previas |
| D2 | Datos | 10% | Pertinencia y suficiencia, limpieza exhaustiva con supuestos, feature engineering relevante |
| D3 | Análisis exploratorio | 10% | **Hipótesis explícitas antes de modelar**; el EDA debe informar activamente las decisiones de modelado |
| D4 | Modelado y técnica | 20% | Técnica justificada para *este* problema; **supuestos verificados, no solo declarados**; validación rigurosa |
| D5 | Aplicación funcional | 15% | Obligatoria, demo en vivo, diseñada para este problema (no un template) |
| D6 | Presentación oral | 10% | Obligatoria; narrativa de problema y decisión, no de proceso técnico; defensa ante el jurado |
| D7 | Conclusiones y recomendaciones | 10% | Accionables y priorizadas, con viabilidad, implementación y trabajo futuro |
| D8 | Reporte escrito | 10% | Coherencia entre secciones, supuestos explicitados, formato IEEE |

Escala por dimensión: 4 = 100 (sobresaliente), 3 = 75, 2 = 50, 1 = 25. Calificación final: ≥ 90 sobresaliente · 75–89 satisfactorio · 70–74 suficiente · < 70 **no acredita**.

**Condiciones de piso** (incumplir cualquiera = No Acredita, sin importar el promedio ponderado): trabajo escrito entregado con sus cuatro secciones · D1 ≥ 2 · D4 ≥ 2 · D5 ≥ 2 (app operativa el día de la presentación) · D6 ≥ 2 (con demo en vivo).

**Criterios transversales** — su ausencia impide llegar a 4 en las dimensiones donde aplican:
1. **Supuestos explícitos** (D1–D4): no describir lo que se hizo, sino *por qué es válido en este contexto*. Formato: "Uso X asumiendo Y; si Y no se cumpliera, Z sería más apropiado."
2. **Creatividad pertinente** (D1, D4, D5): originalidad al servicio del problema. Un encuadre raro que no se puede responder con datos accesibles no puntúa; un enfoque simple bien argumentado sí.

**Entregables** (los tres son obligatorios; falta cualquiera ⇒ No Acredita):
1. **Trabajo escrito** — IEEE doble columna, 5–8 páginas sin referencias. Secciones en ese orden: Contexto · Definición del problema · Supuestos · Resultados y discusión · Conclusiones. No se califica con la rúbrica pero sin él no hay dictamen de suficiencia. Se entrega **una semana antes** de la presentación final.
2. **Aplicación funcional** — dashboard, app web, API o **notebook ejecutable autocontenido**, con repositorio público e instrucciones de instalación. Demo en vivo obligatoria.
3. **Presentación oral** — 15–20 min + 10 min de preguntas en la final. Slides a los sinodales **24 h antes**.

## Calendario

- ~~15 oct 2026 — revisión de avance ante sinodales~~ (Morales / Mejía / Román). **Hecha.** Se calificaron D1–D3 y el arranque de D4. Crítica de forma: la presentación **no tenía estructura** (sin hilo narrativo, sin estructura formal visible, demasiado método y poca conclusión). El contenido analítico quedó aceptado.
- **31 oct 2026 — entrega final y presentación.** 15–20 min + 10 min de preguntas, con los **tres entregables el mismo día**: trabajo escrito IEEE, aplicación funcional con demo en vivo y presentación oral. Queda abierto **H2** (D4), la app (D5), el escrito (D8) y el deck nuevo (D6).

Plan de trabajo vigente, regla pre-registrada de H2 y estructura del deck final: **`PLAN_31_OCT.md`**. `PLAN_15_OCT.md` queda como registro de la revisión de avance (alcance, hipótesis y supuestos S1–S7 siguen vigentes ahí, §3).

## Reglas de trabajo (aplican a toda tarea, aunque el prompt no las repita)

1. **Antes de empezar**, lee `CONTEXTO_CONVERSACION.md` y `PLAN_31_OCT.md` (y `PLAN_15_OCT.md` §3 para alcance y supuestos; al menos las secciones que el prompt cite). No re-derives cifras ni reabras decisiones que ya estén registradas ahí.
2. **Verificación ≠ análisis.** Si la tarea es verificar una fuente o un supuesto, trabaja con un script en el scratchpad: no crees notebooks ni CSV en `resultados/`. Los análisis que se quedan van en un `build_*.py` y exportan con la numeración continua, solo cuando la tarea lo pida.
3. **Redacción ≠ cálculo.** Si la tarea es redactar o decidir, no calcules. Toda cifra sale de datos ejecutados en la sesión o de `CONTEXTO_CONVERSACION.md`. Si falta una, márcala como **[verificar]**; nunca la inventes ni la redondees de memoria.
4. **Fuentes nuevas:** léelas con `dtype=str` y revisa codificación, fin de línea y BOM antes de confiar en ellas. Valida contra una cifra oficial publicada cuando exista. Anota las trampas en la tabla de "Lectura de las fuentes".
5. **Cifras de encuesta:** siempre ponderadas, con IC 95%, CV (sobre la tasa pequeña) y el **n muestral y el número de casos del numerador**.
6. **Al cerrar:** actualiza `CONTEXTO_CONVERSACION.md` (inventario §2, hallazgos §4, próximos pasos §8) y `PLAN_31_OCT.md` (estado de la tarea y riesgos). Termina con un resumen: veredicto o decisión, cifras clave con su incertidumbre, supuestos nuevos y qué cambia para la siguiente decisión del calendario.

## Comandos

```bash
uv sync                                        # instalar dependencias (Python 3.13 fijado en .python-version, .venv en la raíz)
uv run python notebooks/build_eda.py           # regenera notebooks/EDA_encuadre1.ipynb desde el .py
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA_encuadre1.ipynb
uv run python notebooks/build_eda2.py          # tarea 1.2 + experimentos 2.1, 2.3 y 2.6
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA2_equivalencias_911_fgj.ipynb
uv run python notebooks/build_eda3.py          # experimento 2.4: H3 y calibradores (~1 min al ejecutar)
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA3_validacion_calibracion.ipynb
uv run python notebooks/build_eda4.py          # H2: experimento 2.2 (covariables, 12_) y 3.1 (regresión espacial, 16_)
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA4_h2_covariables.ipynb

uv run python app/build_app_data.py            # tarea 4.1 (D5): resultados/ + shapefile → app/data/*.json
uv run python app/build_bundle.py              # tarea 4.2 (D5): los dos JSON → app/data/bundle.js (abrir con doble clic)
open app/index.html                            # la app; también sirve  python3 -m http.server  desde la raíz

typst compile --root . escrito/main.typ escrito/main.pdf   # tarea 5.1 (D8): el trabajo escrito IEEE
```

Todo se ejecuta desde la raíz. La ejecución completa de los notebooks tarda varios minutos (bootstrap de 1,000 réplicas + uniones espaciales sobre 2.1 M filas); `build_app_data.py` tarda ~1 min.

La app (D5) son cuatro piezas que **no** son notebook:

`app/index.html` + `app/app.js` son la interfaz (tareas 4.2, 4.3 y 4.4). Sin *build step* y **sin una sola petición de red**: D3 v7 va vendido en `app/vendor/d3.v7.9.0.min.js` y el TopoJSON se decodifica a mano (nada de `topojson-client`). **Aquí tampoco se calcula nada**: la escala, la leyenda, el encabezado, el pie de límites —cuyo cuarto límite, el nivel de la ENDIREH, va **dibujado** con su IC y su banda (§12) en vez de citado—, las etiquetas de los controles y las propias variables CSS de la paleta se construyen desde el bloque `meta` de `brecha.json`, así que **no se teclea ninguna cifra ni ningún color** — lo único escrito a mano es prosa, y los tintes semitransparentes salen del token con el helper `alfa()`. El estado de la vista vive en el objeto `estado` (`variante`, `vista`, `conteo`, `cov`, `pincel`, `sel`, `hover`); los controles del 4.3 (§9) y las pestañas y el pincel del 4.4 (§11) solo lo escriben y llaman `aplica()`, que recuenta y repinta todo lo que depende del estado. Ninguna función de dibujo lee la ventana, la variante de S1, el filtro de conteo ni el pincel de otro lado.

Lo único que el 4.3 agrega a esa regla es **contar** filas que ya traen su bandera (`sensible_s1`, `cambia_clasif_s1`, `universo.conteo_alto`): filtrar no es estimar. El 4.4 agrega una segunda operación del mismo tipo —**seleccionar** filas con un rectángulo sobre la dispersión— y nada más: la recta de H2 que esa dispersión dibuja es β de `16_` puesto en unidades de la covariable con la media y la DE que el 3.1 usó para estandarizar, las tres leídas de `meta.h2` (bloque `estandarizacion`, que el 4.1 verificó contra el notebook congelado). El candado es `verifica()` (§10), que al arrancar exige que las cuentas vivas reproduzcan **17** cifras congeladas de `meta` —las 8 del 4.3 más 3 por covariable del 4.4, incluida la de que un pincel abierto sobre todo el dominio seleccione exactamente a los dibujables— y lo grita en la consola si no. **Cualquier control nuevo cuenta o selecciona por ese camino, o no cuenta**: no se deriva una cifra en el navegador. El eje vertical de la dispersión es ±2.5 DE(m) leído de `meta.escala.var_m_observada`, fijo para los 18 estados; la regla y los dos intentos que fallaron están en `PLAN_31_OCT.md` §4.8.

Lo único que el navegador sí decide por su cuenta es **reparto de píxeles**, y el 4.5 lo dejó acotado (§4.9): el alto se reparte dando primero al cuerpo su mínimo legible (`--cuerpo-min`), comprimiendo la orilla en un solo escalón a `max-height:880px` y **haciendo scroll** cuando ni así cabe, en vez de recortar o encimar. La rampa de la leyenda (`RAMPA`, 196→96 px) y el lienzo de la nube (`DISP`, 234→120 px) se encogen dentro de esos rangos **sin tocar la tipografía** y sin mover ninguna escala: el dominio de la nube sigue siendo ±2.5 DE(m). `aplica()` vuelve a medir el mapa antes de dibujar la leyenda, porque `textoVivo()` puede cambiar el alto del encabezado. `app/README.md` es la instrucción de instalación que pide D5.

`app/build_bundle.py` es empaquetado, no análisis: concatena el texto de los dos JSON **sin reserializarlos** dentro de `window.__DATOS__` y verifica byte a byte que los bloques embebidos son sus orígenes. Existe porque los navegadores bloquean `fetch()` sobre `file://` y el criterio de operatividad de D5 es que `index.html` abra con doble clic. Hay que **volver a correrlo cada vez que cambien los JSON**; `app.js` cae a `fetch()` si el paquete no existe, así que servir la carpeta por HTTP también funciona.

**Para verificar la app hay dos arneses, y los dos viven en el scratchpad.** El del **comportamiento** es `jsdom` en el scratchpad que ejecuta `app.js` con un `<canvas>` que graba los polígonos en vez de pintarlos: deja comprobar que el arranque no lanza errores, rasterizar la geometría y los colores que el mapa pintaría, disparar hover/clic sobre AGEB elegidos por su fila en `brecha.json`, y —desde el 4.3— recorrer los 18 estados de los controles comparando lo pintado contra cifras calculadas por fuera de la app. Desde el 4.4 también cubre la dispersión: cuenta las marcas que su `<canvas>` pintó, **reconstruye la recta de H2 desde el SVG** para exigir que pase por (media, brecha ×1.00) al píxel, dispara el pincel en los dos sentidos y revisa que ninguna cifra publicada del caso esté escrita a mano en `app.js` ni en `index.html` (156 comprobaciones, 0 fallas el 25 de oct). Dos trampas del arnés mismo: `Intl.NumberFormat('es-MX')` usa **punto** decimal, y d3-brush deja puesto un bloqueador del clic que sigue a un arrastre y lo quita en el *tick* siguiente, así que hay que ceder el bucle de eventos entre un arrastre y el clic que venga después. `jsdom` no se versiona: se instala en el scratchpad con `npm install jsdom` cuando hace falta. **Lo que `jsdom` no hace es *layout***, y para eso está el segundo arnés, el del **reparto** (4.5): **Brave sí corre headless en esta máquina** —la nota anterior de que no, era falsa—, con `--headless=new --virtual-time-budget=8000 --window-size=W,H --dump-dom` y `--screenshot`. Tres trampas: con `--user-data-dir` fuera del *home* el proceso **se cuelga**; **sin `--virtual-time-budget`, `--dump-dom` nunca termina**; y Brave **no lee `file://` bajo `/private/tmp`**, así que la carpeta se sirve por HTTP, y como en macOS la ventana mínima mide 500 px de ancho, el ancho de teléfono se mide dentro de un `<iframe>` de 390. Un script de medición inyectado **antes** de `app.js` —si va después, `verifica()` ya corrió cuando se sustituye `console.*`— escribe las cajas de cada sección en el DOM, y el arnés exige que la leyenda y la nube no se salgan de la suya, que no haya scroll horizontal y que `verifica()` reporte sus 17 cuentas (72 combinaciones de estado × tamaño, 0 fallas el 26 de oct). **Lo que ningún arnés cubre es el juicio tipográfico**: eso se ve abriendo `app/index.html`.

`app/build_app_data.py` es el pipeline de datos (tarea 4.1). Lee `resultados/11_`, `12_`, `13_`, `16_` y `14_` más el shapefile de AGEB, y **no calcula nada** —no corre especificaciones ni re-deriva la brecha, los conteos o las clasificaciones—: reorganiza en JSON y simplifica geometría, con un `assert` por agregado contra la tabla de origen. La única excepción la abrió el 4.4: **recupera de `12_` la media y la DE con que el 3.1 estandarizó** las covariables, porque sin ellas la app no puede dibujar β en unidades de la covariable sin derivarlas en el navegador; van con `esperado()` contra las cifras que el notebook del 3.1 imprimió en su sección 7, igual que todo lo demás. Produce exactamente `app/data/ageb.topo.json` y `app/data/brecha.json`, **nunca un CSV en `resultados/`**, y al cerrar verifica con MD5 que las 6 tablas y las 9 figuras congeladas el 18 de oct siguen byte a byte idénticas —con una sola excepción registrada en la tabla `CONGELADOS`: `3.2_coeficientes_h2.png` se regeneró el 27 de oct (R8) para que su glosa de unidades saliera de la estandarización del 3.1 en vez de estar tecleada, sin mover ningún coeficiente.

El escrito (D8) vive en `escrito/` y es la quinta pieza que **no** es notebook: `main.typ` (prosa y las dos tablas), `plantilla-ieee.typ` (copia local de `@preview/charged-ieee:0.1.4` con los rótulos en español, versionada para reconstruir el PDF sin red), `referencias.bib` y `main.pdf`. **`--root .` es obligatorio** porque las tres figuras se leen de `resultados/figuras/`, que está fuera de `escrito/`; las figuras **no se copian ni se regeneran**. Requiere `brew install typst` y las fuentes `font-tex-gyre-termes` y `font-tex-gyre-cursor`. **Aquí tampoco se calcula nada**: toda cifra sale de `CONTEXTO_CONVERSACION.md` §4 o de un CSV congelado, y si falta va como **[verificar]**. Las trampas de Typst que ya costaron una corrida (`=` y `1.` a principio de renglón, el espacio que deja `#sym.*`, la `ρ` en versalitas) están en `escrito/README.md`.

## Arquitectura

El flujo tiene una sola dirección:

```
notebooks/build_eda.py  →  notebooks/EDA_encuadre1.ipynb  →  resultados/*.csv
```

`build_eda.py` **no analiza nada**: arma el notebook celda por celda con dos helpers (`md()` / `code()`) sobre strings crudos y lo escribe con `nbformat`. Toda la lógica de análisis vive dentro de esos strings.

**Consecuencia obligatoria:** `EDA_encuadre1.ipynb` es un artefacto generado. Editarlo directamente se pierde en la siguiente regeneración — **todo cambio se hace en `build_eda.py`** y luego se regenera y re-ejecuta.

El notebook mantiene estado entre secciones (`fgj`, `ageb`, `alc`/`alc2`/`alc3`, `cmp`, `ag`, `tab_alc`, `covs`), así que las celdas no son independientes y el orden importa. La sección 10 exporta los ocho CSV (`01_`–`08_`) a `resultados/` a partir de esas variables; agregar una tabla implica agregarla ahí también.

`build_eda2.py` → `EDA2_equivalencias_911_fgj.ipynb` sigue el mismo patrón y exporta `09_` y `10_` (tabla de equivalencias 911 ↔ FGJ en la ventana común 2019 + jul-2021 → abr-2022). La sección 8 (experimento 2.1) exporta `11_ageb_brecha_por_delito.csv`; la 9 (experimento 2.3) `13_variacion_brecha_ageb_vs_alcaldia.csv`; la 10 (experimento 2.6) las figuras de `resultados/figuras/`.

`build_eda4.py` → `EDA4_h2_covariables.ipynb` es el cuarto script y soporta **H2**: el experimento 2.2 (covariables de RESAGEBURB, `12_`) en las secciones **1–6** y el 3.1 (regresión con errores espaciales, `16_`) en las **7–14**. Lee `11_`, `12_`, `13_` y `15_` y **no recalcula la brecha, los conteos ni las clasificaciones**; lo único que construye son los centroides de los AGEB, del shapefile proyectado a EPSG:6372. Las dos mitades están separadas a propósito: en las secciones 1–6 **no se mira ninguna asociación entre covariable y brecha**, porque la regla de decisión de H2 se fijó el 16 de oct (`PLAN_31_OCT.md` §3) antes de calcularla. Las **secciones 15–17** son el experimento **3.2**: las tres figuras de H2 (`3.2_coeficientes_h2.png`, `3.2_dispersion_parcial_escolaridad.png` y `3.2_mapa_residuos_h2.png`), que **no exportan CSV** y no estiman nada —leen `16_` y reutilizan `pan` y `ajusta()` de la sección 8—; la sección 16 verifica con MD5 que `12_`, `16_` y las seis figuras previas siguen byte a byte idénticas (🔒 congelamiento del 18 de oct). El 3.1 corre en ~9 s: el kernel de Bartlett es disperso y la varianza de Conley se arma agregando por AGEB (`Ω = A'KA`), lo que hace que las 1,000 réplicas del placebo cuesten segundos.

`build_eda3.py` → `EDA3_validacion_calibracion.ipynb` (experimento 2.4) es el tercer script, separado porque trae fuentes nuevas (ENDIREH, ENSU, ENVIPE) y no equivalencias 911 ↔ FGJ. **Lee `resultados/11_` y no recalcula la brecha, los grupos ni los conteos**; exporta `14_validacion_caso_calibracion.csv`. Los experimentos siguientes continúan la numeración en `15_` (`12_` quedó reservado para las covariables de RESAGEBURB del 2.2).

Estructura del notebook: 1 inventario · 2 ENVIPE (2.1 bootstrap Rao-Wu) · 3 FGJ · 4 covariables Censo AGEB · 5 ENSU · 6 911 (6.1 unión espacial a AGEB) · 7 fricción de joins · 8 evaluación del encuadre · 9 preguntas probables de sinodales · 10 exportación.

## Convenciones del análisis

- `ROOT` se resuelve buscando `carpetas-datos/`, así el notebook corre desde la raíz o desde `notebooks/`.
- **Todo join entre fuentes pasa por `norm_alc()`** (sin acentos, mayúsculas) con el diccionario `ALC_FIX` para "CUAJIMALPA DE MORELOS" y "LA MAGDALENA CONTRERAS". Los nombres de colonia **no** sirven para unir (38% de coincidencia entre 911 y FGJ); para grano fino se usa unión espacial a AGEB por coordenadas.
- Semilla fija `RNG = np.random.default_rng(2026)`; el bootstrap Rao-Wu remuestrea UPM dentro de estratos con reescalamiento de factores (un bootstrap simple daría intervalos falsamente estrechos).
- Los porcentajes en `resultados/*.csv` están en decimal (0.935 = 93.5%), redondeados a 4 cifras.
- Las estimaciones de encuesta siempre van ponderadas (`FAC_DEL` en ENVIPE, `FAC_SEL` en ENSU) y acompañadas de su incertidumbre (IC o CV). El CV se reporta sobre la **tasa de carpeta** (~6.5%), no sobre la cifra negra (~93%), porque esta última da un CV engañosamente pequeño.

## Lectura de las fuentes (trampas conocidas)

| Fuente | Cómo se lee | Trampa |
|---|---|---|
| ENVIPE 2025 | `pd.read_csv(..., dtype=str, lineterminator="\r")` | Fin de línea CR. Catálogos en `*/catalogos/<var>.csv`. Usar entidad/municipio de **ocurrencia** (`BP1_2C`, `BP1_3C`), no de residencia; `999` = no especificado. Cifra negra = `BP1_24 != 1`. |
| Carpetas FGJ | `pd.read_csv(..., engine="pyarrow", usecols=[...])` | 560 MB / 2.1 M filas (con `usecols` tarda <1 s). Usar `alcaldia_hecho`; `alcaldia_catalogo` está 99% vacía. 2025 solo trae enero. Quiebre COVID 2020–21. |
| ENSU | Abrir el `ensu_cb_*.csv` dentro del zip con `io.BytesIO`; filtrar `CVE_ENT == "09"` | `NOM_CD` es la alcaldía. En CDMX `BP1_8_1` (policía municipal) siempre es "no aplica": usar `BP1_8_2` (SSC). |
| Llamadas 911 | `engine="pyarrow"` + `pd.to_datetime(fecha_creacion)` antes de filtrar | Hay 2019 S1, 2019 S2, 2021 S2 y 2022 S1 (este último solo **ene–abr 2022**). **El C5 no publica nada después de abr-2022.** Todos los archivos traen registros fuera de su semestre: filtrar siempre por ventana. Delitos: `clas_con_f_alarma == "DELITO"`. |
| Censo 2020 AGEB | Descomprimir el zip a temporal y `gpd.read_file("total.shp")` | EPSG:4326, 2,433 AGEB; la clave AGEB es la columna `ageb`. Este shapefile **solo** trae migración, lengua indígena, afromexicanos, situación conyugal y religión: escolaridad y hacinamiento vienen de RESAGEBURB. 17 AGEB con población 0. **2 AGEB (`0901101101107`, `0901201351227`) no tienen polígono ni `alc`**: completar la alcaldía con la clave municipal (`ageb[2:5]`) y sacarlos de cualquier operación geométrica (no reciben eventos). |
| RESAGEBURB 2020 | CSV dentro de `AGEB/ageb_mza_urbana_09_cpv2020_csv.zip`, `dtype=str`, `encoding="utf-8-sig"` | Mezcla manzanas y totales: AGEB = `MZA == "000"` y `AGEB != "0000"` (2,433 renglones). Clave `ENTIDAD+MUN+LOC+AGEB` = `ageb` del shapefile (une 100%). `*` = dato protegido por confidencialidad, no cero (10–12 AGEB según la variable). `VIVPAR_HAB`: 12 AGEB con `*`, 20 con 0 y 56 con < 50 (tasas por vivienda absurdas). **`PDER_SS` es un conteo de personas, no un porcentaje**: hay que dividirlo entre `POBTOT` o la covariable termina siendo un proxy del tamaño del AGEB. **Escolaridad y hacinamiento son casi el mismo eje**: `GRAPROES` ↔ `PRO_OCUP_C` da r = −0.93 (VIF 7.5 y 7.8), así que no admiten lectura separada en una regresión conjunta. |
| ENDIREH 2021 | Microdatos `ENDIREH/bd_endireh_2021_csv.zip`: `pd.read_csv(io.BytesIO(...), dtype=str, encoding="latin-1")` + `.str.strip()`; unir tablas por `ID_PER` | Microdatos en latin-1, CRLF, sin BOM; datos abiertos en latin-1 con **solo CR** (`lineterminator="\r"`). Catálogos con CR **dentro** de las comillas (`"1\r"`). Diseño: `FAC_MUJ`/`EST_DIS`/`UPM_DIS`; INEGI no publica réplicas. Usar `TB_VD` (`VFAM`, `VPAR_12M`) para condición de violencia. Denuncia familia = `P11_6_2` (12 m); pareja = `P14_7_2` (toda la relación; `9` = no especificado; años `P14_15_*`, `8888` = no sabe). Solo mujeres 15+ y solo nivel entidad (CDMX: 3,267 mujeres, 3 estratos con 2–3 UPM). El PDF `889463905936` es de la ENCIG, no de la ENDIREH. |
| Víctimas FGJ | `carpetas-datos/victimasFGJ_{2020,2021}.csv`, `engine="pyarrow"` | Trae `sexo` y `edad` (14.6% faltante en violencia familiar), pero **no** folio de carpeta ni parentesco: cuenta víctimas, no carpetas, y no separa pareja de familia. Hay víctimas `MORAL` en violencia familiar (error de captura). |

AMIS solo publica a nivel entidad (verificado el 26 sep), así que no sirve a grano AGEB.

## Al reportar resultados

Los sinodales pidieron explícitamente lenguaje de **incertidumbre**: "aproximar/acotar el subregistro con indicadores indirectos", nunca "estimarlo". Con n = 16 alcaldías se necesita |ρ| ≥ 0.50 para p < 0.05 y no hay grados de libertad para más de 1–2 covariables; cualquier hallazgo a ese grano debe presentarse con esa cautela, junto con las diferencias de universo entre fuentes (ENVIPE excluye homicidio, narcomenudeo y delitos contra negocios; FGJ cuenta carpetas, no víctimas) y el riesgo de falacia ecológica al usar covariables de AGEB.

Cada afirmación analítica se acompaña de su supuesto en el formato del criterio transversal (*por qué es válido aquí*, no *qué se hizo*), porque sin eso ninguna dimensión puede llegar a 4.
