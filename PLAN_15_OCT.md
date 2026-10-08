# Plan hacia la revisión de avance — 15 de octubre de 2026

> 19 días desde hoy (sábado 26 sep). La sesión es **jueves 15 de oct**, 10 min de presentación + 5 de preguntas.
> **Replaneado el 26 de sep:** la semana 1 original (22–28 sep) se recorre una semana completa. La fecha del 15 de oct no se mueve, así que la holgura sale de la semana 3 (consolidación), que queda comprimida en 12–13 oct.
> **Actualizado el 1 de oct:** alcance cerrado (tarea 1.3): violencia familiar como aplicación y robo a conductor como calibración (§3). La semana 2 arranca el 6 de oct sin bloqueos.
> Slides a los sinodales (Morales / Mejía / Román) el **miércoles 14 de oct**.
> Contexto completo del trabajo previo: `CONTEXTO_CONVERSACION.md`. Rúbrica y entregables: `CLAUDE.md`.

**Supuesto de encuadre de la sesión** *(confirmar con los sinodales si hay duda)*: el 15 de oct no es la presentación final de la rúbrica (esa es de 15–20 min + 10 de preguntas, con los tres entregables). Es la revisión de avance en la que se califican **D1 (problema), D2 (datos) y D3 (EDA)**, más el arranque de D4. Todo el plan está optimizado para esas tres dimensiones —  35% del total — y para no cerrar puertas en D4/D5.

---

## 1. Dónde estamos

**Lo que ya está resuelto y es defendible:**
- El encuadre original está empíricamente descartado, con evidencia propia: ENVIPE no soporta desagregación por alcaldía (12/16 alcaldías con CV > 30%, heterogeneidad no significativa con p = 0.84 tras corregir por efecto de diseño ≈ 2.6). Esto **no es un fracaso, es el primer resultado** y hay que presentarlo como tal.
- La cifra negra de la ciudad se reproduce contra la cifra oficial de INEGI (93.5% vs 93.2%), lo que valida que el manejo de microdatos y factores de expansión es correcto.
- Hay un hallazgo no obvio y con evidencia convergente: **dos fuentes administrativas independientes reproducen el gradiente centro–periferia que ENVIPE sugiere pero no puede medir con precisión** (llamadas 911 por carpeta ↔ cifra negra, ρ = +0.61; ↔ percepción ENSU, ρ = +0.74).
- El grano AGEB es técnicamente viable: 93.5% de las carpetas y 99.8% de las llamadas caen en un AGEB urbano.

**Lo que está abierto y bloquea todo lo demás:**
- ~~El alcance por tipo de delito no está cerrado~~ → cerrado el 1 de oct (§3): violencia familiar + robo a conductor.
- ~~AMIS no está verificado~~ → verificado el 26 sep: **solo nivel entidad**. El caso de calibración queda con ENVIPE como calibrador.
- ~~Faltan RESAGEBURB y el 911 completo~~ → RESAGEBURB descargado y une 100% con el shapefile. **El 911 no se publica después de abr-2022**: la ventana común queda en 2019 + jul-2021 → abr-2022 (22 meses, ~575k llamadas de delito).

---

## 2. Hallazgos nuevos del 22 de sep que cambian la recomendación

Verificación directa sobre las tablas de FGJ y 911 (`scope_check`, ene–abr 2022 y año 2024):

| Hallazgo | Implicación |
|---|---|
| **86% de las carpetas de 2024 (186,426 de ~217k) caen en la categoría comodín "DELITO DE BAJO IMPACTO"** | El campo `categoria_delito` es inservible para acotar el alcance. Hay que trabajar con `delito` (357 valores). "Robo a casa habitación sin violencia" (2,915 en 2024) está escondido dentro de ese comodín. Es un punto fuerte de D2. |
| **La cobertura de coordenadas depende del delito**: 97.7% robo a transeúnte, 94.9% bajo impacto, 85.1% robo de vehículo, **38.4% lesiones por arma de fuego** | La ausencia de coordenadas no es aleatoria. Restringe qué delitos admiten análisis a nivel AGEB y es un supuesto que hay que declarar, no esconder. |
| El 911 tiene **9,043** incidentes "Casa habitación" en 4 meses, contra **1,128** "Automovilista" y **883** "Robo" | Para robo de vehículo el canal 911 es delgado; para casa habitación es el más denso del catálogo. **Falta verificar la semántica**: "Agresión–Casa habitación" puede ser violencia intrafamiliar y no robo. |
| FGJ 2024: robo de vehículo **7,251** (categoría propia), casa habitación ≈ **3,150** sumando con y sin violencia | Ambos tienen volumen suficiente para trabajar por AGEB con 3 años de datos. |

**Consecuencia:** la elección del delito piloto no debe hacerse a priori. Debe salir de una tabla de equivalencias 911 ↔ FGJ construida con datos, y eso es en sí mismo un entregable de D2 que responde directo al comentario 2 de los profesores.

---

## 3. Alcance del caso — cerrado el 1 de oct (tarea 1.3)

**Pregunta.**
> ¿Cómo se distribuye entre los AGEB de la CDMX la brecha entre las llamadas al 911 y las carpetas de la FGJ por violencia familiar, y qué características de la vivienda y del hogar se asocian con ella?

El nivel de ciudad no sale de la brecha: lo acota la ENDIREH 2021. El método se pone a prueba en robo a conductor, el único par 911 ↔ FGJ con mapeo de confianza alta.

