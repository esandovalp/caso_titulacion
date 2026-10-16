# Contexto para continuar — Caso 2: Inseguridad urbana CDMX (subregistro delictivo)

> Resumen de una conversación con Claude Code (14 sep 2026). Sirve para retomar el trabajo en otro chat.
> Proyecto: `/Users/emilianosandoval/Documents/code/caso-titulacion` · Titulación ITAM, Ciencia de Datos Aplicada.
> Sinodales: Morales / Mejía / Román.

---

## 1. Encuadre original (encuadre 1)

- **Pregunta:** ¿Cómo varía el subregistro delictivo estimado en la CDMX entre alcaldías, y qué factores sociodemográficos explican esa variación?
- **Hipótesis:** el subregistro no es homogéneo entre alcaldías y varía con variables sociodemográficas del AGEB (escolaridad, hacinamiento, proxies de confianza institucional).
- **Objetivo general:** estimador de riesgo delictivo ajustado por subregistro a nivel alcaldía (ENVIPE + carpetas FGJ + Censo 2020), validado con SESNSP.
- **Objetivos específicos:**
  1. Cuantificar el subregistro CDMX (93.2%, ENVIPE 2025) y evaluar si permite desagregación confiable por alcaldía.
  2. Identificar covariables AGEB predictoras de propensión a denunciar.
  3. Construir un factor de ajuste por alcaldía y aplicarlo a las carpetas FGJ.
  4. Validar contra SESNSP.
  5. (Extensión) Segmentar por sexo de la víctima.

Documentos en el proyecto: `Caso2 - Definicion de problema (prep reunion 14 sep)_1.pdf`, `informacion-caso/Caso 2.docx`, `informacion-caso/Rúbrica.docx` (pesos reales: D1 problema 15%, D2 datos 10%, D3 EDA 10%, D4 modelado 20%, D5 app 15%, D6 presentación 10%, D7 conclusiones 10%, D8 reporte 10%), `landscaping.pdf`, y dos PDFs de literatura (análisis geográfico por alcaldías; narcomenudeo por AGEB).

---

## 2. Datos descargados (inventario)

| Fuente | Ruta | Grano / periodo | Notas |
|---|---|---|---|
| Carpetas FGJ | `carpetas-datos/carpetasFGJ_acumulado_2025_01.csv` (560 MB) | Evento con colonia + lat/lon; **`fecha_inicio`** 2016-01 → 2025-01 | 2.1 M filas, 357 delitos / 18 categorías, 4.8% sin coordenadas, 1.2% sin alcaldía. 2025 solo enero. Quiebre COVID 2020–21. **La ventana 2016–2025 es de `fecha_inicio` (0% nulos), no de `fecha_hecho`**: esta última llega hasta 1906-06, con 32,598 filas (1.55%) anteriores a 2016 y 0.03% nulas (verificado el 8 oct). El análisis filtra por `fecha_hecho` a propósito (supuesto en `build_eda2.py:119`); la consecuencia es que los hechos de 2015 y antes solo aparecen si se denunciaron desde 2016, así que la ventana no se puede extender hacia atrás. |
| ENVIPE 2025 | `conjunto_de_datos_envipe_2025_csv/` | Delitos ocurridos en 2024; diseño muestral nacional | CSV con **fin de línea CR** (`lineterminator="\r"`). Tablas: tvivienda, thogar, tsdem, tper_vic1, tper_vic2, tmod_vic. |
| ENSU 2026 T1 y T2 | `ENSU/*.zip` | Persona; representativa por alcaldía (~265/alcaldía por trimestre) | Tabla `ensu_cb`. `NOM_CD` = alcaldía. |
| Llamadas 911 C5 | `911_llamadas_datos/llamadas_911_{2019_s1,2019_s2,2021_s2,2022_s1}.csv` | Evento con lat/lon (100% con coordenadas); 2019 completo + jul-2021 → abr-2022 = **22 meses** | **El portal solo publica hasta 2022 S1** (2022 S2–2024 dan 404; verificado 26 sep). Mismo esquema en los cuatro archivos. Los archivos traen registros fuera de su semestre (0.00–0.05% fuera de la ventana común); **ningún folio se repite entre archivos**. Filtrar por `fecha_creacion`. Delitos en ventana: 166k / 164k / 153k / 92k. 2020 y 2021 S1 no descargados a propósito (quiebre COVID). **Sin texto libre**: 18 campos, el motivo es la única clasificación. **`codigo_cierre` cambia de codificación**: 2019 = Afirmativo/Negativo/Duplicado (30%)/Falso/Informativo; 2021–22 = solo "A"/"Otros" → solo "afirmativo" es comparable. Guía del usuario (catálogo de 311 motivos) en `911_llamadas_datos/c2529c33…pdf`. |
| Censo 2020 AGEB | `AGEB/593c…zip` (shapefile) + diccionario `.xlsx` | 2,433 AGEB urbanos, EPSG:4326 | **Solo** migración, lengua indígena, afromexicanos, situación conyugal y religión. **No** tiene escolaridad ni hacinamiento. La clave AGEB está en la columna `ageb` (13 dígitos), no en `CVEGEO`. |
| RESAGEBURB 2020 | `AGEB/ageb_mza_urbana_09_cpv2020_csv.zip` | Manzana + totales por AGEB; 68,941 filas × 230 columnas | Leer con `encoding="utf-8-sig"` (BOM). Totales AGEB: `MZA == "000"` y `AGEB != "0000"` → 2,433 filas. Clave = `ENTIDAD+MUN+LOC+AGEB`; **une 100%** con `ageb` del shapefile. Trae `GRAPROES`, `PRO_OCUP_C`, `VPH_1CUART`, `PDER_SS`, `VIVPAR_HAB`. `*` = dato protegido por confidencialidad: 10–12 AGEB en casi todas las variables, 173 en `VPH_1CUART`. |
| ENDIREH 2021 | `ENDIREH/bd_endireh_2021_csv.zip` (microdatos, 28 tablas) + `conjunto_de_datos_endireh_2021_csv.zip` (datos abiertos con diccionarios y catálogos) + cuestionarios general/A/B/C, `endireh2021_fd.pdf` (estructura de la BD), diseño muestral, marco conceptual, informe operativo e `IPE_CV-EE-IC_ENDIREH_2021.xlsx` (precisión oficial) | Mujer elegida de 15+ (una por vivienda); 110,127 mujeres nacional, **3,267 en CDMX** (8 estratos, 863 UPM). Representativa por **entidad**, no por alcaldía. Levantamiento 4 oct – 30 nov 2021; ámbito familiar = "de octubre de 2020 a la fecha" | Descargada el 26 sep. **Microdatos en latin-1 con CRLF y sin BOM**; datos abiertos en latin-1 con **solo CR** (`lineterminator="\r"`, como ENVIPE). En los catálogos la clave trae un CR **dentro** de las comillas (`"1\r"`): hacer `.str.strip()`. Clave de unión entre tablas = `ID_PER` (única en todas). Diseño: `FAC_MUJ`, `EST_DIS`, `UPM_DIS`. INEGI **no publica réplicas** (usa conglomerados últimos + Taylor). `TB_VD` trae las condiciones de violencia ya construidas por INEGI (`VFAM`, `VPAR_12M`…). En `P14_7_2`, `9` = no especificado; en los años `P14_15_*`, `8888` = no sabe. El PDF `889463905936` que aparece en buscadores como "diseño muestral 2021" es de la **ENCIG**, no de la ENDIREH (el correcto es `889463907183`). |
| Víctimas FGJ | `carpetas-datos/victimasFGJ_{2020,2021}.csv` (58 y 64 MB) | Víctima (una fila por víctima y carpeta), con `sexo`, `edad`, `tipo_persona`, `calidad_juridica` y coordenadas | Descargado el 26 sep de datos.cdmx.gob.mx (hay archivos 2019–2024 y acumulado a 2024-09). **Sin folio de carpeta ni parentesco con el agresor**: no permite separar pareja de familia. En violencia familiar, `edad` falta en 14.6% y hay víctimas `MORAL` (3,073 en 2020, 73 en 2021; error de captura). |
| AMIS | — (PDF mensuales en centroestadisticoamis.mx) | Entidad + top-15 municipios nacional | **Solo sirve a nivel entidad.** De CDMX solo Gustavo A. Madero aparece en el top-15. Sin colonia ni coordenadas; sin base de datos. |
| SESNSP | — | — | **No descargado.** |

Variables clave:
- **ENVIPE `tmod_vic`:** `BP1_2C` entidad de ocurrencia (09 = CDMX), `BP1_3C` municipio de ocurrencia (999 = no especificado), `BP1_20`/`BP1_21` denuncia, `BP1_24` inicio de carpeta (1 = sí), `BP1_23` razón de no denuncia, `BPCOD` tipo de delito, `FAC_DEL` factor, `EST_DIS`/`UPM_DIS` diseño. El nombre del municipio sale de `tvivienda` (`CVE_MUN` → `NOM_MUN`).
- **ENSU:** `BP1_1` percepción de seguridad en la ciudad (2 = inseguro), `BP1_8_2` efectividad de la Policía Estatal/SSC (en CDMX `BP1_8_1`, policía municipal, siempre es "no aplica"), `BP3_2` efectividad del gobierno, `FAC_SEL`.

---

## 3. Lo que se construyó

- Ambiente **uv** en la raíz (`pyproject.toml`, `.venv`, Python 3.13): pandas, geopandas, scipy, statsmodels, seaborn, jupyter, nbconvert.
- `notebooks/build_eda.py` genera `notebooks/EDA_encuadre1.ipynb`, que se ejecuta con:
  ```
  uv run python notebooks/build_eda.py
  uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA_encuadre1.ipynb
  ```
- El notebook exporta tablas a `resultados/`:
  - `01_envipe_cifra_negra_por_alcaldia.csv`
  - `02_envipe_cifra_negra_por_tipo_delito.csv`
  - `03_envipe_razones_no_denuncia_cdmx.csv`
  - `04_alcaldias_fgj_envipe_ensu_censo.csv`
  - `05_911_vs_fgj_ene_abr_2022.csv`
  - `06_correlaciones_alcaldia.csv`
  - `07_ageb_carpetas_911_censo.csv`
  - `08_resumen_evaluacion_encuadre.csv`
