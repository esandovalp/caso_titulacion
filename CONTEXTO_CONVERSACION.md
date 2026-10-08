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
| Carpetas FGJ | `carpetas-datos/carpetasFGJ_acumulado_2025_01.csv` (560 MB) | Evento con colonia + lat/lon; 2016-01 → 2025-01 | 2.1 M filas, 357 delitos / 18 categorías, 4.8% sin coordenadas, 1.2% sin alcaldía. 2025 solo enero. Quiebre COVID 2020–21. |
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
- **c. CDMX, mujeres con violencia familiar en los últimos 12 meses:** prevalencia 14.9%; n = **465** mujeres (609 mil expandidas), **24** denunciaron. **No denuncia = 95.7% (IC 95%: 93.6–97.6%)**; CV de la tasa de denuncia (4.3%) = **22.6% → precisión moderada** según INEGI. Variantes: ante MP 96.9% (17 casos, CV 27.2%); autoridad o institución de apoyo 93.8% (34 casos, CV 20.0%). Nacional: 95.4% (n = 11,518; 609 denuncias). *Pareja* 12 m: 92.9% sin periodo en la denuncia (39/594, CV 17.9%); 98.3% si se exige que la última queja sea de 2020–21 (11 casos, CV 36%, baja). *Familia o pareja* 12 m: 96.6% (IC 95.1–97.8%; 34/873, CV 19.8%).
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

### Decisión de alcance (tarea 1.3, 1 oct) — **vigente**
Se adoptó la opción (a); detalle completo en `PLAN_15_OCT.md` §3, §3.1 y §3.2. No hubo cálculos nuevos: las cifras salen de este documento y de `resultados/02_` y `09_`.
- **Pregunta:** ¿Cómo se distribuye entre los AGEB de la CDMX la brecha entre las llamadas al 911 y las carpetas de la FGJ por violencia familiar, y qué características de la vivienda y del hogar se asocian con ella?
- **Aplicación = violencia familiar.** El par es 911 "Agresión – Casa habitación" ↔ FGJ "VIOLENCIA FAMILIAR", con confianza media y 0.88 llamadas por carpeta. El calibrador de ciudad es la ENDIREH 2021 con el combinado familia o pareja: 96.6% de no denuncia. El denominador son las viviendas habitadas.
- **Calibración = robo a conductor.** El par es "Robo – Automovilista" ↔ "Robo a pasajero/conductor c/v", con confianza alta y 2.13 llamadas por carpeta. ENVIPE solo da una cota: 94.8% en calle y transporte (IC 95%: 92.1–97.3%; 31 carpetas de 562 delitos; CV 25.3%, precisión moderada; verificado el 1 de oct).
- **Ninguno cumple los cuatro criterios** de la matriz. Se declara así.
- **H3 reformulada:** contra la cota de ENVIPE no es falsable, porque ningún resultado plausible de llamadas/carpeta la contradice. Pasa a ser una prueba de **estabilidad territorial** de la brecha de robo a conductor entre 2019 y 2021–22, contra una nula por permutación, con la agregación fijada antes de ver el resultado (hay menos de dos carpetas por AGEB por ventana). Como concordancia secundaria, se compara con el % inseguro de la ENSU por alcaldía.
- **Supuestos más frágiles**, es decir, los que mueven el mapa y no solo el nivel: S1, contaminación del canal (hasta 19% de robo); S4, estabilidad 2019 vs 2021–22; S6, la brecha mide la fricción entre el aviso y la denuncia, no el subregistro. S2 (universo) y S3 (desfase) mueven solo el 96.6%.

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

> Plan vigente con fechas: `PLAN_15_OCT.md` (replaneado el 26 sep: semana 1 = 29 sep – 5 oct).

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
11. ~~Experimento 2.1~~ → **hecho el 5 oct** (§4, "Experimento 2.1"): `11_` exportado, regla de H3 fijada antes de correlacionar (76 grupos) y S4 estable (ρ = 0.30, p = 0.001). **Siguen:** 2.3 (H1 sobre `11_`, con la brecha conjunta y cada ventana como robustez), 2.6 (mapa con `conteo_bajo` y `cambia_clasif_s1` marcados) y 2.4 (H3 con los 76 grupos; percentil 95 de la nula ≈ 0.19).

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
- En este equipo hay un hook "GateGuard" que, antes del primer comando Bash de cada turno, pide declarar la petición y lo que hace el comando.