| | **Aplicación** | **Calibración del método** |
|---|---|---|
| Delito | Violencia familiar | Robo a conductor con violencia |
| 911 / FGJ | "Agresión – Casa habitación" / "VIOLENCIA FAMILIAR" | "Robo – Automovilista" / "Robo a pasajero/conductor c/v" |
| Llamadas por carpeta, ventana común (`09_`) | 0.88 | 2.13 |
| Calibrador | **ENDIREH 2021**, familia o pareja, 12 m: **96.6% no denuncia** (IC 95%: 95.1–97.8%; 34 denuncias de 873 mujeres; CV 19.8%) | **Solo una cota**: ENVIPE 94.8% en "calle y transporte" (IC 95%: 92.1–97.3%; 31 carpetas de 562 delitos; CV 25.3%, precisión moderada), que no separa al conductor |
| Denominador AGEB | Viviendas particulares habitadas ✓ (el hecho ocurre en el domicilio) | Débil (el hecho ocurre en la vialidad): se usa la razón, sin tasa |
| Confianza del mapeo | **Media**: parcial AGEB 0.42, perfil horario −0.12, entre 0% y 19% del código podría ser robo | **Alta**: parcial AGEB 0.42, perfil horario 0.93, tendencia 0.48× vs 0.47× |
| Criterio de la matriz que **no** cumple | ENVIPE no la mide (se suple con ENDIREH, que tiene otro universo) y el canal 911 está contaminado | ENVIPE no lo separa y no tiene denominador AGEB |

**Ninguno de los dos cumple los cuatro criterios** de la matriz (canal 911 limpio × cifra negra medible × denominador AGEB × coordenadas). Ningún delito del catálogo los cumple (`CONTEXTO_CONVERSACION.md` §4). Elegí la combinación en la que cada caso cubre lo que al otro le falta: violencia familiar aporta el denominador y una no denuncia medida; robo a conductor aporta el mapeo limpio.

**Hipótesis, declaradas antes de modelar:**
- **H1** *(D3 → D4)*. En violencia familiar, la brecha llamadas/carpeta varía más entre AGEB que entre alcaldías, y más de lo que daría el azar (permutación nula).
- **H2** *(D4, final)*. Esa brecha disminuye con la escolaridad (`GRAPROES`) y la derechohabiencia (`PDER_SS`), y aumenta con el hacinamiento (`PRO_OCUP_C`).
- **H3** *(D4, falsación)*. En robo a conductor, la distribución territorial de la brecha se mantiene entre 2019 y 2021–22 por encima de una permutación nula. Si no se mantiene ni en el par mejor mapeado, la brecha no lleva señal territorial y H1 no se puede interpretar (§3.1).

**Objetivos acotados:**
1. ✅ Tabla de equivalencias 911 ↔ FGJ con sus límites (`09_`, `10_`).
2. Brecha por AGEB de los dos delitos, por ventana y con incertidumbre (2.1).
3. Probar H1 en violencia familiar (2.3) y H3 en robo a conductor (2.4).
4. Acotar el nivel de ciudad de violencia familiar con la ENDIREH, como rango y no como estimación (2.4).
5. Para la final: modelar H2 con RESAGEBURB y entregar el mapa de la brecha como aplicación.

**Lenguaje obligatorio:** *aproximar, acotar, brecha relativa, rango*. Nunca *estimar el subregistro real*. El comentario 1 de los profesores es precisamente que ese número no se puede conocer. La respuesta correcta es poner esa imposibilidad en el centro del encuadre, no en un pie de página.

---

*Lo que sigue es respaldo del §3: la página de arriba se lee sola.*

### 3.1 H3: cómo se falsa con robo a conductor

**Contra ENVIPE no hay forma honesta de falsarla.** La cota de 94.8% es débil por tres razones:
- **Universo:** mide el robo en calle y transporte público, incluidos el transeúnte y el pasajero. El robo a conductor es un subconjunto que la encuesta no separa, así que su no denuncia puede quedar arriba o abajo de 94.8%.
- **Unidad:** la cota habla de delitos sin carpeta. La brecha cuenta llamadas por carpeta, y las llamadas son solo un subconjunto de los delitos. Lo único que la contradiría es una razón llamadas/carpeta mayor que la de delitos por carpeta que implica la cota, del orden de 1/(1 − 0.948). La observada (2.13) está un orden de magnitud por debajo, así que **ningún resultado plausible la contradice**.
- **Precisión:** son 31 carpetas en la muestra. IC 95%: 92.1–97.3% y CV de la tasa de carpeta (5.2%) de 25.3%, es decir, precisión moderada según INEGI (verificado el 1 de oct; Taylor da 25.9%). El intervalo, de 5 puntos de ancho, no cambia el argumento: la cota es débil por universo y unidad, no por precisión.

Por eso la cota de ENVIPE se reporta como contexto, no como prueba.

