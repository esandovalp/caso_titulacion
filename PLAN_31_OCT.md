# Plan hacia la entrega final — 31 de octubre de 2026

> 15 días desde hoy (viernes 16 de oct). **Los tres entregables se entregan el 31 de oct** (confirmado con el alumno el 16 de oct; la regla de la rúbrica de "escrito una semana antes" se cumple con la entrega conjunta del 31 — *si los sinodales la exigen literalmente, el escrito se cierra el 24 y todo el calendario se corre cuatro días: ver §7, riesgo R1*).
> Sustituye a `PLAN_15_OCT.md`, que queda como registro de la revisión de avance. Contexto, inventario y cifras: `CONTEXTO_CONVERSACION.md`. Rúbrica y entregables: `CLAUDE.md`.
> Alcance, hipótesis y supuestos S1–S7 **no se reabren**: están cerrados en `PLAN_15_OCT.md` §3 y las cifras se congelaron el 11 de oct.

---

## 1. Qué cambió el 15 de oct

De la revisión de avance salen dos cosas, una de calendario y una de forma:

**Calendario.** Todo se entrega el 31 de oct: trabajo escrito (IEEE, 5–8 páginas sin referencias), aplicación funcional con repositorio público y demo en vivo, y presentación de 15–20 min + 10 de preguntas. Los tres son obligatorios; falta cualquiera ⇒ **No Acredita**.

**Forma.** La crítica fue que *la presentación no tenía estructura*, en tres sentidos concretos:

| Crítica | Qué la causó | Cómo se corrige (§6) |
|---|---|---|
| Faltaba hilo narrativo | Las 8 slides eran ocho hallazgos, cada uno autocontenido. Sin un "por lo tanto" entre una y la siguiente | Una sola cadena causal declarada en la slide 2 y repetida: *se decide con carpetas → las carpetas dependen de la denuncia → la denuncia varía en el territorio → hay que medir dónde* |
| Faltaba estructura formal visible | No había agenda, ni numeración de secciones, ni señal de en qué parte iba la exposición | Cuatro secciones numeradas con portadilla y un indicador de avance en cada slide |
| Demasiado método, poca conclusión | Las slides 5, 6 y 7 eran fuentes, mapa y pruebas; la conclusión era un pie de la slide 8 | El método baja a respaldo. Dos secciones completas (≈ 5 min) para resultado, recomendaciones y límites. D7 pesa 10% y antes tenía ~40 segundos |

**Lo que no se toca:** el contenido analítico está aceptado (D1–D3 y arranque de D4 se calificaron el 15). El trabajo de estos 15 días es **cerrar D4 con H2**, construir **D5**, y rehacer **D6** con estructura. No se reabren H1, H3, el calibrador ni el mapa.

---

## 2. Qué falta, por dimensión de la rúbrica

| Dim. | Peso | Estado | Qué falta para llegar a 4 |
|---|---|---|---|
| D1 problema | 15% | ✅ Calificado el 15 | Nada nuevo. En el escrito, la sección "Definición del problema" repite el encuadre con los supuestos del §3.2 de `PLAN_15_OCT.md` |
| D2 datos | 10% | ✅ Calificado el 15 | Una fuente nueva (RESAGEBURB, 2.2) con sus trampas documentadas en `CLAUDE.md` |
| D3 EDA | 10% | ✅ Calificado el 15 | Nada. Las hipótesis ya estaban declaradas antes de modelar, que es lo que la rúbrica premia |
| **D4 modelado** | **20%** | ⚠️ **Abierto: H2** | Regla de decisión fijada **hoy, antes de calcular** (§3). Supuestos *verificados*, no declarados: autocorrelación medida (2.5), error de medición conocido y corregido, placebo espacial |
| **D5 app** | **15%** | ⚠️ **No existe** | App de D3 + TopoJSON autocontenida (§4). **Piso de la rúbrica: operativa el día de la presentación** |
| **D6 oral** | **10%** | ⚠️ **Rehacer** | Deck de 15–20 min con estructura visible (§6) + demo en vivo |
| **D7 conclusiones** | **10%** | ⚠️ **Débil** | Recomendaciones accionables y **priorizadas**, con viabilidad e implementación (§5.5 y §6) |
| D8 escrito | 10% | ⚠️ **No existe** | 5–8 páginas IEEE doble columna, cinco secciones en orden (§5) |