- `notebooks/build_eda2.py` genera `notebooks/EDA2_equivalencias_911_fgj.ipynb` (tarea 1.2; corre en ~25 s) y exporta:
  - `09_equivalencias_911_fgj.csv` — 18 pares 911 ↔ FGJ con volúmenes por ventana, % afirmativo, % coordenadas, tendencia, parcial AGEB, perfil horario, `confianza_mapeo` y justificación
  - `10_serie_mensual_robo_vehiculo_911_fgj.csv` — serie mensual de códigos de robo y de vehículo del 911 frente a robo de vehículo y a conductor en FGJ
  - Los porcentajes están en decimal (0.935 = 93.5%).
- Sección 8 de `build_eda2.py` (experimento 2.1, 5 oct) exporta:
  - `11_ageb_brecha_por_delito.csv` — formato largo, una fila por delito × ventana × AGEB (2 × 2 × 2,433 = 9,732 filas). Llamadas (todas y afirmativas), carpetas, brecha con IC 95% exacto (razón de dos Poisson, Clopper-Pearson condicional), brecha de la ciudad y clasificación (alta / baja / indistinguible / sin carpetas), `conteo_bajo` (< 12 carpetas). En violencia familiar, además: viviendas (`VIVPAR_HAB`), banderas `viv_protegido`/`viv_cero`, tasas por 1,000 viviendas y banda S1 (`brecha_s1_19`, `clasificacion_s1_19`, `cambia_clasif_s1`). En robo a conductor, el grupo de H3 (`grupo_h3`) y la brecha por grupo con IC (`grupo_*`; `grupo_cumple_umbral`). Cobertura de coordenadas de la alcaldía en `cobertura_coord_alcaldia`. **El 2.4 debe leer la brecha por grupo de aquí**, con `drop_duplicates(["ventana", "grupo_h3"])`, y no recalcularla.
- Sección 10 de `build_eda2.py` (experimento 2.6, 9 oct; §10.5 agregada el 14 oct) **no exporta CSV**: produce cinco PNG en `resultados/figuras/`, con nombres estables y 200 dpi para proyector. Las dos del deck (§10.5):
  - `2.6_mapa_hero_violencia_familiar.png` — **la figura de la slide 6**. Un solo panel vertical con el ancho exacto de la ciudad y la leyenda en una franja propia a la derecha, así que ningún AGEB queda tapado. Sin hachurado ni círculos (esas marcas viven en la figura de 10.2, que pasó a respaldo).
  - `2.6_zoom_mosaico_1km.png` — acercamiento de 6 km, donde un AGEB mide ~80 px en vez de ~12. **Ventana elegida con regla fija que no mira el color:** de todas las ventanas de 6 km sobre una malla de 500 m, la que más AGEB de conteo alto contiene entre las que tocan al menos dos alcaldías; empates por la coordenada menor. Cayó en Iztacalco / Iztapalapa / Venustiano Carranza: 141 AGEB con centroide dentro (70 de conteo alto), 171 dibujados, 88 hachurados y 3 en gris.

  Y las tres de respaldo, a 16×9 (13×9 el tercero):
  - `2.6_mapa_brecha_violencia_familiar_ageb.png` — era la figura de la slide 7; desde el 14 de oct es respaldo (`r-mapa-marcado`). Dos paneles: violencia familiar por AGEB (2,294 coloreados) y robo a conductor por los 76 grupos de H3, con los límites de alcaldía encima.
  - `2.6_mapa_brecha_por_ventana.png` — respaldo: las dos ventanas por separado, con el ICC de alcaldía de cada una al pie.
  - `2.6_mapa_brecha_conteo_alto.png` — respaldo: solo los 698 AGEB con ≥ 12 carpetas en cada ventana.
  - **No recalcula nada:** lee `vf`, `rc` y `G` de la sección 8 (= `11_`) y `h1` de la sección 9 (= `13_`). La cantidad pintada es la que el 2.3 descompuso: `m = media de las dos ventanas de [ log((llamadas+0.5)/(carpetas+0.5)) − media de esa ventana ]`, con peso igual por AGEB. La escala es divergente en log con límites ±2σ_AGEB = ×1.89 / ×0.53 tomados de `13_`, no de los cuantiles observados. Se regeneran con los dos comandos de siempre (`build_eda2.py` y el `nbconvert`); no hay paso aparte.

- Sección 9 de `build_eda2.py` (experimento 2.3, 8 oct) exporta:
  - `13_variacion_brecha_ageb_vs_alcaldia.csv` — 16 filas, una por delito × variante × ventana. Componentes de varianza del **log de la brecha** con IC 95% bootstrap (`var_alcaldia`, `var_unidad`, `var_interaccion`), `icc_alcaldia`, `razon_unidad_alcaldia`, el estadístico observado de cada prueba con el percentil 95 de su nula y su p de permutación (`estadistico_a`/`p95_nula_a`/`p_perm_a` y los `_b`), `sobredispersion_pearson`, `n_unidades`, `n_llamadas`, `n_carpetas`, la bandera `interpretable` y los tres veredictos. **No recalcula la brecha**: lee `vf`, `rc` y `G` de la sección 8. La `unidad` es `AGEB` en las filas de H1 y `grupo_h3` en las cuatro filas de contraste.

- `notebooks/build_eda3.py` genera `notebooks/EDA3_validacion_calibracion.ipynb` (experimento 2.4, 10 oct; corre en ~1 min) y exporta:
  - `14_validacion_caso_calibracion.csv` — 12 filas, una por cifra reportable: `parte` ((a) H3, (b) concordancia ENSU, (c) calibrador ENDIREH, (d) cota ENVIPE), `descripcion`, `unidad`, `n_muestral`, `numerador`, `estimador`, `valor`, `ic95_inf`, `ic95_sup`, `p95_nula`, `p_perm`, `cv` y `lectura`. La fila de referencia de S4 (violencia familiar, ρ = 0.30) viene del 2.1 y está marcada como no recalculada.
  - **No recalcula la brecha, los grupos ni los conteos:** lee `resultados/11_` y agrupa por `["ventana", "grupo_h3"]` con `.first()`. Fuentes nuevas que entran aquí: ENDIREH 2021 (microdatos), ENSU 2026 y ENVIPE 2025. Se regenera con los dos comandos de siempre:
  ```
  uv run python notebooks/build_eda3.py
  uv run jupyter nbconvert --to notebook --execute --inplace notebooks/EDA3_validacion_calibracion.ipynb
  ```

---

## 4. Hallazgos del EDA

### ENVIPE por alcaldía (no se sostiene)
- Cifra negra CDMX = **93.5%** (IC 95%: 92.3–94.7%). INEGI publica 93.2%. Tasa de denuncia 9.5%.
- 3,907 delitos ocurridos en CDMX en la muestra; solo **288 con carpeta**. Mediana de **16 carpetas por alcaldía** (Magdalena Contreras 5, Milpa Alta 6, Xochimilco 7).
- **12 de 16 alcaldías con CV > 30%** en la tasa de carpeta (precisión baja según INEGI). Ancho mediano del IC ≈ **9 puntos porcentuales**.
- Rango aparente 84.9% (Milpa Alta) – 97.2% (Xochimilco), pero la heterogeneidad **no es significativa**: chi-cuadrada ingenua p = 0.048; corregida por efecto de diseño (≈2.6) **p = 0.84**.
- 8.4% de los delitos ocurridos en CDMX los reportan residentes de otra entidad; 90 registros sin alcaldía.
- La cifra negra varía más por **tipo de delito** que por alcaldía: robo total de vehículo 36%, acoso sexual 99.5%, robo en calle/transporte 94.8%, robo a casa 87.8%. No hay diferencia por sexo (H 93.6% vs M 93.3%).
- Razones de no denuncia: **71%** son atribuibles a la autoridad (pérdida de tiempo 40%, desconfianza 16%, trámites 12%).

### FGJ, ENSU, 911 (patrón centro–periferia)
| Relación (16 alcaldías, Spearman) | ρ | p |
|---|---|---|
| Tasa FGJ 2024 por 100k ↔ cifra negra ENVIPE | −0.61 | 0.012 |
| Tasa FGJ ↔ % se siente insegura (ENSU) | −0.65 | 0.007 |
| % insegura ↔ cifra negra | +0.67 | 0.005 |
| Desconfianza en la policía SSC ↔ cifra negra | −0.19 | 0.47 (sin relación) |
| Llamadas 911 por carpeta ↔ cifra negra | +0.61 | 0.013 |
| Llamadas 911 por carpeta ↔ % insegura | +0.74 | 0.001 |

- Centro (Benito Juárez, Cuauhtémoc, Miguel Hidalgo): más carpetas por habitante y menos cifra negra. Periferia (Iztapalapa, Xochimilco, GAM): más llamadas por carpeta y más percepción de inseguridad. Benito Juárez: 17% se siente insegura con la 2ª tasa FGJ más alta; Iztapalapa: 72% con la tasa más baja.
- Delitos ENVIPE expandidos / carpetas FGJ 2024: de 14× a 35× (mediana 21×).
- **Cautelas:** n = 16, comparaciones múltiples, universos distintos (ENVIPE excluye homicidio, narcomenudeo y negocios; FGJ cuenta carpetas), ENSU es 2026 y ENVIPE es 2024, correlación no es causa (población flotante).

### Viabilidad del nivel AGEB
- Unión espacial: **93.5%** de las carpetas 2024 y **99.8%** de las llamadas 911 caen en un AGEB.
- Mediana por AGEB: 65 carpetas/año y 32 llamadas de delito (4 meses). Población mediana por AGEB ≈ 3,400.
- Unir por nombre de colonia funciona mal: solo 38% de coincidencia entre 911 y FGJ.
- Problemas: 17 AGEB con población 0; AGEB comerciales con tasas por residente absurdas; autocorrelación espacial; falacia ecológica.

### Otros puntos
- **SESNSP** en CDMX lo reporta la misma FGJ, así que **no es validación independiente**.
- **RESAGEBURB** (Censo 2020, *Principales resultados por AGEB y manzana urbana*) sí tiene `GRAPROES` (escolaridad), `PRO_OCUP_C` y `VPH_1CUART` (hacinamiento), `PDER_SS` (derechohabiencia) y bienes de la vivienda. Descargado y verificado el 26 sep (ver inventario).

