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

- **15 oct 2026 — revisión de avance ante sinodales** (Morales / Mejía / Román). 10 min de presentación + 5 min de preguntas. Se recuerdan problema, hipótesis y objetivos, y **se califican y revisan fuentes de datos, experimentos y resultados**: es decir, D1–D3 y el arranque de D4. Slides enviados el 14 de oct.
- **Presentación final** — fecha por confirmar; 15–20 min + 10 min de preguntas, con los tres entregables.

Plan de trabajo vigente y estructura del deck: **`PLAN_15_OCT.md`**.

## Reglas de trabajo (aplican a toda tarea, aunque el prompt no las repita)

1. **Antes de empezar**, lee `CONTEXTO_CONVERSACION.md` y `PLAN_15_OCT.md` (al menos las secciones que el prompt cite). No re-derives cifras ni reabras decisiones que ya estén registradas ahí.
2. **Verificación ≠ análisis.** Si la tarea es verificar una fuente o un supuesto, trabaja con un script en el scratchpad: no crees notebooks ni CSV en `resultados/`. Los análisis que se quedan van en un `build_*.py` y exportan con la numeración continua, solo cuando la tarea lo pida.
3. **Redacción ≠ cálculo.** Si la tarea es redactar o decidir, no calcules. Toda cifra sale de datos ejecutados en la sesión o de `CONTEXTO_CONVERSACION.md`. Si falta una, márcala como **[verificar]**; nunca la inventes ni la redondees de memoria.
4. **Fuentes nuevas:** léelas con `dtype=str` y revisa codificación, fin de línea y BOM antes de confiar en ellas. Valida contra una cifra oficial publicada cuando exista. Anota las trampas en la tabla de "Lectura de las fuentes".
5. **Cifras de encuesta:** siempre ponderadas, con IC 95%, CV (sobre la tasa pequeña) y el **n muestral y el número de casos del numerador**.
6. **Al cerrar:** actualiza `CONTEXTO_CONVERSACION.md` (inventario §2, hallazgos §4, próximos pasos §8) y `PLAN_15_OCT.md` (estado de la tarea y riesgos). Termina con un resumen: veredicto o decisión, cifras clave con su incertidumbre, supuestos nuevos y qué cambia para la siguiente decisión del calendario.

## Comandos

```bash
uv sync                                        # instalar dependencias (Python 3.13 fijado en .python-version, .venv en la raíz)
uv run python notebooks/build_eda.py           # regenera notebooks/EDA_encuadre1.ipynb desde el .py
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA_encuadre1.ipynb
uv run python notebooks/build_eda2.py          # tarea 1.2: equivalencias 911 ↔ FGJ (~25 s al ejecutar)
uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA2_equivalencias_911_fgj.ipynb
```

Ambos comandos se ejecutan desde la raíz. La ejecución completa tarda varios minutos (bootstrap de 1,000 réplicas + uniones espaciales sobre 2.1 M filas).

## Arquitectura

El flujo tiene una sola dirección:

```
notebooks/build_eda.py  →  notebooks/EDA_encuadre1.ipynb  →  resultados/*.csv
```

`build_eda.py` **no analiza nada**: arma el notebook celda por celda con dos helpers (`md()` / `code()`) sobre strings crudos y lo escribe con `nbformat`. Toda la lógica de análisis vive dentro de esos strings.

**Consecuencia obligatoria:** `EDA_encuadre1.ipynb` es un artefacto generado. Editarlo directamente se pierde en la siguiente regeneración — **todo cambio se hace en `build_eda.py`** y luego se regenera y re-ejecuta.

El notebook mantiene estado entre secciones (`fgj`, `ageb`, `alc`/`alc2`/`alc3`, `cmp`, `ag`, `tab_alc`, `covs`), así que las celdas no son independientes y el orden importa. La sección 10 exporta los ocho CSV (`01_`–`08_`) a `resultados/` a partir de esas variables; agregar una tabla implica agregarla ahí también.

`build_eda2.py` → `EDA2_equivalencias_911_fgj.ipynb` sigue el mismo patrón y exporta `09_` y `10_` (tabla de equivalencias 911 ↔ FGJ en la ventana común 2019 + jul-2021 → abr-2022). La sección 8 (experimento 2.1) exporta `11_ageb_brecha_por_delito.csv`. Los experimentos siguientes continúan la numeración en `12_`.

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
| RESAGEBURB 2020 | CSV dentro de `AGEB/ageb_mza_urbana_09_cpv2020_csv.zip`, `dtype=str`, `encoding="utf-8-sig"` | Mezcla manzanas y totales: AGEB = `MZA == "000"` y `AGEB != "0000"`. Clave `ENTIDAD+MUN+LOC+AGEB` = `ageb` del shapefile (une 100%). `*` = dato protegido por confidencialidad, no cero. `VIVPAR_HAB`: 12 AGEB con `*`, 20 con 0 y 56 con < 50 (tasas por vivienda absurdas). |
| ENDIREH 2021 | Microdatos `ENDIREH/bd_endireh_2021_csv.zip`: `pd.read_csv(io.BytesIO(...), dtype=str, encoding="latin-1")` + `.str.strip()`; unir tablas por `ID_PER` | Microdatos en latin-1, CRLF, sin BOM; datos abiertos en latin-1 con **solo CR** (`lineterminator="\r"`). Catálogos con CR **dentro** de las comillas (`"1\r"`). Diseño: `FAC_MUJ`/`EST_DIS`/`UPM_DIS`; INEGI no publica réplicas. Usar `TB_VD` (`VFAM`, `VPAR_12M`) para condición de violencia. Denuncia familia = `P11_6_2` (12 m); pareja = `P14_7_2` (toda la relación; `9` = no especificado; años `P14_15_*`, `8888` = no sabe). Solo mujeres 15+ y solo nivel entidad (CDMX: 3,267 mujeres, 3 estratos con 2–3 UPM). El PDF `889463905936` es de la ENCIG, no de la ENDIREH. |
| Víctimas FGJ | `carpetas-datos/victimasFGJ_{2020,2021}.csv`, `engine="pyarrow"` | Trae `sexo` y `edad` (14.6% faltante en violencia familiar), pero **no** folio de carpeta ni parentesco: cuenta víctimas, no carpetas, y no separa pareja de familia. Hay víctimas `MORAL` en violencia familiar (error de captura). |

AMIS solo publica a nivel entidad (verificado el 26 sep), así que no sirve a grano AGEB.

## Al reportar resultados

Los sinodales pidieron explícitamente lenguaje de **incertidumbre**: "aproximar/acotar el subregistro con indicadores indirectos", nunca "estimarlo". Con n = 16 alcaldías se necesita |ρ| ≥ 0.50 para p < 0.05 y no hay grados de libertad para más de 1–2 covariables; cualquier hallazgo a ese grano debe presentarse con esa cautela, junto con las diferencias de universo entre fuentes (ENVIPE excluye homicidio, narcomenudeo y delitos contra negocios; FGJ cuenta carpetas, no víctimas) y el riesgo de falacia ecológica al usar covariables de AGEB.

Cada afirmación analítica se acompaña de su supuesto en el formato del criterio transversal (*por qué es válido aquí*, no *qué se hizo*), porque sin eso ninguna dimensión puede llegar a 4.

## Entorno

Hay un hook **GateGuard** que, antes del primer comando Bash de cada turno, exige declarar la petición del usuario y qué produce el comando. Presenta esos dos hechos y reintenta el mismo comando.