**Los tres pisos que hay que vigilar**: D4 ≥ 2, D5 ≥ 2 (app operativa en vivo), D6 ≥ 2 (con demo). El escrito entregado con sus cuatro secciones es condición aparte.

---

## 3. H2 — regla fijada el 16 de octubre de 2026, antes de calcular cualquier coeficiente

**Lo único que se usó para escribir esta sección** es lo que ya está congelado: las columnas de `resultados/11_` y `13_`, el diagnóstico del 2.5 (`15_`, I de Moran 0.097 / corregido 0.245 / correlograma 1–2 km), y los nombres de las variables de RESAGEBURB. **No se ha calculado ninguna correlación ni regresión entre la brecha y ninguna covariable.** Si esta regla se escribiera después de ver un resultado, H2 dejaría de ser una prueba.

### 3.1 Hipótesis, como queda declarada

> **H2.** En violencia familiar, la brecha llamadas/carpeta por AGEB **disminuye** con la escolaridad (`GRAPROES`) y la derechohabiencia (`PDER_SS`), y **aumenta** con el hacinamiento (`PRO_OCUP_C`).

Es una hipótesis de **signo**, no de magnitud, y **territorial, no individual** (S5). Lo que se afirma es que los territorios donde más hechos llegan al 911 sin convertirse en carpeta son territorios con menos escolaridad, menos derechohabiencia y más hacinamiento. No se afirma nada sobre hogares.

### 3.2 Especificación primaria

Unidad: AGEB × ventana. Variable dependiente: **log de la brecha**, la misma escala del 2.3 (logit empírico con corrección de 0.5), porque ahí la varianza del error de medición es conocida en forma cerrada:

> log(brecha)<sub>i,w</sub> = α + δ<sub>w</sub> + β₁·z(GRAPROES)<sub>i</sub> + β₂·z(PDER_SS)<sub>i</sub> + β₃·z(PRO_OCUP_C)<sub>i</sub> + u<sub>i,w</sub>

- `z(·)` = estandarizada (media 0, DE 1) en el universo de estimación, así que cada β se lee como **el cambio en log-brecha por una desviación estándar de la covariable**, comparable entre las tres. Se reporta también como razón multiplicativa (e^β).
- δ<sub>w</sub> = efecto fijo de ventana, igual que en H1.
- **Ponderación:** mínimos cuadrados ponderados con w<sub>i,w</sub> = 1/(σ̂²<sub>ageb</sub> + v<sub>i,w</sub>), donde v<sub>i,w</sub> = 1/(llamadas+0.5) + 1/(carpetas+0.5) es la varianza binomial **conocida** y σ̂²<sub>ageb</sub> el componente entre AGEB estimado en el 2.3. Es la ponderación de una meta-regresión de efectos aleatorios. *Supuesto:* uso esta ponderación asumiendo que el ruido de conteo es binomial y que el componente residual es homogéneo entre AGEB; si el ruido fuera sobredisperso respecto al binomial, la ponderación daría demasiado peso a los AGEB chicos y la alternativa sería MCO sin pesos, que se reporta como sensibilidad.
- **Errores estándar:** espacialmente robustos tipo Conley, con kernel de Bartlett y **ancho de banda de 2 km**, elegido no por conveniencia sino porque el correlograma del 2.5 sitúa la dependencia en 1–2 km y la encuentra en cero a partir de 2 km. Se agrupa además por AGEB (dos observaciones por unidad). *Por qué así y no un modelo mixto:* el 2.5 midió la autocorrelación en los residuos y la pregunta de H2 es el **signo de β con un intervalo honesto**, no descomponer varianza otra vez; una regresión que tratara los AGEB como independientes daría errores estándar demasiado optimistas (riesgo registrado en `PLAN_15_OCT.md` §7, ocurrido el 11 de oct).