### Verificaciones del 26 sep
- **911 sin datos públicos después de abr-2022.** La ventana común 911 ↔ FGJ queda en 2019 + jul-2021 → abr-2022. Supuesto que hay que declarar: la distribución territorial de la brecha es estable entre 2019 y 2022; si no lo fuera, el indicador describiría ese periodo y no el presente. 2019 es el único año completo antes de COVID. Para la final se puede pedir 2023–2024 por transparencia (PNT; ≥ 20 días hábiles).
- **"Robo – Automovilista" en el 911 cae a la mitad:** 4,216 (2019 S1) → 2,092 (2021 S2) → 1,128 (ene–abr 2022). "Casa habitación" se mantiene estable (≈13–14k por semestre). Hay que revisar si fue un cambio de codificación del catálogo C5 o una caída real antes de usar ese canal como calibración.
- **AMIS solo a nivel entidad** → el caso de calibración de robo de vehículo se sostiene con ENVIPE (≈36%) como calibrador. *(Superado por la tabla de equivalencias: ver abajo.)*

### Verificaciones del 1 de oct
- **Cota ENVIPE de robo en calle y transporte (`BPCOD == "05"`, ocurrido en CDMX).** Script en línea sin archivos, con el mismo código del notebook (§2.1: Rao-Wu, semilla 2026, B = 1,000) más linealización de Taylor como contraste. Control: reproduce la cifra negra de la CDMX (93.47%, IC 92.27–94.71%).
  - Cifra negra: **94.8% (IC 95%: 92.1–97.3%)**. Tasa de carpeta 5.2%, con **CV 25.3% → precisión moderada** (Taylor: 25.9%, IC 92.2–97.4%).
  - n = **562** delitos en 416 UPM (900 mil expandidos), con **31** carpetas.
  - Lectura: la cota es estadísticamente usable, pero sigue sin poder falsar H3, porque su debilidad es de universo (no separa al conductor) y de unidad (delitos, no llamadas), no de precisión.

### Tabla de equivalencias 911 ↔ FGJ (tarea 1.2, 26 sep) — `notebooks/EDA2_equivalencias_911_fgj.ipynb`
Ventana común: 2019 (12 meses) + jul-2021 → abr-2022 (10 meses). 576k llamadas DELITO, 438k carpetas. Tres pruebas por par: correlación parcial por AGEB (controlando el total de carpetas y de llamadas), perfil horario y tendencia 2021–22/2019.
- **"Robo – Automovilista" = robo al conductor, no robo de vehículo.** Parcial AGEB con robo de vehículo particular c/v 0.02 y s/v −0.07; con *robo a pasajero/conductor c/v* **0.42**, horario 0.93 y tendencia 0.48× vs 0.47×. Es el único par con confianza **alta** (junto con Disparos ↔ arma de fuego, que no sirve para el caso). **El 911 no tiene canal de robo de vehículo.**
- **Su caída a la mitad es real**, no de catálogo: sin escalón dentro de 2019 (~750 → ~560 al mes, gradual) y la FGJ cae igual (robo de vehículo particular 0.45–0.49×, a conductor 0.47×). La mitad que falta se va en el hueco COVID.
- **El catálogo C5 sí cambia**: reestructuración el 2–3 sep 2019 (vehículo recuperado → "recuperado localizado", bienes gubernamentales → "(coladeras, cable)", lesionado por golpes → "por golpes-agresión"); "Robo – Otros" cae 79% en oct-2019; entre 2019 y 2021 "Lesionado – Por arma blanca" pasa de URGENCIAS MÉDICAS a DELITO, "Daños – Casa habitación" de DELITO a EMERGENCIA y aparece "Extorsión telefónica".
- **"Agresión – Casa habitación" ≈ violencia familiar, no robo.** El catálogo no tiene "Robo – Casa habitación" y no hay texto libre. Evidencia indirecta: sube 1.09× (violencia familiar FGJ 1.34×, robo a casa FGJ 0.49×); 45% entre 21 y 3 h y 45% en fin de semana (robo a casa FGJ: 18% y 31%); tasa por viviendas ρ = 0.47 con violencia familiar vs 0.12 con robo; parcial 0.42 vs 0.27; binomial negativo con coeficiente del robo **negativo** (−0.08). **Rango: 0–19% podría ser robo** (mezcla espacial 16%, IC 13–19%; mezcla temporal 0%). La razón llamadas/carpeta del robo a casa quedaría entre 0 y ~1.0 (vs 5.1 ingenua).
- **Robo a transeúnte tampoco tiene canal**: solo "Robo – Otros" (residual, parcial 0.07, escalón oct-2019).
- Pares nominales (amenazas ↔ amenazas, agresión a persona ↔ lesiones) fallan la prueba espacial.

**Matriz de decisión para la tarea 1.3** (ningún delito cumple los cuatro criterios):

| Delito | Canal 911 | ENVIPE | Denominador AGEB | Coord. FGJ |
|---|---|---|---|---|
| Robo de vehículo particular | ninguno | 36.1% (n=86) | débil | 96.5% |
| Robo a casa habitación | contaminado (≤19% robo) | 87.8% (n=138) | viviendas ✓ | 99.7% |
| Robo a transeúnte | "Robo – Otros", baja | 94.8% (calle y transporte) | débil | 98.6% |
| Robo a conductor c/v | "Automovilista", **alta** | no separable (dentro del 94.8%) | débil | 99.2% |
| Violencia familiar | "Agresión – Casa hab.", media | ENVIPE no la mide → **ENDIREH 2021: 95.7% no denuncia** (n=465, 24 denuncias, CV 22.6%) | viviendas ✓ | 97.6% |

### ENDIREH 2021 como calibrador de violencia familiar (26 sep) — **sirve**
Verificación con script en el scratchpad (sin notebook ni CSV numerado). El código reproduce las cifras publicadas por INEGI a tres decimales (violencia familiar 12 m nacional 11.386%; violencia total CDMX 12 m 46.138% y a lo largo de la vida 76.233%), y la condición `VFAM` de INEGI coincide 100% con la construcción propia desde `P11_1_1`–`P11_1_20`.
- **a. Diseño:** sí. Microdatos públicos con `FAC_MUJ`, `EST_DIS`, `UPM_DIS`. Bootstrap Rao-Wu (semilla 2026, B = 1,000) y linealización de Taylor coinciden (CV 22.6% vs 23.3%).
- **b. Pregunta de denuncia:** sí en los dos ámbitos, con periodos distintos.
  - *Familia* (excluye explícitamente a la pareja): `P11_6_2` "Usted o alguien de su familia, ¿presentó una queja o denunció lo ocurrido ante alguna autoridad?", sobre los actos de 11.1 "Durante el último año, de octubre de 2020 a la fecha". Detalle por autoridad en `P11_12_1`–`4` (policía, **Ministerio Público**, alcaldía, autoridad tradicional); apoyo institucional (Inmujeres, CAVI, CJM, DIF, salud…) en `P11_6_1`/`P11_7_*`; razones de no denuncia en `P11_16_*`.
  - *Pareja*: `P14_7_2` (misma redacción, "con su esposo…"), referida a **toda la relación**, sin periodo. Se puede acotar con `P14_15_*` (año de la última queja por autoridad); detalle por autoridad en `P14_14_1`–`4` (MP = `P14_14_4`).
- **c. CDMX, mujeres con violencia familiar en los últimos 12 meses:** prevalencia 14.9%; n = **465** mujeres (609 mil expandidas), **24** denunciaron. **No denuncia = 95.7% (IC 95%: 93.6–97.6%)**; CV de la tasa de denuncia (4.3%) = **22.6% → precisión moderada** según INEGI. Variantes: ante MP 96.9% (17 casos, CV 27.2%); autoridad o institución de apoyo 93.8% (34 casos, CV 20.0%). Nacional: 95.4% (n = 11,518; 609 denuncias). *Pareja* 12 m: 92.9% sin periodo en la denuncia (39/594, CV 17.9%); 98.3% si se exige que la última queja sea de 2020–21 (11 casos, CV 36%, baja). *Familia o pareja* 12 m: **96.5%** (96.55%; IC 95.1–97.8%; 34/873, CV 19.8%) — cifra definitiva en el 2.4, antes citada como 96.6% por redondeo.
- **d. Universo vs FGJ:** el archivo de carpetas no trae sexo; el de **víctimas** (`victimasFGJ_2021.csv`) sí. De 37,315 víctimas de "VIOLENCIA FAMILIAR" en 2021: 73.5% mujeres, 26.0% hombres; **mujeres de 15+ = 60.7% como mínimo y 70.2% como máximo** (14.6% sin edad), 3.3% niñas < 15, 18.0% hombres de 15+. Es decir, **30–39% de las víctimas FGJ queda fuera del universo ENDIREH**. Además la FGJ no distingue pareja de familia, y en la ENDIREH 37% de las mujeres con violencia familiar también reportan violencia de pareja en el año. Orden de magnitud: las mujeres que la ENDIREH implica que denunciaron violencia familiar o de pareja en 2020–21 (38 mil, IC 24–53 mil) quedan en el mismo rango que las víctimas FGJ mujeres de 15+ en 2021 (22.6–26.2 mil). No es validación: la ENDIREH cuenta mujeres y la FGJ, víctimas por carpeta.
- **Supuesto (d):** Uso la no denuncia de la ENDIREH (mujeres de 15+, familia o pareja) como calibrador del nivel de ciudad de la carpeta "VIOLENCIA FAMILIAR", asumiendo que la propensión a denunciar de hombres y menores de 15, que son 30–39% de las víctimas FGJ, no difiere mucho de la de las mujeres adultas. Si difiriera, la calibración se restringiría a las víctimas FGJ mujeres de 15+ (posible con el archivo de víctimas, que trae coordenadas pero no folio, así que cuenta víctimas y no carpetas) y se reportaría el resto como fuera de alcance.
- **Desfase temporal:** la ENDIREH mide oct-2020 → nov-2021, justo el hueco COVID de la ventana 911 (2019 + jul-2021 → abr-2022); solo jul–nov 2021 se traslapa. Es un supuesto de estabilidad adicional que hay que declarar.