**H3 vigente: estabilidad territorial.**
- **Prueba:** calcular la brecha por unidad espacial en 2019 y en jul-2021 → abr-2022 y medir la correlación de Spearman entre las dos ventanas. La nula sale de permutar las unidades (semilla 2026, 1,000 permutaciones). La prueba es de rangos, así que la caída de nivel (0.48× en el 911 y 0.47× en la FGJ) no la afecta.
- **Qué la refuta:** que la ρ observada no supere el percentil 95 de la nula.
- **Grano:** hay 3,792 carpetas en 2019 y 1,494 en 2021–22 para 2,433 AGEB, menos de dos por AGEB en promedio. La prueba no se puede hacer sobre el AGEB crudo. La agregación (AGEB con un mínimo de eventos en ambas ventanas, suavizamiento bayesiano empírico o grupos de AGEB contiguos) **se fija en 2.1, antes de ver la correlación**. Si se elige después, la prueba deja de ser falsación.
- **Regla de agregación — fijada el 5 de oct de 2026, antes de calcular cualquier correlación entre ventanas.** Solo se vio la distribución de conteos por AGEB de robo a conductor (script en el scratchpad, sin correlaciones):
  - *Distribución:* carpetas geolocalizadas en un AGEB = 3,767 (2019) y 1,467 (2021–22); llamadas = 8,050 y 3,214. AGEB con cero carpetas: 48% y 65%; mediana 1 y 0; percentil 95: 7 y 3.
  - *Descartada, umbral mínimo por AGEB:* con ≥ 3 carpetas en ambas ventanas quedan 100 AGEB y 25–29% de las carpetas; con ≥ 5, 26 AGEB y 10–12%. La prueba hablaría de unos cuantos corredores viales, no de la ciudad.
  - *Descartado, suavizamiento bayesiano empírico:* con 65% de ceros en 2021–22, casi todos los AGEB se contraen a la media de la ciudad; el Spearman quedaría lleno de empates y lo moverían los pocos AGEB con volumen. Además exige modelar la razón de dos Poisson, con un supuesto previo más que defender.
  - **Elegida, grupos de AGEB contiguos dentro de la misma alcaldía**, con **≥ 12 carpetas en cada ventana**. Con 12 eventos, el CV de Poisson del denominador es 1/√12 = 28.9%, por debajo del 30% que INEGI usa como frontera de precisión baja y que el caso usa en todas sus cifras de encuesta. Construcción determinista: se fusiona el grupo con menos carpetas en su ventana más delgada con el grupo vecino de centroide más cercano, hasta que todos cumplen o la alcaldía queda en un solo grupo (se marca). Los grupos se arman **solo con los conteos de carpetas**, nunca con las llamadas ni con la razón. Conserva prácticamente todos los eventos. Techo teórico: 1,467 / 12 ≈ 122 grupos.
  - *Supuesto:* uso grupos contiguos asumiendo que la brecha varía de forma suave en el espacio, así que unir AGEB vecinos promedia ruido y no mezcla regímenes distintos. Si la brecha cambiara de golpe entre AGEB vecinos (por ejemplo, un corredor vial junto a una zona habitacional), los grupos la diluirían y H3 perdería potencia; en ese caso sería mejor un umbral sobre segmentos viales, que no tenemos.
  - *Resultado de aplicarla (5 oct, después de fijarla; experimento 2.1, `build_eda2.py` §8.4):* 77 grupos, **76 cumplen** y cubren 2,389 de 2,433 AGEB y prácticamente todos los eventos (99.9–100% de llamadas y carpetas geolocalizadas). Queda fuera Milpa Alta (42 AGEB, no llega al umbral ni completa) y 2 AGEB sin polígono. Mediana: 22 AGEB por grupo, 43.5 carpetas en 2019 y 17.5 en 2021–22. Costo: Cuajimalpa, Magdalena Contreras y Tláhuac quedan como un solo grupo y Xochimilco como dos. **H3 se probará con n = 76** (percentil 95 de la nula ≈ 0.19). No se ha calculado ninguna ρ entre ventanas de robo a conductor.
  - **Violencia familiar (S4), mismo criterio:** no hace falta agregar (mediana 9 carpetas por AGEB y ventana; 4% y 3% de AGEB en cero). La prueba de estabilidad usa los AGEB con **≥ 12 carpetas en cada ventana** (mismo CV ≤ 30%). Como sensibilidad declarada desde ahora: umbral de ≥ 5, solo llamadas "afirmativas" y la brecha con 19% de robo descontado.
- **Concordancia (secundaria):** agregada a alcaldía, la brecha de robo a conductor debería correlacionar positivamente con el % que se siente inseguro en la ENSU, que es una fuente independiente. Con n = 16 se necesita |ρ| ≥ 0.50, así que se presenta como concordancia, no como prueba. No se usa la razón 911/carpeta total porque contiene al propio par y el resultado sería circular.
- **Lectura conjunta:** la misma prueba de estabilidad se aplica a violencia familiar como verificación del supuesto S4. **Resultado (2.1, 5 oct): violencia familiar = estable.** ρ = 0.30 (IC 95% 0.23–0.37; 698 AGEB), percentil 95 de la nula 0.065, p de permutación 0.001; se sostiene en las tres sensibilidades (0.22–0.26). Falta H3 (2.4) para saber en qué fila de la tabla cae el caso.

| Robo a conductor (H3) | Violencia familiar (S4) | Lectura |
|---|---|---|
| estable | estable | La brecha lleva señal territorial reproducible; H1 es interpretable |
| estable | inestable | Falla el canal de violencia familiar (contaminación, S1) o hubo un cambio real con COVID (la FGJ subió 1.34×, el 911 1.09×). Se reporta por ventana |
| inestable | — | A grano AGEB el método no da señal. El caso se reduce a la tabla de equivalencias y al acotamiento de ciudad con la ENDIREH, y eso se dice |

H3 aceptada **no** prueba que la brecha mida subregistro. Prueba que no es ruido.

### 3.2 Supuestos del alcance

Formato del criterio transversal: *uso X asumiendo Y; si Y no se cumpliera, Z sería más apropiado.* La columna "si falla" separa lo que mueve la **distribución territorial** (que es la pregunta) de lo que solo mueve el **nivel de ciudad**.