### 3.3 Universo y exclusiones (fijados antes de ver resultados)

- Universo primario: los **2,294 AGEB** del universo de H1 (≥ 1 carpeta de violencia familiar en cada ventana), menos los que no tienen covariable válida.
- Se excluyen, por S5 y por el 2.5: AGEB con `VIVPAR_HAB` = 0, con `*` de confidencialidad en cualquiera de las tres covariables, y con **< 50 viviendas** (tasas absurdas: hasta 7,250 carpetas por 1,000 viviendas contra un p99 de 44). Son 0.9% de las carpetas.
- Se excluyen los 2 AGEB sin polígono (`0901101101107`, `0901201351227`), que además no reciben eventos.
- **El conteo final de AGEB excluidos y la fracción de carpetas que representan se reportan en `12_`**, antes de correr la regresión.

### 3.4 Regla de decisión

Para **cada** covariable, por separado:

- **H2 se acepta** para esa covariable si (a) el signo de β es el predicho, (b) el intervalo de confianza 95% con errores espaciales **excluye el cero** en la especificación primaria, y (c) el signo se mantiene en **las cinco sensibilidades** del §3.5.
- **H2 se rechaza** para esa covariable si el intervalo excluye el cero **con el signo contrario** al predicho. Eso es un resultado, no un fracaso, y se reporta como tal: significaría que la fricción entre el aviso y la denuncia no se explica por carencia sino por otra cosa.
- **H2 no concluye** para esa covariable si el intervalo incluye el cero o si el signo cambia entre sensibilidades. Con autocorrelación a 1–2 km y n efectivo mucho menor que 2,294, este es un desenlace probable y hay que decirlo así, no forzar una lectura.

**Declarado de antemano:** se espera un R² pequeño. La brecha tiene mosaico de barrio a 1–2 km (I corregido 0.245) y tres covariables de AGEB no van a explicarlo. **El R² no es el criterio**; el criterio es el signo con intervalo honesto. Se reporta el R² parcial de cada covariable para que el lector juzgue la magnitud, no para defenderla.

**Multicolinealidad:** las tres covariables están correlacionadas entre sí. Se reportan el VIF y la matriz de correlación **en `12_`, antes de la regresión**. Si algún VIF supera 5, se reportan además las tres regresiones de una sola covariable, y la lectura conjunta se hace sobre esas, declarándolo.

> **Esa cláusula se activó el 16 de oct, al correr el 2.2.** `GRAPROES` y `PRO_OCUP_C` correlacionan **r = −0.93** y sus VIF son **7.54 y 7.82** (R² de 0.87 contra las otras dos); `pct_der_ss` queda separable (VIF **1.61**). Consecuencia, dentro de la regla ya fijada y sin cambiarla:
> - El **veredicto de H2 se lee sobre las tres regresiones de una sola covariable**, cada una con sus errores espaciales y sus cinco sensibilidades. La regresión conjunta se reporta igual, como referencia, con la advertencia de que no puede separar escolaridad de hacinamiento.
> - Sustantivamente, en la CDMX **escolaridad y hacinamiento son el mismo eje medido al revés**: no son dos predicciones independientes de H2, son una. Lo que H2 puede poner a prueba son **dos ejes**: un eje de carencia (escolaridad alta ↔ hacinamiento bajo) y la derechohabiencia, que sí se distingue del primero (r = 0.59 y −0.61).
> - Esto **no reabre H2** ni cambia los signos predichos: los tres siguen igual. Cambia cómo se reporta el veredicto, y el plan ya decía que se haría así.

### 3.5 Las cinco sensibilidades, y el placebo