### Experimento 2.1 — brecha por AGEB (5 oct) — `build_eda2.py` §8 → `resultados/11_`
- **Agregación de H3 fijada antes de correlacionar** (`PLAN_15_OCT.md` §3.1, 5 oct). Solo se vio la distribución de conteos de robo a conductor: 3,767 y 1,467 carpetas en AGEB; 48% y 65% de AGEB en cero; con ≥ 3 carpetas en ambas ventanas quedaban 100 AGEB y 25–29% de las carpetas. **Regla: grupos de AGEB contiguos dentro de la alcaldía con ≥ 12 carpetas en cada ventana**, porque con 12 el CV de Poisson del denominador es 28.9%, bajo la frontera de 30% de INEGI. Resultado: 77 grupos, **76 cumplen**, con 2,389 de 2,433 AGEB y ~100% de los eventos. Queda fuera Milpa Alta (42 AGEB). Cuajimalpa, Magdalena Contreras y Tláhuac quedan como un solo grupo. **H3 se probará con n = 76.** Todavía no se calcula ninguna ρ entre ventanas de robo a conductor.
- **Brecha de la ciudad (llamadas por carpeta, IC 95% exacto):** violencia familiar **1.00** en 2019 (0.98–1.02; 25,325 / 25,294) y **0.82** en 2021–22 (0.80–0.83; 22,937 / 28,022). Robo a conductor **2.14** (2.06–2.22; 8,050 / 3,767) y **2.19** (2.06–2.33; 3,214 / 1,467). La 0.88 de `09_` es la de las dos ventanas juntas, incluidas las carpetas sin AGEB.
- **Violencia familiar por AGEB:** el 86–89% de los AGEB con carpetas no se distingue de la ciudad con su IC. Se distinguen 325 en 2019 (160 altos, 165 bajos) y 271 en 2021–22 (138 y 133). Hay 1,570 y 1,425 AGEB con < 12 carpetas. **Robo a conductor a grano AGEB no es interpretable**: en 2021–22 los 2,433 AGEB tienen conteo bajo y solo 13 se distinguen de la ciudad.
- **S4 (estabilidad de violencia familiar): no se refuta.** Spearman entre ventanas **ρ = 0.30 (IC 95% 0.23–0.37; n = 698 AGEB con ≥ 12 carpetas en cada ventana)**. Percentil 95 de la nula: 0.065 (1,000 permutaciones, semilla 2026). **p = 0.001**, el mínimo posible. Sensibilidades: umbral ≥ 5, 0.22 (0.17–0.26; n = 1,624); solo afirmativas, 0.24 (0.17–0.31); 19% descontado, 0.26 (0.19–0.33). Es estable pero moderada: el orden se repite mejor que el azar, no AGEB por AGEB. El ruido de Poisson atenúa la ρ, así que es una cota inferior. Juntar las ventanas es defendible para el orden, no para el nivel.
- **S1 (banda 0–19% de robo):** el descuento de 19% parejo no cambia nada (escala todo por igual), así que se repartió donde está el robo a casa en la FGJ. El descuento efectivo queda en 17.7–17.9% por el tope por AGEB. **Cambian de clasificación 322 de 2,337 AGEB (13.8%) en 2019 y 337 de 2,358 (14.3%) en 2021–22; ninguno se invierte**: todos los cambios son entre una clase definida e "indistinguible". 1,832 de 2,433 AGEB son robustos en ambas ventanas. El orden se mantiene (Spearman 0.92 y 0.89). S1 no reordena el mapa, pero ~1 de cada 7 clasificaciones depende del supuesto.
- **S7 (coordenadas):** robo a conductor ≥ 96.6% en todas las alcaldías. Violencia familiar desigual: Cuauhtémoc 87.7% en 2021–22 (97.4% en 2019) y Milpa Alta 88.9% en 2019. Su brecha podría estar inflada hasta en 14%.
- **Denominador:** 20 AGEB con 0 viviendas, 12 con `*` y 56 con < 50 viviendas, donde las tasas por 1,000 se disparan (hasta 5,750 carpetas por 1,000). Las tasas de esos AGEB no se mapean.
- **Afirmativas como sensibilidad:** son 15% de las llamadas de violencia familiar en 2019 (3,711) y 24% en 2021–22 (5,554). Este cambio de proporción es justo por qué no se usan como numerador principal.

### Experimento 2.3 — H1: AGEB vs alcaldía (8 oct) — `build_eda2.py` §9 → `resultados/13_`
- **Regla de decisión fijada el 8 de oct en `PLAN_15_OCT.md` §3.3, antes de calcular cualquier componente de varianza** (modelo, universo, las dos pruebas con su nula, las tres sensibilidades y el contraste). Lo único que se usó para escribirla es lo ya registrado del 2.1.
- **Método:** la varianza cruda de la razón no sirve porque **el 68% de ella es ruido de conteo** (0.411 de 0.602). Se trabaja en el log de la brecha = logit de p = llamadas/(llamadas+carpetas), donde la varianza binomial es conocida, y se descompone **por momentos** en σ²_alcaldía, σ²_AGEB (dentro de la alcaldía) y σ²_AGEB×ventana, con efecto fijo de ventana. No se usó GLMM porque las nulas exigen ~48,000 reajustes y el efecto aleatorio de 2,400 niveles con 1–2 observaciones cada uno es donde menos sirven Laplace o variacional; con la varianza binomial conocida la corrección por momentos es exacta en esperanza (§3.3).
- **H1 se acepta.** Universo: **2,294 de 2,433 AGEB** (los que tienen ≥ 1 carpeta en cada ventana; 99.5% de las carpetas y 99.1% de las llamadas), con 47,828 llamadas y 53,050 carpetas.
  - σ²_alcaldía = **0.021** (IC 95% 0.016–0.030) · σ²_AGEB = **0.102** (0.072–0.127) · σ²_AGEB×ventana = **0.070** (0.039–0.101).
  - **ICC de alcaldía = 0.110 (IC 0.085–0.158)**: la alcaldía explica el 11%; el 89% es sub-alcaldía (53% entre AGEB, 36% AGEB×ventana).
  - **Razón σ²_AGEB / σ²_alcaldía = 4.82 (IC 95%: 2.81–6.44)**, enteramente por encima de 1 → **(b) se cumple**.
  - **(a)** σ̂²_AGEB = 0.102 contra el percentil 95 de la nula de homogeneidad = −0.012; **p = 0.001** (1,000 simulaciones binomiales, semilla 2026). La nula está centrada bajo cero porque la corrección de 0.5 del logit empírico hace que la resta del ruido quede un poco larga: por eso se compara contra la nula y no contra cero, y el estimador puntual es **conservador**.
  - **(b)**, contexto: el ICC observado también supera el percentil 95 de reasignar alcaldías al azar conservando su tamaño (0.010; p = 0.001). Las fronteras de alcaldía **no son irrelevantes**, son el **grano equivocado**.
  - En brecha relativa: 1 desviación estándar entre AGEB de la misma alcaldía = **×1.38**; entre alcaldías = ×1.16.
- **Robustez: 9 de 9 filas interpretables aceptan H1.** Por ventana: 2019 razón 16.6 (IC 7.7–25.0), ICC 0.057; 2021–22 razón 3.14 (1.74–4.32), ICC 0.241 — **el ICC de alcaldía casi se cuadruplica**, así que el cambio de nivel entre ventanas no fue parejo entre alcaldías (matiza S4: se repite el orden, no el nivel). Solo los 698 AGEB con ≥ 12 carpetas: razón 5.01 (2.10–7.32), ICC 0.099 → **no lo producen los AGEB de conteo bajo**. Con 19% descontado (S1): razón 3.10 (1.82–4.19), ICC 0.084, pero σ²_alcaldía sube a 0.044 y σ²_AGEB×ventana a 0.345, porque el robo que se descuenta es él mismo territorial y cambia entre ventanas.
- **Solo llamadas afirmativas: no concluyente, no contraria.** Con 1.6 (2019) y 2.4 (2021–22) afirmativas por AGEB y mediana 1, la corrección del ruido da varianza **negativa** (−0.14) y la fila se marca `interpretable = False`. La misma sensibilidad sí funciona en la prueba de rangos de 8.5 (ρ = 0.24), que no necesita corregir ruido.
- **Supuestos verificados, no solo declarados (D4):** sobredispersión de Pearson **2.02** (el doble de la binomial pura). Contraste **beta-binomial** por alcaldía × ventana: 32/32 celdas convergieron, ρ mediano 0.046, Var(logit) ponderada **0.196** contra **0.171** de los momentos para la misma cantidad → coinciden dentro del **14%** y los momentos son los conservadores. Por terciles de conteo el ICC es estable (0.133 / 0.092 / 0.104), aunque en el tercil bajo (mediana 4.5 carpetas) σ²_int sale negativo: ahí la corrección se pasa, y eso es justo lo que cubre la sensibilidad de ≥ 12. **Calibración en el diseño real** (200 réplicas, componentes inyectados conocidos): sin variación verdadera da −0.000 / −0.021 / −0.043 (insesgado en alcaldía, cota inferior en los otros dos); con la verdad igual a lo observado recupera la razón **4.64** contra 4.86; y **con la verdad invertida** (alcaldía 0.102, AGEB 0.021) recupera razón **0.200** contra 0.206, es decir **no inventa predominio del AGEB**.
- **Contraste con robo a conductor, en los 76 grupos de H3, por ventana:** ICC de alcaldía **0.354** (2019) y **0.512** (2021–22), razón 1.83 (IC 0.25–2.58) y 0.95 (0.00–1.27): (a) se cumple (p = 0.001 y 0.004) pero **(b) no se puede afirmar**. Débil por diseño, como se declaró antes de verlo: 76 unidades en 15 alcaldías y cuatro alcaldías con un solo grupo. Para comparar unidades del mismo tamaño se agregó también violencia familiar a esos 76 grupos (fila añadida **después** de ver los tamaños; **no entra en la regla de H1**): σ²_grupo cae de 0.102 a 0.044 y 0.038, o sea **se pierde ~60% de la variación sub-alcaldía**. **La señal vive por debajo del grano de los grupos de H3**, y por eso el mapa del 2.6 va a grano AGEB.
- **Lo que el 2.6 hereda:** grano AGEB (no grupos); pintar el **promedio de las dos ventanas**, porque σ²_int = 0.070 es del orden de σ²_AGEB = 0.102; colorear los 2,294 AGEB del universo, los 139 restantes en gris, hachurar los de `conteo_bajo` y marcar los 601 con `cambia_clasif_s1`; escala **divergente en log** centrada en la brecha de la ciudad de cada ventana, con ±1 desv. est. = ×1.38 / ×0.73 y ±2 = ×1.89 / ×0.53; y al pie, que la variación es sub-alcaldía (ICC 0.11), así que **no es un mapa de alcaldías**.