| # | Supuesto | Dim. | Si falla |
|---|---|---|---|
| S1 | **Canal.** Uso "Agresión – Casa habitación" como canal 911 de la violencia familiar, asumiendo que la parte de robo del código es chica (rango 0–19%; mezcla espacial 16%, IC 13–19%) y que **no se concentra en ciertos territorios**. El perfil horario (−0.12) no coincide con el de la FGJ, así que la confianza es media. Si el robo se concentrara en algunos AGEB, el mapa mezclaría dos delitos. En ese caso convendría calcular la brecha con 0% y con 19% de robo descontado, y reportar solo los AGEB cuya clasificación no cambia. | D2, D4 | **Territorial** |
| S2 | **Universo.** Uso la no denuncia de la ENDIREH (mujeres de 15+, familia o pareja: 96.6%) como cota de ciudad de la carpeta "VIOLENCIA FAMILIAR". Asumo que hombres y menores de 15, que son entre 30% y 39% de las víctimas FGJ de 2021, no denuncian muy distinto, y que el combinado familia o pareja corresponde a lo que la FGJ junta en una sola carpeta (no las separa). Si no fuera así, la calibración se restringiría a las víctimas FGJ mujeres de 15+ (el archivo de víctimas cuenta víctimas, no carpetas) y el resto se declararía fuera de alcance. | D1, D2 | Nivel |
| S3 | **Desfase.** La ENDIREH mide oct-2020 → nov-2021, dentro del hueco COVID de la ventana 911; solo jul–nov 2021 se traslapa. Uso el 96.6% para toda la ventana asumiendo que la propensión a denunciar durante el confinamiento no fue muy distinta de la de 2019 y 2021–22. Si lo fue (la FGJ subió 1.34× entre ventanas), la cota vale solo para 2021–22. Contrastar con la ENDIREH 2016 queda como trabajo futuro (fuente no descargada). | D2 | Nivel |
| S4 | **Estabilidad territorial.** Uso 2019 y jul-2021 → abr-2022 como una sola ventana, asumiendo que la distribución territorial de la brecha es estable entre ambas. Se prueba en 2.1 con la misma prueba de H3. Si falla, se reporta por ventana: el resultado describe 2019–22 y no el presente, y para la final se piden los datos 2023–24 por PNT. | D3, D4 | **Territorial** |
| S5 | **Falacia ecológica y denominador.** Uso las viviendas particulares habitadas como denominador y las covariables de RESAGEBURB como descriptores de los hogares afectados. Asumo que el AGEB del hecho es el del domicilio (en ambas fuentes la coordenada es la del lugar) y que los hogares con violencia se parecen al promedio de su AGEB. Si la violencia se concentra en subgrupos dentro del AGEB, H2 se lee como asociación territorial y no individual; la inferencia individual solo la da la ENDIREH, que no baja a AGEB. Se excluyen los AGEB con viviendas 0 y los `*` de confidencialidad (173 en `VPH_1CUART`). | D1, D4 | **Territorial** (H2) |
| S6 | **La brecha no es el subregistro.** Uso llamadas/carpeta como indicador de fricción entre el aviso y la denuncia, asumiendo que la propensión a *llamar* no varía en el territorio con las mismas covariables que la propensión a *denunciar*. Los hechos que no llegan a ninguna de las dos fuentes son invisibles para la brecha: por eso el nivel lo acota la ENDIREH y la brecha solo ordena territorios. En violencia familiar la razón es 0.88, es decir, hay más carpetas que llamadas y muchas carpetas entran sin pasar por el 911. Si la propensión a llamar variara con las covariables, H2 mezclaría dos mecanismos. En ese caso convendría controlar la propensión a llamar con las llamadas de otros motivos en el mismo AGEB. | D1, D3 | **Territorial** |
| S7 | **Coordenadas.** Uso solo las carpetas geolocalizadas (97.6% en violencia familiar y 99.2% en robo a conductor), asumiendo que las que faltan no se concentran en ciertos territorios. Si se concentraran, el sesgo afectaría a los AGEB con menos coordenadas, y habría que reportar la cobertura de coordenadas por alcaldía junto al mapa. | D2 | Territorial (menor) |

**Los tres más frágiles** son S1, S4 y S6: si fallan, cambia el mapa y no solo el nivel. S2 y S3 mueven el 96.6%, pero no el orden de los AGEB.

---

## 4. Calendario

### Semana 1 — 29 de sep al 5 de oct · cerrar el alcance
Nada de lo que sigue puede empezar antes de que esto esté decidido. Las tareas 1.1, 1.4 y 1.5 se adelantaron y quedaron cerradas el 26 de sep.