Fijadas ahora, todas se corren y todas se reportan, salga lo que salga:

| # | Variante | Qué pone a prueba |
|---|---|---|
| V1 | Solo los **698 AGEB de conteo alto** (≥ 12 carpetas en cada ventana) | Que el resultado no lo produzca el ruido de los AGEB chicos (el 2.5 mostró que su brecha mediana es 9% más alta y que están agrupados) |
| V2 | Brecha con **19% de robo descontado** (S1) | Que no dependa de la contaminación del canal 911 |
| V3 | **Efectos fijos de alcaldía** | Que la asociación exista *dentro* de la alcaldía y no sea el gradiente centro–periferia disfrazado. Es la variante más exigente |
| V4 | **MCO sin pesos** | Que no la produzca la ponderación |
| V5 | **Bootstrap por bloques** sobre los 76 grupos contiguos del H3 (semilla 2026, 1,000 réplicas) | Un intervalo que no depende de la forma funcional del kernel espacial |
| **P** | **Placebo espacial**: 1,000 permutaciones de las covariables **restringidas dentro de alcaldía** (semilla 2026), guardando la distribución del estadístico t | Que el t observado supere el percentil 95 de una nula que **conserva la estructura espacial**. Un t grande contra una nula ingenua no significa nada con I = 0.245 |

### 3.6 Lo que H2 no puede decir, escrito antes de verla

- **No es inferencia individual** (S5). Si la violencia se concentra en subgrupos dentro del AGEB, la asociación es territorial y punto. La inferencia individual solo la da la ENDIREH, que no baja a AGEB.
- **No separa dos mecanismos** (S6). La brecha mezcla la propensión a *llamar* con la propensión a *denunciar*. Si las covariables movieran la primera, H2 estaría midiendo otra cosa. Control pendiente, declarado como trabajo futuro: las llamadas de otros motivos en el mismo AGEB como proxy de la propensión a llamar.
- **No es causal.** Tres covariables del Censo sobre dos ventanas de datos administrativos no identifican nada. El verbo en todo el reporte es *se asocia*.

### 3.7 Tareas y salidas

| # | Tarea | Salida | Día |
|---|---|---|---|
| 2.2 ✅ 16 oct | Unión de RESAGEBURB con `11_`: las tres covariables + `VIVPAR_HAB`, descriptivos, `*` y ceros, VIF, matriz de correlación, exclusiones con su fracción de carpetas. **Sin tocar la brecha** | `12_ageb_covariables_resageburb.csv` — **hecho** en `notebooks/build_eda4.py` → `EDA4_h2_covariables.ipynb`. La clave `ENTIDAD+MUN+LOC+AGEB` une **100%** (2,433 de 2,433). Universo de estimación: **2,250 AGEB** de los 2,294 (98.1%), que conservan **99.10%** de las carpetas (52,572 de 53,050); las 44 exclusiones se reparten en 25 con viviendas 0, 10 con `*` en el denominador, 19 con < 50 viviendas y 22 con covariable reservada, y **ninguna pasa de 0.51% de las carpetas**. V1 queda en **696** AGEB de conteo alto. **Colinealidad severa: r = −0.93 entre escolaridad y hacinamiento, VIF 7.54 y 7.82**; `pct_der_ss` separable (VIF 1.61) → se activa la cláusula del §3.4 | 16 oct |
| 3.1 | H2 primaria + V1–V5 + placebo P. Un `build_eda4.py` nuevo (mismo patrón `md()`/`code()`), que **lee `11_`, `12_` y `13_` y no recalcula la brecha** | `16_h2_regresion_brecha_covariables.csv` | 17–18 oct |
| 3.2 | Tres figuras: coeficientes estandarizados con IC espaciales, dispersión parcial de la covariable que resulte más informativa, y mapa de residuos | `3.2_*.png` en `resultados/figuras/` | 19 oct |