### Experimento 2.6 — el mapa de la brecha por AGEB (9 oct) — `build_eda2.py` §10 → `resultados/figuras/`
- **Producción de figura, no análisis nuevo.** No se recalculó la brecha, los conteos, los grupos ni los componentes de varianza: se leyeron de `11_` y `13_`. No se exportó ningún CSV.
- **Ampliación del 14 de oct (§10.5): dos figuras nuevas para el deck, mismo cálculo, misma escala, mismo universo.** La figura de dos paneles deja cada mapa en menos de media slide y los AGEB se vuelven indistinguibles en proyector. Se agregaron `2.6_mapa_hero_violencia_familiar.png` (un panel vertical; en la slide va a 1,090 px de ancho contra ~520 antes) y `2.6_zoom_mosaico_1km.png` (ventana de 6 km, AGEB de ~80 px, con hachurado y nombres de alcaldía). **La ventana del acercamiento se elige con una regla fija que no mira el color** (la de 6 km con más AGEB de conteo alto entre las que tocan ≥ 2 alcaldías, malla de 500 m, empates por coordenada menor): cayó en Iztacalco / Iztapalapa / Venustiano Carranza, con 141 AGEB dentro y 70 de conteo alto. Es lo que hace visible la escala de 1–2 km que midió el 2.5. **Verificación del congelamiento: al regenerar, los 14 CSV y las 4 figuras previas salieron byte a byte idénticos.**
- **Qué muestra el mapa, en una frase:** la fricción entre el aviso y la denuncia cambia de un AGEB al de al lado y no respeta las fronteras de alcaldía; cuando los conteos obligan a agregar (robo a conductor, 76 grupos), esa misma señal se vuelve un mapa de alcaldías.
- **Qué se pinta:** la misma cantidad que el 2.3 descompuso — la media de las dos ventanas del log de la brecha centrado por ventana, con peso igual por AGEB. **No** la razón de los conteos sumados, porque esa pondera por volumen y su varianza no es la que el ICC reparte. El centro de la escala es el **AGEB promedio de cada ventana**; la brecha de la ciudad, ponderada por volumen, queda **×1.13 por encima** de ese centro y va marcada con línea punteada en la barra de color.
- **Conteos del mapa, verificados contra `11_`:** **2,294 AGEB coloreados** (≥ 1 carpeta en cada ventana, 99.5% de las carpetas), **139 en gris**, **1,596 hachurados** (< 12 carpetas en alguna ventana) y **154 marcados con círculo** por `cambia_clasif_s1` entre los no hachurados; los otros **442** AGEB sensibles a S1 ya van hachurados, así que los 596 del universo llevan alguna marca. Fuera del mapa quedan los **2 AGEB sin polígono**; en el mapa de grupos, los **42 de Milpa Alta** van en gris porque su grupo no llega a 12 carpetas ni juntando la alcaldía.
- **Escala:** divergente azul ↔ rojo con punto medio gris (separación CVD ΔE 16.1 en el peor par adyacente), límites **±2σ_AGEB = ×1.89 / ×0.53** y marcas en ±1σ = ×1.38 / ×0.73, tomados de `13_`. Se fijan con σ del modelo y no con los cuantiles observados porque **el 57% de la dispersión visible de `m` es ruido de conteo**: Var(m) = 0.361, de la cual la varianza binomial esperada aporta 0.206 y σ²_AGEB solo 0.102 (el 28%). Con esa escala saturan **589 de 2,294 AGEB (26%)**, pero solo **99 de los 698 de conteo alto (14%)**, que es lo que predice quitar ruido.
- **El patrón está en las dos ventanas**, así que no lo produce una sola. Lo que no es parejo es el peso de la alcaldía: ICC 0.057 en 2019 y 0.241 en 2021–22 (riesgo ya registrado el 8 de oct). Va al pie del respaldo por ventana.
- **Contraste con robo a conductor:** mismo método, mismo recetario, mismo color; lo único distinto es el grano que permiten los conteos. El mapa de grupos sale liso y sus bloques se parecen a las alcaldías (ICC 0.354 y 0.512 contra 0.110), que es exactamente lo que el 2.3 midió. **Aquí no se correlacionan ventanas de robo a conductor:** eso es H3 y sigue siendo del 2.4.
- **Los tres límites al pie de la figura principal:** (1) la variación es sub-alcaldía (ICC 0.110; IC 0.085–0.158; 2,294 AGEB), así que no es un mapa de alcaldías; (2) el 57% de la dispersión visible es ruido de conteo, de ahí el hachurado y la escala por σ; (3) cobertura de coordenadas desigual (S7): Cuauhtémoc 87.7% en 2021–22 y Milpa Alta 88.9% en 2019 pueden tener su brecha inflada hasta 14%.
- **Lo que el mapa no dice:** cuánto subregistro hay. Ordena territorios (S6). El nivel de ciudad lo acota la ENDIREH (2.4).
- **Lo que dejó planteado para el 2.5 → resuelto el 11 oct:** a ojo el mapa tenía mosaico fino *y* zonas amplias del mismo color. El I de Moran lo separó: es **mosaico de barrio de 1–2 km** (I = 0.097, corregido 0.245; correlograma 0.224 a 0–1 km y ≈ 0 después). Ver "Experimento 2.5" abajo.

### Experimento 2.4 — H3 y calibrador (10 oct) — `build_eda3.py` → `resultados/14_`
- **Script nuevo porque trae fuentes nuevas** (ENDIREH, ENSU, ENVIPE) y no equivalencias 911 ↔ FGJ: `notebooks/build_eda3.py` → `EDA3_validacion_calibracion.ipynb` → `resultados/14_validacion_caso_calibracion.csv` (12 filas, una por cifra reportable con su incertidumbre y su lectura). **No recalcula la brecha, los grupos ni los conteos:** los lee de `11_`. Las cuatro partes son (a) H3, (b) concordancia ENSU, (c) calibrador ENDIREH, (d) cota ENVIPE.
- **(a) H3 se acepta: la brecha de robo a conductor es estable en el territorio.** Unidad: los 76 grupos de AGEB contiguos fijados el 5 de oct (`PLAN_15_OCT.md` §3.1), antes de calcular cualquier ρ. Prueba con el **mismo `estabilidad()`** que usó S4 en `build_eda2.py` §8.5, para que las dos ρ sean comparables.
  - **ρ = 0.46 (IC 95%: 0.27–0.63; n = 76 grupos)**, percentil 95 de la nula **0.179** (1,000 permutaciones de unidades, semilla 2026; el teórico para n = 76 es 0.190) y **p de permutación = 0.001**, el mínimo posible: ninguna permutación alcanzó la ρ observada.
  - **La potencia no fue el problema** (riesgo registrado en §7 del plan): la ρ queda 2.6× por encima del umbral y todo su IC 95% está arriba. No hay que invocar la lectura de "posible falta de potencia".
  - **Tabla de lectura conjunta del §3.1: el caso cae en la primera fila** (robo a conductor estable + violencia familiar estable, ρ = 0.30 del 2.1). Es decir: **la brecha lleva señal territorial reproducible y H1 es interpretable.** H3 aceptada **no** prueba que la brecha mida subregistro (S6 sigue en pie); prueba que no es ruido.
  - **Qué grano valida.** La estabilidad de robo a conductor es a grano de **grupo** (mediana 22 AGEB, 43.5 carpetas en 2019 y 17.5 en 2021–22), no de AGEB: con menos de dos carpetas por AGEB y ventana no se puede probar en este par. La de **AGEB** la da S4 en violencia familiar (ρ = 0.30, n = 698). El ruido de Poisson atenúa las dos ρ, así que ambas son **cotas inferiores**. Cobertura: los 76 grupos abarcan 2,389 de 2,433 AGEB y 99.9–100% de los eventos geolocalizados del par; las 15 alcaldías con grupo (Milpa Alta queda fuera).
  - La brecha de ciudad del par casi no se movió entre ventanas (2.14 → 2.19; mediana por grupo 2.14 → 2.18), y la prueba es de rangos, así que la caída de nivel de ambas fuentes (0.48× y 0.47×) no la afecta.
- **(b) La concordancia con la ENSU no concluye.** Brecha de robo a conductor agregada a alcaldía vs % que se siente inseguro (ENSU 2026 T1–T2, `BP1_1 == 2`, ponderado con `FAC_SEL`): **ρ = 0.10 (p = 0.71)** con las dos ventanas juntas; 0.13 en 2019 y 0.11 en 2021–22. El signo va en la dirección esperada, pero con n = 16 se necesita |ρ| ≥ 0.50 para p < 0.05. **Era previsible y así hay que decirlo:** la percepción de la ENSU es *inversa* a la tasa FGJ (ρ = −0.65, EDA 1) y la variación de la brecha es **sub-alcaldía** (ICC 0.110, del 2.3), así que agregar a 16 unidades destruye la señal. Además la periferia no tiene volumen a ese grano: Milpa Alta aporta **5 carpetas y 7 llamadas en total**, Magdalena Contreras 33 y Cuajimalpa 42. Benito Juárez combina brecha alta (2.29) con la percepción de inseguridad más baja de la ciudad (17%). Va a slides de respaldo, no al deck.
- **(c) Calibrador definitivo de ciudad: 96.5% de no denuncia (IC 95%: 95.1–97.8%).** Mujeres de 15+ en CDMX con violencia **familiar** (`VFAM`) **o de pareja** (`VPAR_12M`) en los últimos 12 meses: **34 denuncias de 873 mujeres** (1.10 M expandidas), CV de la tasa de denuncia (3.5%) = **19.8% → precisión moderada**. Denuncia = `P11_6_2 == 1` o `P14_7_2 == 1` con la última queja fechada en 2020–21 (`P14_15_1`–`P14_15_4`). Rao-Wu sobre `UPM_DIS` dentro de `EST_DIS` con `FAC_MUJ`, 1,000 réplicas, semilla 2026. Controles que reproduce: prevalencia nacional de violencia familiar 12 m **11.386%** (INEGI publica 11.4%) y violencia total 12 m en CDMX **46.138%** (46.1%).
  - **Redondeo:** el valor exacto es **96.55% → 96.5%**; el plan lo venía citando como 96.6%. Mismo número y mismo IC; se adopta 96.5%.
  - **La definición de periodo mueve el nivel más que el muestreo** (supuesto nuevo, refina S3): sin acotar la queja de pareja da **92.0%** (72 casos, CV 13.0%); solo con la queja de pareja de 2020–21, **98.3%** (11 casos, CV 36.1%, precisión **baja**); familia sola, 95.7% (24/465, CV 22.6%); pareja sin acotar, 92.9% (39/594, CV 17.9%). Banda **92.0–98.3% = 6.3 puntos** contra **2.7 puntos** de ancho del IC del principal. Se usa la variante acotada porque es la única que respeta el periodo de 12 meses de la pregunta de familia; las cuatro dicen lo mismo cualitativamente: más de nueve de cada diez no llegan a la autoridad.
  - Acota el **nivel de ciudad**, no el mapa (S2 y S3 mueven el 96.5%, no el orden de los AGEB). Puesto junto a la brecha de violencia familiar (1.00 y 0.82, es decir más carpetas que llamadas), es el argumento central: a nivel de ciudad la fricción es enorme y el 911 no la ve; la brecha solo **ordena territorios**.