| # | Tarea | Termina cuando | Estado |
|---|---|---|---|
| 1.1 | **Verificar AMIS**: qué publica sobre robo de vehículos asegurados, desagregación y desde qué año | Respuesta de una línea: sirve / no sirve / sirve solo a nivel entidad | ✅ 26 sep — **solo nivel entidad** (PDF mensuales; de CDMX solo GAM entra al top-15 nacional) |
| 1.2 | **Tabla de equivalencias 911 ↔ FGJ** por par `categoria_incidente_c4` × `incidente_c4` contra `delito`, sobre la ventana común. Verificar la semántica de "Agresión–Casa habitación" y "Robo–Automovilista", y explicar por qué "Automovilista" cae de 4,216 (2019 S1) a 1,128 (ene–abr 2022) | CSV de equivalencias con volumen de ambos lados y una columna de confianza del mapeo | ✅ 26 sep — `notebooks/build_eda2.py` → `resultados/09_` y `10_`. **Cambia el alcance** (ver nota abajo) |
| 1.3 | **Decidir los dos delitos** con el criterio: cobertura 911 real × cifra negra ENVIPE medible × denominador AGEB válido × cobertura de coordenadas | La pregunta, la hipótesis y los objetivos quedan escritos en una página | ✅ 1 oct — opción (a): **violencia familiar** (aplicación, ENDIREH) + **robo a conductor** (calibración). Ninguno cumple los cuatro criterios. H3 reformulada como estabilidad territorial. Ver §3, §3.1 y §3.2 |
| 1.4 | Descargar **RESAGEBURB 2020 CDMX** y verificar variables y unión con el shapefile | `head()` de las columnas y % de AGEB que unen | ✅ 26 sep — 5/5 variables, **100% de unión** (2,433 AGEB); 10–12 AGEB con `*` (confidencialidad), 173 en `VPH_1CUART` |
| 1.5 | ~~Descargar 911 completo 2022–2024~~ → no existe (404 en el portal). Se descargó **2019 S1/S2 + 2021 S2** | Archivos en `911_llamadas_datos/` y rango de fechas verificado | ✅ 26 sep — 22 meses; 2020 y 2021 S1 excluidos por COVID. Pedir 2023–2024 por PNT para la final |

**Resultado de la tarea 1.2 (26 sep) — invalida los dos casos del §3 tal como estaban:**
- **"Robo – Automovilista" es robo *al conductor*, no robo *del vehículo***: correlación parcial por AGEB con robo de vehículo particular ≈ 0 (c/v 0.02, s/v −0.07), y con *robo a pasajero/conductor c/v* 0.42, perfil horario 0.93. Es el único par del catálogo con confianza **alta**. **El 911 no tiene código de robo de vehículo** → H3 no se puede probar con robo de vehículo.
- Su caída a la mitad **es real, no de catálogo**: sin escalón en 2019 (sí lo hay en otros códigos el 2–3 sep y en "Robo – Otros" en oct-2019), y la FGJ cae igual (0.45–0.49× vs 0.48×).
- **"Agresión – Casa habitación" se comporta como violencia familiar**: sube 1.09× mientras el robo a casa de la FGJ cae 0.49×; pico a medianoche y en fin de semana; parcial AGEB 0.42 con violencia familiar vs 0.27 con robo; coeficiente del robo **negativo** en el binomial negativo. A lo más ~19% podría ser robo (rango 0–19%). El 911 no tiene texto libre ni motivo "Robo – Casa habitación".
- Robo a transeúnte tampoco tiene canal (solo "Robo – Otros", residual con parcial 0.07 y escalón de catálogo en oct-2019).
- **Recomendación para 1.3** (detalle en el notebook, §6): aplicación = **violencia familiar** (hereda el argumento del domicilio y el denominador de viviendas; requiere ENDIREH 2021 como calibrador porque ENVIPE no la mide) · calibración = **robo a conductor** (único par con confianza alta; ENVIPE solo como cota, dentro de "calle y transporte" 94.8%). Alternativa conservadora: robo a casa habitación **sin 911** (FGJ + ENVIPE), que pierde la brecha entre fuentes.
- ~~Pendiente antes del 4 de oct: verificar ENDIREH 2021~~ → **verificado el 26 sep: sirve** (a, b y c = sí). Microdatos con `FAC_MUJ`/`EST_DIS`/`UPM_DIS`; pregunta de denuncia ante autoridad para familia (`P11_6_2`, últimos 12 meses) y para pareja (`P14_7_2`, toda la relación); representativa por entidad. **CDMX: 95.7% de las mujeres con violencia familiar en el último año no denunció (IC 95%: 93.6–97.6%; n = 465, 24 denuncias; CV de la tasa de denuncia 22.6%, precisión moderada).** El cálculo reproduce las cifras de INEGI a tres decimales. Detalle y supuestos en `CONTEXTO_CONVERSACION.md` §4. **Se elige violencia familiar + robo a conductor**, con dos supuestos nuevos que declarar: (1) universo: 30–39% de las víctimas FGJ de violencia familiar son hombres o menores de 15, y la FGJ no separa pareja de familia, así que el calibrador debe ser el combinado familia o pareja (96.6%, IC 95.1–97.8%, CV 19.8%); (2) tiempo: la ENDIREH mide oct-2020 → nov-2021, dentro del hueco COVID del 911. Cálculo definitivo: experimento 2.4 (`14_validacion_caso_calibracion.csv`), en un `build_eda3.py` nuevo, porque es una fuente nueva y no una equivalencia 911 ↔ FGJ.

**Punto de decisión del domingo 4 de oct:** ✅ **resuelto el 1 de oct, con opción (a)**: violencia familiar + robo a conductor, con la ENDIREH como calibrador. Se descartó la alternativa (b), robo a casa sin 911, porque pierde la brecha entre fuentes, que es el método. La pregunta, H1–H3, los objetivos y los supuestos están en el §3, y la decisión quedó anotada en `CONTEXTO_CONVERSACION.md` §4.

### Semana 2 — 6 al 11 de oct · los experimentos que se van a calificar
`notebooks/build_eda2.py` ya existe (tarea 1.2, secciones 1–7). Los experimentos 2.1, 2.3, 2.5 y 2.6 se agregan ahí como secciones nuevas. El 2.4 va en un `build_eda3.py` nuevo porque trae fuentes nuevas (ENDIREH, ENSU), no equivalencias 911 ↔ FGJ. Exportar a `resultados/` con numeración continua: `09_` y `10_` ya están ocupados por la tarea 1.2, así que la semana 2 empieza en `11_`.