**Congelamiento de cifras: lunes 19 de oct.** Después de esa fecha no se corre ningún análisis nuevo; del 20 al 31 solo se construye app, escrito y deck con las cifras ya calculadas.

---

## 4. D5 — La aplicación

### 4.1 Qué es, y por qué no es un template

La rúbrica exige que la app esté *diseñada para este problema*. Un mapa de calor del delito sería exactamente el error que este caso denuncia. La app es lo contrario:

> **Un explorador de la brecha y de sus supuestos.** El usuario no consulta "cuánto delito hay en mi AGEB": manipula los supuestos del análisis y ve cuánto se mueve el mapa.

Eso la ata a los criterios transversales de la rúbrica: los supuestos dejan de ser un párrafo del reporte y se vuelven controles. Es también la respuesta visual a la crítica de "demasiado método": el método se *demuestra* en 90 segundos en vez de explicarse.

### 4.2 Stack

**D3 v7 + TopoJSON, autocontenida, sin red.** Los 2,433 AGEB como TopoJSON pre-proyectado, dibujados en canvas con una capa SVG encima para interacción. Sin basemap de tiles, sin API key, sin build step.

*Supuesto de diseño:* elijo cero dependencias de red asumiendo que el riesgo que importa el día de la presentación es el wifi del salón, no la fidelidad cartográfica; si hiciera falta contexto de calles (no lo hace: la unidad de análisis es el AGEB y las fronteras de alcaldía ya orientan), MapLibre GL con tiles cacheados sería más apropiado, a costa de ese riesgo.

### 4.3 Qué tiene la app

| Panel | Contenido | A qué dimensión sirve |
|---|---|---|
| Mapa | 2,433 AGEB, escala divergente ±2σ del log-brecha (×1.89 / ×0.53), igual que la figura del deck. Zoom, pan, hover con tooltip. 139 AGEB en gris sin dato | D5 |
| **Controles de supuestos** | `ventana` (2019 / 2021–22 / ambas) · `S1: % de robo descontado` (0% ↔ 19%) · `conteo bajo` (mostrar / hachurar / ocultar los 1,596) · `universo` (todos / 698 de conteo alto) | **D4, D5** — el núcleo |
| Detalle de AGEB | Al hacer clic: llamadas, carpetas, brecha con su IC 95%, clasificación bajo las dos variantes de S1, viviendas habitadas, las tres covariables, y si es de conteo bajo | D5 |
| Dispersión ligada | Brecha vs. covariable, con el AGEB seleccionado resaltado y la recta de H2. Brushing en los dos sentidos | **D4** |
| "Lo que este mapa no dice" | Panel fijo, siempre visible: la brecha no es el subregistro (S6) · es asociación territorial, no individual (S5) · el nivel de ciudad lo acota la ENDIREH en 96.5% (IC 95.1–97.8%), no el mapa · los datos son 2019 y 2021–22, no el presente | **D1, D7** |
| Contador de sensibilidad | Al mover S1: "154 AGEB cambian de clasificación; ninguno se invierte" se recalcula en vivo | D4 |

### 4.4 Pipeline y tareas

```
resultados/11_, 12_, 13_, 16_  ──  app/build_app_data.py  ──  app/data/{ageb.topo.json, brecha.json}
AGEB/593c12fd-….zip (shapefile) ──┘                                          │
                                                                    app/index.html + app/app.js
```

| # | Tarea | Salida | Día |
|---|---|---|---|
| 4.1 | `app/build_app_data.py`: shapefile → TopoJSON simplificado y pre-proyectado (objetivo: **< 1.5 MB**), más un JSON de datos por AGEB × ventana con las dos variantes de S1. Verificar que los 2,433 AGEB sobreviven la simplificación y que la clave `ageb` une 100% | `app/data/` | 20 oct |
| 4.2 | Mapa, escala, hover, clic, detalle de AGEB | `app/index.html`, `app/app.js` | 21 oct |
| 4.3 | Controles de supuestos + contador de sensibilidad | — | 22 oct |
| 4.4 | Dispersión ligada con brushing + panel de límites | — | 23 oct |
| 4.5 | Pulido: tema claro/oscuro, legible en proyector, ancho de teléfono, `README` con instrucciones de instalación (`python -m http.server`), repositorio público | — | 24 oct |