- **(d) La cota de ENVIPE queda documentada y confirmada inútil para falsar.** `BPCOD == "05"` (robo o asalto en calle o transporte público), ocurrido en CDMX: cifra negra **94.8% (IC 95%: 92.1–97.3%)**, 31 carpetas de 562 delitos en 416 UPM, CV de la tasa de carpeta (5.2%) = **25.3% → moderada**. Control de la ciudad: **93.5% (IC 92.3–94.7%)** contra 93.2% publicado. La cota implica **19.2 delitos por carpeta** y la brecha observada es **2.15 llamadas por carpeta**: **9× de holgura**, así que ningún resultado plausible la contradice. El obstáculo es de universo y de unidad, no de precisión.
- **Lo que esto deja para el deck:** la slide 7 gana su respaldo de falsación (el patrón no es de una sola ventana ni es ruido en el par mejor mapeado); la slide 8 reporta S4 como **verificado en los dos delitos**, con las dos ρ y con el grano de cada una; la respuesta 11 del §6 ya tiene cifra; la respuesta 10 y la slide 4 citan 96.5% con su banda. Cifras congelables: ρ_H3 = 0.46 (0.27–0.63), p95 nula 0.179, p = 0.001, n = 76 · ENDIREH 96.5% (95.1–97.8), 34/873, CV 19.8% · ENVIPE 94.8% (92.1–97.3), 31/562, CV 25.3% · ENSU ρ = 0.10 (p = 0.71), n = 16.

### Experimento 2.5 — diagnóstico de AGEB e I de Moran (11 oct) — `build_eda2.py` §11 → `resultados/15_`
- **Regla fijada antes de calcular** en `PLAN_15_OCT.md` §3.4 (cantidad, vecindad, corrección por atenuación, dos nulas y los tres umbrales de lectura). **No recalcula la brecha ni los componentes de varianza:** lee `vf` y `rc` (= `11_`), `h1` (= `13_`) y `MAPA_V` de la sección 10, que es lo que pinta el mapa de la slide 7.
- **Qué separa.** H1 probó que la brecha varía más entre AGEB de la misma alcaldía que entre alcaldías, pero no si esa variación sub-alcaldía es mosaico de AGEB vecinos distintos o un gradiente suave. Eso es lo que el I de Moran separa, y es la duda que dejó el mapa el 9 de oct.
- **Veredicto: coexisten las dos estructuras, pegado al umbral del gradiente.** I de los **residuos dentro de alcaldía** (dos ventanas, 2,294 AGEB, contigüidad estandarizada por filas) = **0.097**, contra un p95 de **0.021** en la nula de permutación y **0.018** en la nula de homogeneidad del 2.3(a); **p = 0.001 en las dos** (z analítico 7.6). Superar la nula de homogeneidad es lo que importa: conserva el nivel de cada alcaldía *y* el ruido de conteo, así que hay parecido entre vecinos de la **misma** alcaldía que el azar no explica.
- **Atenuación, que es el punto metodológico.** El ruido de conteo es espacialmente independiente: entra al denominador del I y no al numerador, así que **el I observado es cota inferior**. Corregido (`I × Var(z)/(Var(z) − ruido binomial)`, con el ruido conocido del 2.3): **0.245** en el universo (factor 2.53×) y **0.180** en los 698 AGEB de conteo alto, donde el ruido es un tercio (0.066 contra 0.206) y el factor solo 1.51×. Que la corrección grande dé 0.245 y la chica 0.180 **acota cuánto puede estar inflando el supuesto**: las dos caen en la misma banda. Por ventana: 0.268 (2019, que cruzaría a "gradiente") y 0.239 (2021–22), con correcciones mayores (2.9× y 4.7×) y por eso menos confiables que la fila conjunta, que es la que decide.
- **La escala es de 1 a 2 km.** Correlograma por bandas de distancia entre centroides, I corregido: **0.224** (0–1 km), **0.081** (1–2 km), −0.010 (2–4), −0.018 (4–8), 0.001 (8–16). Lo que el ojo leía como zonas amplias es **mosaico de barrio**, un orden de magnitud por debajo de una alcaldía. El z de −3.9 en la banda 4–8 km no es un patrón: con 356 vecinos medianos, −0.018 sale "significativo" y es despreciable.
- **Qué cambia y qué no.** **H1 no se toca** (σ²_AGEB/σ²_alcaldía = 4.82 sigue en pie). Cambia la **frase de la slide 7**: de "cambia de un AGEB al de al lado" a "**cambia por zonas más chicas que la alcaldía y no respeta sus fronteras**". El AGEB es el grano que *permite ver* esas zonas, no la unidad en la que ocurre el fenómeno.
- **Límite nuevo y duro, para decir en voz alta.** Los **1,596 AGEB de conteo bajo no son intercambiables** con el resto: su `m` mediana es **+0.089 (×1.09)** contra **−0.010 (×0.99)**, Mann-Whitney **p = 5×10⁻⁶**, y están **agrupados** (I del indicador = 0.242; log(carpetas), 0.364). Parte es **mecánica**: las carpetas están en el denominador de la brecha, así que agrupar por "pocas carpetas" selecciona lo que empuja la razón hacia arriba. **No son la periferia:** la fracción de AGEB con conteo bajo va de **37% en Cuajimalpa y Magdalena Contreras a 82% en Benito Juárez** (céntrica, de ingreso alto). El respaldo 10.4 (solo los 698 de conteo alto) es la figura que responde esa objeción. La sensibilidad a S1 casi no se agrupa (I = 0.073), lo cual es **buena noticia para S1**: la contaminación con robo no está concentrada en una zona.
- **Conteos y denominador.** 1,570 (64.5%) y 1,425 (58.6%) AGEB con menos de 12 carpetas, que concentran solo 34.2% y 27.5% de las carpetas; mediana 9 por AGEB, p90 22–24. Denominador: 20 AGEB con viviendas 0 (15 en el universo del mapa), 12 con `*` (10) y 36 con 1–49 viviendas (19) = **0.9% de las carpetas**; los 2,365 con ≥ 50 viviendas, 99.1%. En los de < 50 viviendas la tasa llega a **7,250 carpetas por 1,000 viviendas** contra un p99 de **44**: son AGEB comerciales o institucionales y sus tasas no se mapean. La brecha no usa denominador, así que esto afecta a H2 (2.2) y a cualquier mapa de tasas, no al mapa del 2.6.
- **Lo que le exige al 2.2, si entra:** con autocorrelación a 1–2 km, una regresión que trate los AGEB como independientes daría errores estándar demasiado optimistas. Necesitaría error espacialmente correlacionado, efectos de vecindad o inferencia por bloques. Queda como requisito y como trabajo futuro.
- **Salidas:** `resultados/15_diagnostico_ageb.csv` (47 filas: 16 de autocorrelación, 15 de conteos bajos, 16 de denominador) y `resultados/figuras/2.5_diagnostico_ageb.png` (correlograma · distribución de conteos · dónde están los AGEB sin medición precisa). **Cifras congelables:** I = 0.097 (p = 0.001 en las dos nulas) · I corregido 0.245 (universo) y 0.180 (conteo alto) · correlograma 0.224 / 0.081 / ≈ 0 · conteo bajo `m` +9% con p = 5×10⁻⁶ e I = 0.242.

### Decisión de alcance (tarea 1.3, 1 oct) — **vigente**
Se adoptó la opción (a); detalle completo en `PLAN_15_OCT.md` §3, §3.1 y §3.2. No hubo cálculos nuevos: las cifras salen de este documento y de `resultados/02_` y `09_`.
- **Pregunta:** ¿Cómo se distribuye entre los AGEB de la CDMX la brecha entre las llamadas al 911 y las carpetas de la FGJ por violencia familiar, y qué características de la vivienda y del hogar se asocian con ella?
- **Aplicación = violencia familiar.** El par es 911 "Agresión – Casa habitación" ↔ FGJ "VIOLENCIA FAMILIAR", con confianza media y 0.88 llamadas por carpeta. El calibrador de ciudad es la ENDIREH 2021 con el combinado familia o pareja: 96.5% de no denuncia. El denominador son las viviendas habitadas.
- **Calibración = robo a conductor.** El par es "Robo – Automovilista" ↔ "Robo a pasajero/conductor c/v", con confianza alta y 2.13 llamadas por carpeta. ENVIPE solo da una cota: 94.8% en calle y transporte (IC 95%: 92.1–97.3%; 31 carpetas de 562 delitos; CV 25.3%, precisión moderada; verificado el 1 de oct).
- **Ninguno cumple los cuatro criterios** de la matriz. Se declara así.
- **H3 reformulada:** contra la cota de ENVIPE no es falsable, porque ningún resultado plausible de llamadas/carpeta la contradice. Pasa a ser una prueba de **estabilidad territorial** de la brecha de robo a conductor entre 2019 y 2021–22, contra una nula por permutación, con la agregación fijada antes de ver el resultado (hay menos de dos carpetas por AGEB por ventana). Como concordancia secundaria, se compara con el % inseguro de la ENSU por alcaldía.
- **Supuestos más frágiles**, es decir, los que mueven el mapa y no solo el nivel: S1, contaminación del canal (hasta 19% de robo); S4, estabilidad 2019 vs 2021–22; S6, la brecha mide la fricción entre el aviso y la denuncia, no el subregistro. S2 (universo) y S3 (desfase) mueven solo el 96.5%.