Con la semana recorrida ya no hay margen para todo: los marcados **P1** son obligatorios para el 15; los **P2** entran solo si sobra tiempo y, si no, se presentan como "siguiente paso" en la slide 8.

| # | Prioridad | Experimento | Salida |
|---|---|---|---|
| 2.1 ✅ 5 oct | P1 | Violencia familiar ("Agresión – Casa habitación" ↔ "VIOLENCIA FAMILIAR") y robo a conductor ("Robo – Automovilista" ↔ "Robo a pasajero/conductor c/v") por AGEB, con 2019 y jul-2021 → abr-2022 por separado: carpetas, llamadas y brecha llamadas/carpeta. En violencia familiar, agregar las viviendas particulares habitadas y la banda de sensibilidad con 0% y 19% de robo descontado (S1). En robo a conductor, reportar la distribución de conteos por AGEB y **fijar aquí la agregación de H3, antes de verla** (§3.1). Prueba de estabilidad entre ventanas para violencia familiar (S4) | `11_ageb_brecha_por_delito.csv` — **hecho**: regla de H3 fijada antes de correlacionar (§3.1, 76 grupos); S4 estable (ρ = 0.30, p = 0.001); 13.8–14.3% de los AGEB cambian de clase en la banda de S1, ninguno se invierte. El 2.3 y el 2.6 ya pueden leer `11_` |
| 2.2 | P2 | Unión con RESAGEBURB y descriptivos de las covariables de H2 | `12_ageb_covariables_resageburb.csv` |
| 2.3 | P1 | **H1**, en violencia familiar: ¿la varianza de la brecha es mayor entre AGEB que entre alcaldías? Descomposición de varianza o ICC, contrastada contra una permutación nula. Robo a conductor solo como contraste, con la agregación fijada en 2.1 | `13_variacion_brecha_ageb_vs_alcaldia.csv` |
| 2.4 | P2 | **H3 y calibrador**, en un `build_eda3.py` nuevo (mismo patrón `md()`/`code()`; lee `11_` de `resultados/`, no recalcula la brecha). (a) H3: Spearman entre ventanas de la brecha de robo a conductor contra una nula por permutación (semilla 2026, 1,000 permutaciones). (b) Concordancia por alcaldía con el % inseguro de la ENSU (n = 16). (c) Calibrador definitivo de la ENDIREH, familia o pareja, con Rao-Wu. (d) Cota de ENVIPE "calle y transporte" con IC, CV y n. **Sin implementar todavía** | `14_validacion_caso_calibracion.csv` |
| 2.5 | P2 | Diagnóstico de estabilidad: AGEB con conteos bajos, AGEB con vivienda 0, autocorrelación espacial (I de Moran) | `15_diagnostico_ageb.csv` |
| 2.6 | P1 | Mapa de la brecha de violencia familiar por AGEB, que es la figura central de la presentación, con los AGEB de conteo bajo marcados y no coloreados. Al lado, el mapa de robo a conductor con la agregación de H3, como contraste del método | PNG en `resultados/figuras/` |

**Regla:** cada tabla se acompaña de una línea de interpretación en el notebook. Un CSV sin lectura no puntúa en D3.

**Congelar cifras el domingo 11 de oct.** Nada de análisis nuevo después.

**En paralelo desde la semana 1:** el esqueleto del deck (slides 1–5, que no dependen de los experimentos nuevos) se arma mientras corren las descargas y el notebook. Así la semana 3 solo tiene que insertar resultados.

### 12 al 15 de oct · consolidar, narrar y presentar
- **12 oct:** insertar resultados en el deck (estructura en §5). Una idea por slide, la cifra grande visible, la fuente al pie. Escribir las respuestas a las preguntas probables (§6).
- **13 oct:** ensayo cronometrado (**10 minutos reales, no 13**) y ensayo completo con alguien que no conozca el proyecto. Si no entiende la pregunta en el primer minuto, el deck está mal.
- **14 oct:** enviar slides a los sinodales (requisito de la rúbrica: 24 h antes).
- **15 oct:** presentación. Notebook abierto en otra ventana por si piden ver una cifra.

---

## 5. Estructura del deck (10 minutos)

Ocho slides. El tiempo es el presupuesto real, no una sugerencia.

| # | Slide | Min | Qué tiene que lograr | Rúbrica |
|---|---|---|---|---|
| 1 | La pregunta | 0:30 | La pregunta reformulada en una sola frase, sin preámbulo | D1 |
| 2 | Por qué importa y a quién le sirve | 1:00 | El decisor concreto y la decisión concreta. Un ranking por carpetas sobrerrepresenta el centro: ρ = −0.61 entre tasa FGJ y cifra negra. Quien asigna recursos con esa cifra los asigna al revés | D1 |
| 3 | Qué cambió desde el 14 de sep | 1:30 | El encuadre original no se sostiene, **con evidencia propia**: 12/16 con CV > 30%, p = 0.84. Enmarcado como resultado, no como retroceso | D1, D3 |
| 4 | Reencuadre: pregunta, dos casos, hipótesis | 1:30 | La tabla de los dos casos del §3: violencia familiar como aplicación, con la ENDIREH en 96.6%, y robo a conductor como calibración, el único mapeo de confianza alta. Decir en voz alta que **ninguno cumple los cuatro criterios** y cuál le falta a cada uno. H1–H3 explícitas, y por qué el domicilio arregla el denominador y debilita la falacia ecológica | D1, D3 |
| 5 | Fuentes y su calidad | 1:30 | Inventario con grano, periodo, cobertura **y limitación**. Aquí van el 86% de "bajo impacto" y la cobertura diferencial de coordenadas | **D2** |
| 6 | Resultado 1: fuentes independientes convergen | 1:30 | ρ = +0.61 y +0.74. Es el hallazgo no obvio: hay señal territorial medible sin depender de ENVIPE desagregada | D3 |
| 7 | Resultado 2: el grano AGEB funciona | 1:30 | 93.5% y 99.8% de asignación espacial; el mapa de la brecha; el contraste con el 38% del join por colonia | D2, D3 |
| 8 | Supuestos, límites y qué sigue | 1:00 | Los tres supuestos frágiles del §3.2: S1 (el canal 911 de violencia familiar podría tener hasta 19% de robo), S4 (estabilidad 2019 vs 2021–22) y S6 (la brecha no es el subregistro). Una línea sobre por qué H3 se prueba con estabilidad y no contra ENVIPE. Y el camino a la app: el mapa de la brecha de violencia familiar | D1, D4, D7 |