**Criterio de "operativa" (piso D5 ≥ 2):** se abre con doble clic en `index.html`, sin servidor ni internet, en la laptop de la presentación, probada el 30 de oct. El notebook ejecutable queda como respaldo del respaldo.

---

## 5. D8 — El trabajo escrito

IEEE doble columna, **5–8 páginas sin contar referencias**, cinco secciones en este orden exacto. Toolchain: **Typst con plantilla IEEE** (`brew install typst`; compila en < 1 s y no hay LaTeX instalado en la máquina). Si la plantilla diera problemas de formato, el respaldo es `tectonic` con `IEEEtran`. Decidir el 24 de oct y no después.

| § | Sección | Págs | Contenido | De dónde salen las cifras |
|---|---|---|---|---|
| 1 | **Contexto** | 1 | Cómo se decide la prevención en la CDMX (Ley del Sistema de Seguridad Ciudadana art. 13-II; los 126 cuadrantes de 847). La paradoja Benito Juárez 17% / Iztapalapa 72%. Qué hay publicado y qué no | `CONTEXTO_CONVERSACION.md` §4 |
| 2 | **Definición del problema** | 1–1.5 | La pregunta del §3 de `PLAN_15_OCT.md`. Por qué el encuadre por alcaldía no se sostiene (12/16 con CV > 30%, p = 0.84) presentado como **primer resultado**. H1, H2, H3 declaradas. El control de calidad 93.5% vs 93.2% de INEGI | ídem |
| 3 | **Supuestos** | 1–1.5 | Los siete, en el formato *uso X asumiendo Y; si Y no se cumpliera, Z* (`PLAN_15_OCT.md` §3.2), con la columna de si mueve el mapa o solo el nivel. Más los supuestos nuevos de H2 (§3.2, §3.4) | `PLAN_15_OCT.md` §3.2 + §3 de este plan |
| 4 | **Resultados y discusión** | 2–3 | H1 (4.82; IC 2.81–6.44; ICC 0.110) · H3 (ρ = 0.46; p = 0.001) y S4 (ρ = 0.30) · el mapa y el mosaico de 1–2 km (I corregido 0.245) · el acotamiento ENDIREH (96.5%; IC 95.1–97.8%; banda 92.0–98.3%) · **H2 con su veredicto por covariable** · lo que no validó (cota ENVIPE, ENSU ρ = 0.10) | `CONTEXTO_CONVERSACION.md` §4 y `16_` |
| 5 | **Conclusiones** | 1 | Las recomendaciones priorizadas del §5.5. Trabajo futuro: 911 de 2023–24 por transparencia, control de propensión a llamar, ENDIREH 2016 | §5.5 |

Figuras (máximo tres, por espacio): el mapa hero, el acercamiento de 1 km, y los coeficientes de H2. Tablas: equivalencias 911↔FGJ (reducida) y los veredictos de las tres hipótesis.

### 5.5 Las recomendaciones, priorizadas (D7)

Pendiente de redactar el 25 de oct, pero la estructura se fija ahora para que no salga como una lista de deseos. Cada una lleva: **qué hacer · quién · viabilidad · qué se necesita · qué riesgo corrige**. El orden es por relación entre impacto y costo, y la primera tiene que ser implementable sin cambiar ninguna ley. Candidatas, sujetas al resultado de H2:

1. Que el C5 y la FGJ publiquen la llave que permita cruzar folio de llamada con carpeta. Es la que destraba todo lo demás y cuesta una tabla.
2. Reanudar la publicación del 911 (nada después de abr-2022) y pedir 2023–24 por transparencia mientras eso ocurre.
3. Que la asignación de cuadrantes prioritarios reporte, junto a la incidencia, la brecha del territorio, como señal de a dónde no está llegando la denuncia.
4. Para violencia familiar específicamente: lo que el nivel de ciudad (96.5% sin denuncia) implica para el diseño de los canales de atención, no para el conteo.

---

## 6. D6 — El deck final (15–20 min + 10 de preguntas)

Responde a las tres críticas con tres decisiones de forma: **cuatro secciones numeradas con portadilla**, **un indicador de avance en cada slide** (p. ej. `2 · 4 — El método`), y **el método en respaldo**. 18 slides.

| § | Slides | Min | Qué logra | Rúbrica |
|---|---|---|---|---|
| — | 1. Portada · 2. **La cadena** | 1:30 | La cadena causal en un diagrama de cuatro eslabones, que es el hilo de todo el deck: *se decide con carpetas → las carpetas dependen de la denuncia → la denuncia varía en el territorio → nadie mide dónde*. Y la agenda de las cuatro secciones | D1, **D6** |
| **1** | 3. Portadilla · 4. El decisor · 5. La paradoja · 6. Por qué la alcaldía no alcanza | 3:00 | El problema y por qué el encuadre obvio falla, con evidencia propia (12/16, p = 0.84) | D1 |
| **2** | 7. Portadilla · 8. La bisagra · 9. Las fuentes y su límite | 2:30 | Hecho → llamada → carpeta. Qué mide la brecha y qué no. Cuatro fuentes, cuatro límites | D2, D3 |
| **3** | 10. Portadilla · 11. **El mapa** · 12. El acercamiento · 13. Las tres pruebas · 14. **H2** | 6:00 | El resultado. El mapa hero, el mosaico de 1–2 km, los veredictos de H1/H3/calibrador en una línea cada uno, y H2 con su regla pre-registrada y su veredicto | D3, **D4** |
| **4** | 15. Portadilla · 16. **Demo en vivo** · 17. **Recomendaciones** · 18. Lo que no puedo afirmar | 5:00 | La app manipulando los supuestos en vivo (90 s), las cuatro recomendaciones priorizadas, y los tres límites que mueven el mapa | **D5, D7** |

**Respaldo (≈ 15 slides):** todo el método (H1 por momentos, la nula de H3, el kernel espacial de H2, las cinco variantes del calibrador), la tabla de equivalencias, la matriz de los cinco delitos, la tabla de las 16 alcaldías, el diagnóstico del 2.5, los mapas con marcas y por ventana, y lo que no validó.

**Reglas que se conservan del 14 de oct:** ninguna slide principal con más de tres cifras impresas; cada slide de resultado dice qué implica, no cómo se calculó; el guion hablado vive en un solo `.txt` en formato Textream.

| # | Tarea | Día |
|---|---|---|
| 6.1 | Deck de 18 slides con las portadillas y el indicador de avance | 28 oct |
| 6.2 | Guion hablado (`GUION_31_OCT.txt`) + notas con minutaje y respuestas de bolsillo | 29 oct |
| 6.3 | Ensayo cronometrado a 17 min reales, **con la demo dentro del cronómetro** | 29–30 oct |
| 6.4 | Ensayo con alguien ajeno al proyecto: si no entiende la pregunta en el primer minuto, el deck sigue mal | 30 oct |
| 6.5 | Enviar slides a los sinodales (la rúbrica pide 24 h antes) | 30 oct |

---

## 7. Calendario

Las fases se traslapan a propósito: la app y el escrito se construyen con cifras congeladas, así que avanzar en paralelo no arrastra errores.