---

### Experimento 2.2 — covariables de RESAGEBURB para H2 (16 oct)

`notebooks/build_eda4.py` → `EDA4_h2_covariables.ipynb` → `resultados/12_ageb_covariables_resageburb.csv`. Lee `11_` y **no recalcula la brecha, ni los conteos, ni las clasificaciones**; tampoco mira ninguna asociación entre covariable y brecha (eso es el 3.1, con su regla ya fijada en `PLAN_31_OCT.md` §3).

- **Lectura de la fuente:** el renglón de AGEB es `MZA == "000"` con `AGEB != "0000"` → **2,433 renglones, 2,433 claves únicas**. La clave `ENTIDAD+MUN+LOC+AGEB` une **100%** con la columna `ageb` de `11_` (0 faltantes). El `*` se convirtió a NaN explícitamente, nunca a cero: 10 en `GRAPROES`, 11 en `PDER_SS`, 10 en `PRO_OCUP_C`, 12 en `VIVPAR_HAB`, 0 en `POBTOT`. No hay `N/D`.
- **Las covariables:** `GRAPROES` tal cual (media 11.60, DE 2.00) · `pct_der_ss` = `PDER_SS`/`POBTOT`, como **proporción** y no conteo, para que no sea un proxy del tamaño del AGEB (media 0.729, DE 0.075) · `PRO_OCUP_C` tal cual (media 0.811, DE 0.211).
- **Universo:** 2,294 AGEB con ≥ 1 carpeta en cada ventana (reproduce exactamente el de H1), de los cuales **2,250 quedan en el universo de estimación** (98.1%) con **99.10% de las carpetas** (52,572 de 53,050). Las 44 exclusiones de S5: 25 con viviendas 0, 10 con `*` en el denominador, 19 con 1–49 viviendas, 22 con covariable reservada; **ninguna categoría pasa de 0.51% de las carpetas**, así que las exclusiones no deciden el resultado. V1 (conteo alto) queda en **696** AGEB.
- **Hallazgo que importa — colinealidad severa.** `GRAPROES` y `PRO_OCUP_C` correlacionan **r = −0.93**, con VIF **7.54** y **7.82** (R² de 0.87 contra las otras dos). `pct_der_ss` sí se separa: VIF **1.61** (r = 0.59 con escolaridad y −0.61 con hacinamiento). En la CDMX **escolaridad y hacinamiento son un solo eje medido al revés**, así que H2 no tiene tres predicciones independientes sino **dos ejes**: carencia y derechohabiencia. Esto activó la cláusula que ya estaba escrita en `PLAN_31_OCT.md` §3.4 (fijada esa misma mañana, antes de calcular): **el veredicto se leerá sobre las tres regresiones de una sola covariable**, con la conjunta como referencia. No cambia ningún signo predicho ni reabre H2.

---

## 5. Conceptos explicados en la conversación (para el usuario)

- **Bootstrap:** remuestrear muchas veces (1,000) para ver cuánto cambia la estimación y sacar un intervalo de confianza.
- **Rao-Wu:** bootstrap para encuestas complejas. Remuestrea UPM (grupos de viviendas) dentro de estratos y reescala los factores. Un bootstrap simple daría intervalos demasiado estrechos.
- **CV:** error estándar ÷ estimación. INEGI: < 15% alta, 15–30% moderada, > 30% baja. Se calculó sobre la tasa de carpeta (~6.5%), no sobre la cifra negra (~93%), porque esta siempre da un CV engañosamente pequeño.
- **Valor p = 0.84:** si todas las alcaldías fueran iguales, veríamos diferencias así el 84% de las veces. No hay evidencia de diferencias (tampoco prueba que sean iguales: la muestra es insuficiente).
- **Efecto de diseño ≈2.6:** la muestra "vale" como una 2.6 veces menor por el agrupamiento de vecinos.
- **AGEB:** Área Geoestadística Básica de INEGI. Jerarquía: CDMX (1) → alcaldías (16) → AGEB (~2,400) → manzanas (~60k).
- **Por qué ENVIPE "calibra":** la brecha 911→carpeta solo ve lo que alguien reportó y da el *dónde* (distribución relativa por AGEB). ENVIPE da el *cuánto* total confiable (93.5% para la ciudad) y confirma la dirección por alcaldía.

---

## 6. Reunión del 14 sep: lo que se presentó y la retroalimentación

El usuario presentó solo la pregunta, que ENVIPE no se puede desagregar por alcaldía, y que el AGEB tiene datos demográficos y permite unir por coordenadas.

**Comentarios de los profesores:**
1. Ser claro en el reporte: no se puede saber con certeza la cifra de subreporte; ese es precisamente el problema principal.
2. Acotar los delitos: muchos (p. ej., robo de celular) no tienen llamadas al 911.
3. Buscar más fuentes, como aseguradoras, para tener información de delitos cometidos.
4. Definir bien los alcances e ir por etapas, sin querer cubrir todos los delitos. El enfoque es bueno, pero hay que considerar disponibilidad y desagregación de la información. Muchas alcaldías son muy grandes; las coordenadas dan más precisión.

**Verificación en datos (ene–abr 2022) del comentario 2:**
- 911: dominan "Agresión – Persona" (46,441) y "Denuncia – Persona sospechosa" (17,981). Pocos robos codificados como tales: "Robo – Automovilista" 1,128, "Robo – Otros" 1,216. "Agresión – Casa habitación" 9,043.
- FGJ mismo periodo: robo a transeúnte 3,520, robo de vehículo (sin autopartes) ≈2,738, casa habitación ≈1,227.

---

## 7. Propuesta tras la retroalimentación (borrador, no validada aún)

> **Superado el 1 de oct.** Esta propuesta usaba robo de vehículo como piloto, y ya no aplica: el 911 no tiene canal de robo de vehículo y AMIS solo publica a nivel entidad. El alcance vigente es violencia familiar + robo a conductor (§4, "Decisión de alcance", y `PLAN_15_OCT.md` §3). Se conserva solo como historia del encuadre.

**Lenguaje:** hablar de "aproximar/acotar el subregistro con indicadores indirectos e incertidumbre explícita", no de "estimarlo". Resultados relativos y rangos.

**Etapa 1, piloto: robo de vehículo.**
- Es el delito con más fuentes cruzables: FGJ (con coordenadas), **AMIS** (robo de vehículos asegurados), 911 ("robo a automovilista", por verificar equivalencia), ENVIPE (cifra negra ≈36%, 86 casos en CDMX) y posiblemente **REPUVE**.
- Limitación: su subregistro es bajo (el seguro obliga a denunciar). Sirve para validar el método.

**Etapa 2 (opcional):** un delito con subregistro alto. Opciones: robo a casa habitación (≈88% cifra negra) o robo a transeúnte (≈95%, pero con poca cobertura en el 911).

**Pregunta reformulada (borrador):**
> ¿Cómo se distribuye territorialmente, a nivel AGEB, la brecha entre fuentes de registro del robo de vehículo en la CDMX (fiscalía, aseguradoras y 911), y qué características sociodemográficas se asocian con esa brecha?

Opciones de encuadre discutidas antes de la reunión (referencia):
- **A:** mantener alcaldías juntando ENVIPE 2022–2025 o agrupando en zonas, con estimación de áreas pequeñas (Fay-Herriot).
- **B:** brecha 911 vs carpetas por AGEB con covariables del Censo; ENVIPE para calibrar. Base de la propuesta actual.
- **C:** paradoja percepción (ENSU) vs incidencia registrada (FGJ).

---

## 8. Próximos pasos pendientes

> **Plan vigente con fechas: `PLAN_31_OCT.md`** (escrito el 16 de oct). `PLAN_15_OCT.md` queda como registro de la revisión de avance; su §3 (alcance, H1–H3, supuestos S1–S7) sigue siendo la referencia y no se reabre.

**Revisión de avance del 15 de oct: hecha.** D1–D3 y el arranque de D4 quedaron calificados y el contenido analítico se aceptó. La crítica fue de forma: *la presentación no tenía estructura* — sin hilo narrativo, sin estructura formal visible y con demasiado método frente a poca conclusión. **Los tres entregables se entregan el 31 de oct** (escrito IEEE, app con demo en vivo, presentación de 15–20 min).

**Lo que queda abierto, en orden:** (a) **H2** — experimento 2.2 (`12_`, covariables de RESAGEBURB) y 3.1 (`16_`, regresión con errores espaciales tipo Conley a 2 km, cinco sensibilidades y placebo espacial); la **regla de decisión quedó fijada el 16 de oct, antes de calcular cualquier coeficiente**, en `PLAN_31_OCT.md` §3, y contempla los tres desenlaces (acepta / rechaza / no concluye) por covariable. (b) **App** (D5): explorador de la brecha y de sus supuestos en D3 + TopoJSON autocontenido, sin red ni API key. (c) **Escrito** IEEE de 5–8 páginas en Typst. (d) **Deck final** de 18 slides con cuatro secciones numeradas. Congelamiento de cifras: **19 de oct**.