**Slides de respaldo** (no se presentan, se abren si preguntan): bootstrap Rao-Wu y efecto de diseño · cifra negra por tipo de delito · razones de no denuncia (71% atribuibles a la autoridad) · tabla de equivalencias 911↔FGJ · matriz de decisión de los cinco delitos · ENDIREH 2021 como calibrador (reproduce a INEGI, universo y desfase) · diagnóstico de AGEB con conteos bajos · por qué SESNSP no valida.

**Tres reglas de la narrativa** (D6 pide problema y decisión, no proceso): la primera frase es la pregunta, no el contexto. Cada slide de resultado dice qué implica para la decisión, no cómo se calculó. Los métodos van en respaldo.

---

## 6. Los 5 minutos de preguntas

Respuestas preparadas, en una línea cada una:

1. *¿Por qué abandonaste el encuadre por alcaldía?* → No lo abandoné por gusto: 12 de 16 alcaldías con CV > 30% y p = 0.84 tras efecto de diseño. La evidencia dice que a ese grano no hay señal medible.
2. *¿Entonces ya no vas a decir cuánto es el subregistro?* → Correcto, y es deliberado. Se acota la brecha relativa entre territorios con incertidumbre explícita; el número absoluto no es conocible y ese es el problema, no una omisión.
3. *¿Cómo sabes que la llamada al 911 y la carpeta son el mismo hecho?* → No lo son, y por eso el indicador es una razón entre poblaciones de eventos, no un pareo. La tabla de equivalencias documenta qué entra y qué queda fuera.
4. *¿Por qué esos dos delitos y no todos?* → Porque construí la tabla de equivalencias y ningún delito cumple los cuatro criterios. Escogí dos que se complementan: violencia familiar aporta el denominador y una no denuncia medida, y robo a conductor aporta el único mapeo 911 ↔ FGJ de confianza alta. Cubrir todos era el error del encuadre anterior.
5. *¿Y AMIS? ¿Y el robo de vehículo?* → AMIS solo publica a nivel entidad y un top-15 nacional de municipios. Pero el robo de vehículo salió del alcance por otra razón: el 911 no tiene canal para él. "Robo – Automovilista" no se relaciona espacialmente con el robo de vehículo (parcial AGEB 0.02 y −0.07); sí con el robo **a conductor** (0.42, horario 0.93). Por eso el caso de calibración es robo a conductor.
6. *¿No es falacia ecológica?* → En violencia familiar se debilita mucho: el hecho ocurre en el domicilio de la víctima, así que el AGEB del hecho es el de residencia y las covariables del AGEB describen a los hogares afectados. Por la misma razón el denominador son las viviendas habitadas y los AGEB comerciales dejan de dar tasas absurdas. Aun así, H2 se declara como asociación territorial y no individual (S5).
7. *¿Cuántas covariables puedes usar?* → A nivel AGEB hay ~2,400 unidades, no 16: el problema de grados de libertad que había con alcaldías desaparece.
8. *¿Qué pasa si H1 sale negativa?* → Es un resultado publicable y se reporta: significaría que la brecha es un fenómeno de ciudad y no territorial, y el valor del trabajo pasa a ser el método de acotamiento.
9. *¿Por qué datos del 911 de 2019–2022 y no recientes?* → El C5 no publica nada después de abril de 2022. Usé 2019 (el único año completo antes de COVID) y jul-2021 → abr-2022. Supongo que la distribución territorial de la brecha es estable en ese periodo, y lo pruebo comparando las dos ventanas. Si no lo fuera, el resultado describe ese periodo y no el presente.
10. *¿Por qué violencia familiar si ENVIPE no la mide?* → Porque es el único delito con un canal 911 denso cuyo hecho ocurre en el domicilio, y eso arregla el denominador y la falacia ecológica. Que ENVIPE no la mida no deja el caso sin calibrador: la ENDIREH 2021 sí la mide, con microdatos y diseño muestral. Mi código reproduce las cifras de INEGI a tres decimales y da 96.6% de no denuncia en CDMX para familia o pareja (IC 95.1–97.8%; 34 denuncias de 873 mujeres; CV 19.8%). El costo son dos supuestos que declaro: universo (entre 30% y 39% de las víctimas FGJ no son mujeres de 15+) y desfase (la ENDIREH cae en el hueco COVID). Los dos mueven el nivel de ciudad, no el mapa.
11. *Si ENVIPE no separa el robo a conductor, ¿cómo pruebas el método?* → Contra ENVIPE no se puede: la cota de 94.8% es de un universo más amplio y ningún resultado plausible la contradice, y lo digo así. Lo pruebo con estabilidad: si la brecha del par mejor mapeado no repite su distribución territorial entre 2019 y 2021–22 mejor que el azar, el método no da señal a grano AGEB.