| Día | | Fase | Tarea |
|---|---|---|---|
| **16** | vie | **A · H2** | Este plan. Experimento **2.2** → `12_`. Actualizar `CLAUDE.md` y `CONTEXTO_CONVERSACION.md` |
| 17 | sáb | A | **3.1 primaria** + V3, V4 → `16_` |
| 18 | dom | A | **3.1** V1, V2, V5 y placebo P. **Veredicto de H2 por covariable** |
| 19 | lun | A | Figuras **3.2**. 🔒 **Congelar cifras** |
| 20 | mar | **B · App** | **4.1** pipeline de datos (TopoJSON < 1.5 MB) |
| 21 | mié | B | **4.2** mapa, escala, hover, detalle de AGEB |
| 22 | jue | B | **4.3** controles de supuestos + contador de sensibilidad |
| 23 | vie | B | **4.4** dispersión ligada + panel de límites |
| 24 | sáb | B + **C** | **4.5** pulido y `README`. Decidir toolchain del escrito e instalarla |
| 25 | dom | C · Escrito | Borrador de las cinco secciones (§5), completo aunque feo. Redactar las recomendaciones (§5.5) |
| 26 | lun | C | Figuras y tablas al formato IEEE. Referencias |
| 27 | mar | C | Revisión de coherencia D8: que cada sección use los mismos números y que todo supuesto citado en Resultados aparezca en Supuestos |
| 28 | mié | C → **D** | 📄 **PDF final del escrito.** Arranca el deck (**6.1**) |
| 29 | jue | D · Deck | **6.2** guion. **6.3** primer ensayo cronometrado |
| 30 | vie | D | **6.4** ensayo con público ajeno. Probar la app en la laptop de la presentación, sin internet. **6.5** enviar slides |
| **31** | sáb | — | 🎓 **Entrega de los tres + presentación** |

**Holgura real: un día** (el 24 hace doble turno). No hay margen para un experimento nuevo, y por eso el congelamiento del 19 es duro.

---

## 8. Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| **R1. Los sinodales exigen el escrito una semana antes (24 de oct)** | Media | **Preguntar hoy mismo**, no el 25. Si lo exigen: el escrito se cierra el 24 con H2 ya resuelta (lo está desde el 18), la app se corre a 25–28 y el deck a 29–30. Es factible pero elimina la holgura. Es la única pregunta de calendario que hay que hacer |
| **R2. H2 no concluye** | **Alta** | No es un problema de la entrega, es un resultado. Con I corregido de 0.245 y n efectivo chico, "no concluye" es el desenlace más probable y la regla del §3.4 ya lo contempla. Lo que **sí** sería un problema es presentarlo como si concluyera, o cambiar la regla después de verlo. El deck y el escrito están escritos para que el veredicto quepa en cualquiera de los tres estados |
| **R3. La app no está lista** | Media | Es piso de la rúbrica (D5 ≥ 2). Mitigación por construcción: al terminar el **21 de oct** ya hay algo demostrable (mapa + hover + detalle). Los controles de supuestos (4.3) son lo que la hace valer 4; la dispersión (4.4) es lo primero que se recorta si el calendario aprieta |
| **R4. El TopoJSON simplificado rompe geometrías** | Media | Verificar en 4.1 que los 2,433 AGEB sobreviven y que la unión por clave `ageb` sigue al 100%. Si la simplificación agresiva rompe polígonos, subir la tolerancia y aceptar 3–4 MB: carga local, no hay red de por medio |
| **R5. La demo en vivo falla** | Media | Sin red ni servidor por diseño (§4.2). Probada el 30 en la laptop real. Plan B: un GIF de 20 s del recorrido, incrustado en la slide 16 |
| **R6. El escrito se pasa de 8 páginas** | Alta | El material alcanza para 20. Regla: el método **no** va en el escrito más allá de una oración por hipótesis; va al repositorio, que es entregable y se cita. Si sobra una página, se gasta en Supuestos, que es lo que la rúbrica premia |
| **R7. El deck vuelve a leerse como un reporte técnico** | Media | Es la crítica del 15 de oct y el ensayo del 30 con público ajeno es la única prueba real. Regla operativa: si una slide principal necesita que expliques cómo se calculó algo, esa slide es de respaldo |