1. ~~Investigar AMIS~~ → hecho el 26 sep: solo nivel entidad.
2. Revisar REPUVE u otras fuentes de robo de vehículo (baja prioridad: el robo de vehículo ya no tiene canal 911).
3. ~~Descargar RESAGEBURB 2020~~ → hecho y verificado el 26 sep.
4. ~~911 completo 2022–2024~~ → no existe públicamente; se descargaron 2019 S1/S2 y 2021 S2. ~~Tabla de equivalencias 911 ↔ FGJ~~ → hecha el 26 sep (§4, "Tabla de equivalencias").
5. ~~Rehacer un EDA corto enfocado en robo de vehículo~~ → hecho como tabla de equivalencias (`build_eda2.py`); el robo de vehículo no tiene canal 911.
6. Actualizar el documento de definición del problema con el nuevo alcance, supuestos e incertidumbre explícita.
7. ~~Decidir los dos delitos el 4 de oct~~ → **resuelto el 1 de oct** con la opción (a): aplicación = violencia familiar; calibración = robo a conductor (§4, "Decisión de alcance").
8. ~~Verificar ENDIREH 2021~~ → hecho el 26 sep: **sirve** (§4, "ENDIREH 2021 como calibrador"). No denuncia CDMX 95.7% (IC 93.6–97.6%, CV 22.6%). La recomendación del punto 7 queda en pie, con dos supuestos nuevos que hay que declarar: universo (30–39% de las víctimas FGJ no son mujeres de 15+) y desfase temporal (la ENDIREH cae en el hueco COVID del 911).
9. ~~Reescribir H3~~ → **resuelto el 1 de oct**: H3 = estabilidad territorial de la brecha de robo a conductor contra una nula por permutación (`PLAN_15_OCT.md` §3.1).
10. **Semana 2 (desde el 6 de oct):** experimentos 2.1, 2.3 y 2.6 en `build_eda2.py`, y 2.4 en un `build_eda3.py` nuevo que exporta `14_validacion_caso_calibracion.csv`. Antes de ver resultados, fijar en 2.1 la agregación espacial de robo a conductor. ~~Verificar IC y CV de la cota ENVIPE "calle y transporte"~~ → hecho el 1 de oct (§4, "Verificaciones del 1 de oct").
11. ~~Experimento 2.1~~ → **hecho el 5 oct** (§4, "Experimento 2.1"): `11_` exportado, regla de H3 fijada antes de correlacionar (76 grupos) y S4 estable (ρ = 0.30, p = 0.001). ~~2.3~~ → **hecho el 8 oct** (§4, "Experimento 2.3"): `13_` exportado, regla fijada en `PLAN_15_OCT.md` §3.3 antes de calcular, y **H1 se acepta** (razón σ²_AGEB/σ²_alcaldía = 4.82, IC 2.81–6.44; ICC de alcaldía 0.110; p = 0.001 en las dos nulas). ~~2.6~~ → **hecho el 9 oct** (§4, "Experimento 2.6"): tres PNG en `resultados/figuras/`, sin CSV nuevo; el mapa es la figura de la slide 7. ~~2.4~~ → **hecho el 10 oct** (§4, "Experimento 2.4"): `14_` exportado desde `build_eda3.py`, con la regla del 5 de oct intacta. **H3 se acepta**: ρ = 0.46 (IC 0.27–0.63) sobre los 76 grupos, p95 de la nula 0.179, p = 0.001 → el caso cae en la primera fila de la tabla de lectura conjunta y **H1 es interpretable**. Calibrador definitivo 96.5% (IC 95.1–97.8%; 34/873; CV 19.8%), con banda 92.0–98.3% según cómo se acote el periodo de la queja de pareja. Cota ENVIPE 94.8% documentada (9× de holgura, sigue sin falsar) y concordancia ENSU que **no concluye** (ρ = 0.10, p = 0.71). **Con esto se cierran los P1 de la semana 2.** ~~2.5~~ → **hecho el 11 oct** (§4, "Experimento 2.5"): `15_` exportado y figura `2.5_diagnostico_ageb.png`, con la regla fijada en `PLAN_15_OCT.md` §3.4 antes de calcular. **Coexisten las dos estructuras**, pegado al umbral del gradiente: I = 0.097 (p = 0.001 contra las dos nulas), corregido 0.245 en el universo y 0.180 en los 698 de conteo alto, y el correlograma lo ubica en **1–2 km** → es mosaico de barrio, no gradiente de alcaldía. **H1 no se toca**; cambia la frase de la slide 7. Límite nuevo: los AGEB de conteo bajo tienen `m` 9% más alta (p = 5×10⁻⁶) y están agrupados, y no son la periferia (37% en Cuajimalpa, 82% en Benito Juárez). **Con el 11 de oct se congelan las cifras.** El único P2 que queda es el **2.2** (covariables de RESAGEBURB), que va a la slide 8 como siguiente paso; el 2.5 le dejó un requisito: con autocorrelación a 1–2 km, H2 necesita error espacialmente correlacionado o inferencia por bloques, porque una regresión de AGEB independientes daría errores estándar demasiado optimistas.

12. **Deck de la revisión de avance (12 oct; reestructurado el 14 de oct).** **Reestructuración del 14:** el deck pasó a narrativa de *data storytelling* porque la versión del 12 era correcta pero densa —  cada slide principal cargaba cinco o seis cifras y la figura central iba en dos paneles. Las ocho slides nuevas son `pregunta` (gancho: *la CDMX no mide mal el delito por falta de datos; lo mide mal porque solo cuenta lo que alguien logró denunciar*), `importa`, `cambio`, `idea` (nueva: el diagrama hecho → llamada → carpeta, y H1–H3), `fuentes`, `mapa` (hero + zoom), `pruebas` (nueva: tres preguntas con su veredicto) y `supuestos`. **No se perdió ninguna cifra:** la tabla del alcance y la convergencia de alcaldía (ρ = +0.61 y +0.74) bajaron a respaldo, que pasó de 9 a 12 slides con `r-mapa-marcado` incluida. Regla nueva: ninguna slide principal lleva más de tres cifras impresas. **Precisión que hay que poder defender en la slide 1:** la FGJ sí registra el lugar del hecho (`alcaldia_hecho` y coordenadas del hecho); lo que depende de la denuncia no es el lugar sino la existencia del registro, y por eso el conteo de carpetas mezcla dónde ocurre con dónde se llega a denunciar. Pendiente antes de enviar: **volver a cronometrar**, porque el ensayo del 13 fue con la estructura vieja. **Lo del 12 de oct:** armado con las 8 slides del §5 del plan más 9 de respaldo, con notas del orador y minutaje. No hubo cálculos: todas las cifras salen de este documento, §4. Los dos pendientes del envío del 14 quedaron **cerrados el 13 de oct**: el nombre del alumno está en la portada, y el título impreso de la figura del 2.6 ya dice "cambia por zonas más chicas que la alcaldía" (antes "entre AGEB vecinos"). El cambio fue solo de texto en `build_eda2.py` §10 (`suptitle`, además de bajar el `fontsize` de 23 a 21 porque el título viejo rozaba el borde) más la línea equivalente de §10.5; el notebook se regeneró y re-ejecutó completo y **los 14 CSV y las otras 3 figuras salieron byte a byte idénticos**, así que el congelamiento de cifras del 11 de oct sigue en pie. El PNG nuevo se subió a la slide 7 del deck. La coda "y no respeta sus fronteras" no cabe en el ancho de la figura y queda en la frase hablada y en el límite (1) al pie.
13. **TODO (sin decidir, 8 oct): cómo accede a los datos quien clone el repo.** Las fuentes están fuera de git y `README.md` no documenta cómo obtenerlas; además el certificado de `archivo.datos.cdmx.gob.mx` caducó el 28-sep y no hay espejo con TLS válido (§9). Importa para D5: la demo en vivo no debería depender de descargar nada. Dos opciones, sin elegir aún: (a) versionar las fuentes derivadas ligeras para que el notebook corra sin descargas, o (b) documentar en el README las 7 URLs con la trampa del certificado y el pin recalculado. Decidir antes de la presentación final, no antes del 15 de oct.
---

## 9. Notas técnicas para quien retome

- ENVIPE CSV: `pd.read_csv(..., dtype=str, lineterminator="\r")`. Catálogos en `*/catalogos/<var>.csv`.
- ENSU: leer el CSV `ensu_cb_XXXX.csv` desde el zip con `io.BytesIO`; filtrar `CVE_ENT == "09"`.
- FGJ: `pd.read_csv(..., engine="pyarrow", usecols=[...])` tarda <1 s. `alcaldia_catalogo` está 99% vacía; usar `alcaldia_hecho`.
- 911: `fecha_creacion` requiere `pd.to_datetime` antes de filtrar. Todos los archivos traen registros fuera de su semestre (el de 2022 S1, ~1,000 de dic-2021); filtrar siempre por ventana.
- RESAGEBURB: `encoding="utf-8-sig"`; con `latin-1` la primera columna sale como `ï»¿ENTIDAD`.
- Normalizar nombres de alcaldía: quitar acentos y pasar a mayúsculas; "CUAJIMALPA" → "CUAJIMALPA DE MORELOS".
- Bootstrap Rao-Wu implementado en el notebook (sección 2.1), con semilla 2026 y 1,000 réplicas.
- ENDIREH 2021: leer los microdatos con `pd.read_csv(io.BytesIO(zip.open(...).read()), dtype=str, encoding="latin-1")` (CRLF, sin BOM) y aplicar `.str.strip()`. Unir tablas por `ID_PER`. Usar `TB_VD` para las condiciones de violencia (reproduce a INEGI). En CDMX hay 3 estratos con solo 2–3 UPM: el Rao-Wu funciona, pero no bajar de grano.
- **Re-descarga de FGJ y 911 (8 oct 2026):** el certificado de `archivo.datos.cdmx.gob.mx` **caducó el 28-sep-2026** (Let's Encrypt, emisor `YR2`) y sigue sin renovarse, así que `curl` con TLS estricto falla con "certificate has expired". No hay espejo: en `datos.cdmx.gob.mx` (que sí renovó) las rutas directas dan 404 y el endpoint CKAN `/dataset/<pkg>/resource/<id>/download` redirige (302) al host roto; el catálogo apunta los 7 CSV a `archivo.`. Se descargaron relajando solo la validación de fecha pero **fijando la llave pública** del certificado inspeccionado (`curl -k --pinnedpubkey sha256//ZuytGOCXPrgqk6NBTOnOLNXVwghd8nF55wT59Eva754=`, huella SHA-256 `52:67:BD:DC:51:A9:B1:EB:45:99:3E:05:5A:79:F9:C8:AC:2A:5E:50:39:5B:7B:71:5F:6F:54:E6:FA:40:72:35`), lo que conserva la garantía contra suplantación. **La llave cambia cuando renueven**, así que el pin se recalcula del certificado vivo, no se copia. Integridad confirmada contra las cifras del §2: 2.099 M filas, 357 delitos / 18 categorías, 4.8% y 1.2% de faltantes; 911 con 166.5k / 164.1k / 152.8k / 92.2k delitos en ventana y mismo esquema de 18 campos; víctimas 2021 con 37,315 de violencia familiar (73.5% / 26.0% con los nulos de `sexo` en el denominador) y 14.6% sin edad.
- Las fuentes INEGI (ENVIPE, ENDIREH micro y datos abiertos, shapefile AGEB, RESAGEBURB) y ENSU no se vieron afectadas: descargan con TLS estricto y los zips en disco abren bien.
- En este equipo hay un hook "GateGuard" que, antes del primer comando Bash de cada turno, pide declarar la petición y lo que hace el comando.