---

## 7. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| "Agresión–Casa habitación" del 911 resulta ser violencia intrafamiliar, no robo | **Ocurrió** (26 sep) → **resuelto** (1 oct) | Se adoptó: la aplicación es violencia familiar, con la ENDIREH. Lo que queda es el supuesto S1 (hasta 19% de robo en el código), que se controla con la banda de sensibilidad de 2.1 |
| ~~AMIS no publica nada desagregado~~ | **Ocurrió** (26 sep) | El caso de calibración se sostiene con ENVIPE. Se pierde una fuente, no el diseño |
| ~~RESAGEBURB no une limpio con el shapefile~~ | **Descartado** (26 sep) | Une 100% |
| El 911 solo llega a abr-2022 y el 2020–21 está roto por COVID | **Ocurrió** (26 sep) | Ventana común 2019 + jul-2021 → abr-2022. Declarar el supuesto de estabilidad y probarlo (2019 vs 2021–22) en 2.1 |
| "Robo–Automovilista" cae a la mitad entre 2019 y 2022 (¿cambio de catálogo?) | **Resuelto** (26 sep) | Caída real (la FGJ cae igual), pero el código es robo **a conductor**, no de vehículo: el robo de vehículo se queda sin canal 911 |
| La calibración con violencia familiar depende de ENDIREH | **Descartado** (26 sep): sirve | 95.7% no denuncia en CDMX (IC 93.6–97.6%, CV 22.6%). Riesgos que quedan: solo 24 denuncias en la muestra (el nivel de ciudad aguanta, pero no hay que desagregarlo); 30–39% de las víctimas FGJ fuera del universo ENDIREH; periodo de referencia en el hueco COVID del 911 |
| Robo a conductor tiene menos de dos carpetas por AGEB en promedio por ventana: H3 a grano AGEB crudo sería ruido | **Ocurrió** (5 oct): a grano AGEB, en 2021–22 los 2,433 AGEB tienen conteo bajo y solo 13 se distinguen de la ciudad | **Mitigado:** la agregación se fijó el 5 oct, antes de cualquier ρ entre ventanas (§3.1): 76 grupos contiguos con ≥ 12 carpetas por ventana. **Riesgo residual:** con n = 76 solo una estabilidad moderada (ρ ≳ 0.19) supera la nula, y la periferia queda a grano de alcaldía. Si H3 sale "inestable", hay que reportarlo como falta de potencia posible, no solo como ausencia de señal |
| La clasificación de violencia familiar por AGEB depende de S1 | Media (5 oct) | 601 AGEB (≈ 14% por ventana) cambian entre una clase definida e "indistinguible" en la banda 0–19%; ninguno se invierte y el orden casi no se mueve (ρ 0.89–0.92). Marcarlos en el mapa del 2.6 con `cambia_clasif_s1` |
| Cobertura de coordenadas de violencia familiar desigual (S7) | Baja–media (5 oct) | Cuauhtémoc 87.7% en 2021–22 (97.4% en 2019) y Milpa Alta 88.9% en 2019; el resto ≥ 94.6%. Brecha potencialmente inflada hasta 14% en esos AGEB: al pie del mapa |
| Contra ENVIPE, H3 no es falsable (la cota de 94.8% no separa al conductor) | **Ocurrió** (1 oct) | H3 se reformuló como estabilidad territorial con una nula por permutación (§3.1). Decirlo en la slide 8 y en la respuesta 11, sin esconderlo |
| La brecha de violencia familiar cambia de nivel entre ventanas (la FGJ sube 1.34× y el 911 1.09×) | **Ocurrió en el nivel, no en el orden** (5 oct): 1.00 → 0.82, pero ρ entre ventanas 0.30, p = 0.001 | La prueba de estabilidad es de rangos, así que el cambio de nivel no la invalida. Si cambia el orden de los AGEB, se reporta por ventana (S4) |
| Un sinodal objeta que la ENDIREH tiene otro universo que la FGJ | Media | Respuesta 10. S2 y S3 mueven el nivel de ciudad, no la distribución territorial |
| Llegar al 15 de oct sin experimentos nuevos y repitiendo el EDA de septiembre | Media: el alcance se cerró el 1 de oct, antes del punto de decisión del 4 | La semana 2 arranca el 6 sin bloqueos. Lo que queda es no volver a abrir el alcance y congelar cifras el 11 |
| El deck se va a 14 minutos | Alta (solo queda un día de ensayo) | Ensayo cronometrado el 13. Cortar slides, no hablar más rápido |
| Clonar el repositorio sin los datos fuente impide ejecutar los notebooks de inmediato | Alta: los datos ocupan varios GB y algunos archivos superan el límite de tamaño de GitHub | Los datos se conservan fuera del repositorio; `README.md` documenta las rutas y archivos necesarios antes de ejecutar |

---

## 8. Qué no hacer

- No modelar todavía. D4 se califica en la final; meter un modelo a medias el 15 de oct resta más de lo que suma.
- No ampliar a más delitos. El comentario 4 de los profesores fue exactamente ese.
- No volver a presentar el EDA de septiembre como si fuera nuevo. La sesión califica **experimentos y resultados**: tiene que haber algo que el 14 de sep no existía.
- No usar `categoria_delito` para acotar alcance. El 86% cae en un comodín.
- No presentar SESNSP como validación: en CDMX lo reporta la misma FGJ.
